/**
 *  1. InboundQueue (per-connection token bucket)
 *     Excess messages are queued and drained at a fixed rate;    
 *
 *  2. OutboundQueue (per-connection backpressure-aware sender)
 *     A slow consumer queues up its own backlog instead of blocking the publish loop.    
 */

const DEFAULT_TOKENS_PER_INTERVAL = 20;
const DEFAULT_INTERVAL_MS = 1000;
const DEFAULT_MAX_INBOUND_QUEUE = Infinity; 
const DEFAULT_MAX_BUFFERED_AMOUNT = 1024 * 1024; 
const DEFAULT_MAX_OUTBOUND_QUEUE = 200;
const DEFAULT_DRAIN_RETRY_MS = 25;

export class InboundQueue {
  constructor(ws, onMessage, options = {}) {
    this.ws = ws;
    this.onMessage = onMessage;
    this.tokensPerInterval = options.tokensPerInterval || DEFAULT_TOKENS_PER_INTERVAL;
    this.intervalMs = options.intervalMs || DEFAULT_INTERVAL_MS;
    this.maxQueueSize = options.maxQueueSize || DEFAULT_MAX_INBOUND_QUEUE;

    this.tokens = this.tokensPerInterval;
    this.queue = [];
    this.draining = false;

    this.refillTimer = setInterval(() => {
      this.tokens = this.tokensPerInterval;
      this._drain();
    }, this.intervalMs);
  }

  enqueue(rawMessage) {
    if (this.queue.length >= this.maxQueueSize) {
      this.queue.shift();
      console.warn(
        `[MessageBroker] Inbound queue full for [${this.ws.clientIp}], dropping oldest message`
      );
    }
    this.queue.push(rawMessage);
    this._drain();
  }

  _drain() {
    if (this.draining) return;
    this.draining = true;

    while (this.tokens > 0 && this.queue.length > 0) {
      const message = this.queue.shift();
      this.tokens -= 1;
      try {
        this.onMessage(message);
      } catch (err) {
        console.error(`[MessageBroker] Error processing message from [${this.ws.clientIp}]:`, err.message);
      }
    }

    this.draining = false;
  }

  getQueueLength() {
    return this.queue.length;
  }

  destroy() {
    clearInterval(this.refillTimer);
    this.queue = [];
  }
}

export class OutboundQueue {
  constructor(ws, options = {}) {
    this.ws = ws;
    this.maxBufferedAmount = options.maxBufferedAmount || DEFAULT_MAX_BUFFERED_AMOUNT;
    this.maxQueueSize = options.maxQueueSize || DEFAULT_MAX_OUTBOUND_QUEUE;
    this.drainRetryMs = options.drainRetryMs || DEFAULT_DRAIN_RETRY_MS;

    this.queue = [];
    this.sending = false;
    this.retryTimer = null;
  }

  enqueue(message) {
    if (this.ws.readyState !== 1) return; 

    if (this.queue.length >= this.maxQueueSize) {
      this.queue.shift();
      console.warn(
        `[MessageBroker] Outbound queue full for [${this.ws.clientIp}], dropping oldest message`
      );
    }

    this.queue.push(message);
    this._drain();
  }

  _drain() {
    if (this.sending) return;
    this.sending = true;
    this._sendNext();
  }

  _sendNext() {
    if (this.queue.length === 0 || this.ws.readyState !== 1) {
      this.sending = false;
      return;
    }

    if (this.ws.bufferedAmount > this.maxBufferedAmount) {
      this.retryTimer = setTimeout(() => this._sendNext(), this.drainRetryMs);
      return;
    }

    const message = this.queue.shift();
    this.ws.send(message, (err) => {
      if (err) {
        console.error(`[MessageBroker] Send error to [${this.ws.clientIp}]:`, err.message);
      }
      this._sendNext();
    });
  }

  getQueueLength() {
    return this.queue.length;
  }

  destroy() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.queue = [];
  }
}
