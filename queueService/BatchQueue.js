class BatchQueue {
  constructor(options = {}) {
    this.queue = [];
    this.isProcessing = false;
    this.batchSize = options.batchSize || 10;
    this.maxSize = options.maxSize || Infinity;
    this.flushInterval = options.flushInterval || 1000;
    this.flushTimer = null;
    this.consecutiveFailures = 0;
    this.maxBackoffMs = options.maxBackoffMs || 30000;
    // A batch that keeps failing is dropped after this many attempts so a single
    // poison event can't block every event queued behind it forever.
    this.maxAttempts = options.maxAttempts || 5;
    this.name = options.name || 'BatchQueue';
    this.droppedBatches = 0;
    this.processBatch = options.processBatch || (() => {
      throw new Error('processBatch function is required');
    });
  }

  add(jobData) {
    if (this.queue.length >= this.maxSize) {
      console.warn(`[${this.name}] queue full (maxSize=${this.maxSize}), dropping oldest item`);
      this.queue.shift();
    }
    this.queue.push(jobData);
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.processQueue(), this.flushInterval);
    }
    if (this.queue.length >= this.batchSize) {
      this.processQueue();
    }
  }

  getStats() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      consecutiveFailures: this.consecutiveFailures,
      droppedBatches: this.droppedBatches,
      batchSize: this.batchSize,
      maxSize: this.maxSize,
      flushInterval: this.flushInterval,
      maxBackoffMs: this.maxBackoffMs,
      maxAttempts: this.maxAttempts,
    };
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }
    this.isProcessing = true;
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    const batch = this.queue.splice(0, this.batchSize);
    try {
      await this.processBatch(batch);
      this.consecutiveFailures = 0;
    } catch (error) {
      this.consecutiveFailures++;
      console.error(`[${this.name}] error processing batch (attempt ${this.consecutiveFailures}/${this.maxAttempts}):`, error.message);
      if (this.consecutiveFailures >= this.maxAttempts) {
        this.droppedBatches++;
        console.error(`[${this.name}] dropping poison batch after ${this.maxAttempts} attempts:`, JSON.stringify(batch).slice(0, 500));
        this.consecutiveFailures = 0;
      } else {
        this.queue.unshift(...batch);
      }
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        if (this.consecutiveFailures > 0) {
          const backoff = Math.min(1000 * 2 ** (this.consecutiveFailures - 1), this.maxBackoffMs);
          setTimeout(() => this.processQueue(), backoff);
        } else {
          this.processQueue();
        }
      }
    }
  }

  // Used on shutdown: wait until everything queued has been processed (or timeout).
  async drain(timeoutMs = 10000) {
    const deadline = Date.now() + timeoutMs;
    while ((this.queue.length > 0 || this.isProcessing) && Date.now() < deadline) {
      if (!this.isProcessing) this.processQueue();
      await new Promise((r) => setTimeout(r, 50));
    }
    return this.queue.length === 0;
  }
}

export default BatchQueue;
