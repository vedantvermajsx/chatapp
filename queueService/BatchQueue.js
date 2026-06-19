class BatchQueue {
  constructor(options = {}) {
    this.queue = [];
    this.isProcessing = false;
    this.batchSize = options.batchSize || 10;
    this.flushInterval = options.flushInterval || 1000; 
    this.flushTimer = null;
    this.consecutiveFailures = 0;
    this.maxBackoffMs = options.maxBackoffMs || 30000;
    this.processBatch = options.processBatch || (() => {
      throw new Error('processBatch function is required');
    });
  }

  add(jobData) {
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
      batchSize: this.batchSize,
      flushInterval: this.flushInterval,
      maxBackoffMs: this.maxBackoffMs
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
      console.error('Error processing batch:', error);
      this.queue.unshift(...batch);
      this.consecutiveFailures++;
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        if (this.consecutiveFailures > 0) {
          const backoff = Math.min(
            1000 * 2 ** (this.consecutiveFailures - 1),
            this.maxBackoffMs
          );
          setTimeout(() => this.processQueue(), backoff);
        } else {
          this.processQueue();
        }
      }
    }
  }
}

export default BatchQueue;
