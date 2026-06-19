class LoadBalancerQueue {
  constructor(healthManager, maxRetries = 3) {
    this.healthManager = healthManager;
    this.maxRetries = maxRetries;
    this.pendingRequests = [];
    this.isProcessing = false;
  }

  enqueue(req, res, retries = 0) {
    this.pendingRequests.push({ req, res, retries });
    this.process();
  }

  process() {
    if (this.isProcessing || this.pendingRequests.length === 0) {
      return;
    }
    this.isProcessing = true;
    this.processNext();
  }

  processNext() {
    if (this.pendingRequests.length === 0) {
      this.isProcessing = false;
      return;
    }
    this.isProcessing = false;
  }

  async getNextProxy(createProxyFn) {
    const target = await this.healthManager.getNextHealthyServer();
    if (!target) {
      return null;
    }
    return createProxyFn(target);
  }

  handleProxyError(req, res, failedTarget) {
    for (let i = 0; i < this.pendingRequests.length; i++) {
      if (this.pendingRequests[i].req === req) {
        const requestData = this.pendingRequests.splice(i, 1)[0];
        if (requestData.retries < this.maxRetries) {
          this.pendingRequests.push({
            req: requestData.req,
            res: requestData.res,
            retries: requestData.retries + 1
          });
          this.process();
        } else {
          res.status(502).json({ error: "All retries exhausted" });
        }
        break;
      }
    }
  }

  getQueueLength() {
    return this.pendingRequests.length;
  }
}

export default LoadBalancerQueue;