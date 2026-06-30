class LoadBalancerQueue {
  constructor(healthManager, proxies, maxRetries = 3) {
    this.healthManager = healthManager;
    this.proxies = proxies;
    this.maxRetries = maxRetries;
    this.pendingRequests = [];
    this.isProcessing = false;
  }

  enqueue(req, res, retries = 0) {
    this.pendingRequests.push({ req, res, retries });
    if (!this.isProcessing) this._processNext();
  }

  _processNext() {
    if (this.pendingRequests.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const { req, res, retries } = this.pendingRequests.shift();

    this.healthManager.getNextHealthyServer().then((target) => {
      if (!target) {
        if (!res.headersSent) {
          res.status(502).json({ error: 'No healthy backend servers available' });
        }
        this._processNext();
        return;
      }

      const proxy = this.proxies.get(target);

      const onFinish = () => this._processNext();
      res.once('finish', onFinish);
      res.once('close', onFinish);   

      proxy.web(req, res, {}, (err) => {
        res.removeListener('finish', onFinish);
        res.removeListener('close', onFinish);

        console.error(`[Queue] Proxy error (${target}):`, err.message);
        this.healthManager.markUnhealthy(target);

        if (retries < this.maxRetries) {
          this.pendingRequests.unshift({ req, res, retries: retries + 1 });
        } else {
          if (!res.headersSent) {
            res.status(502).json({ error: 'All retries exhausted' });
          }
        }
        this._processNext();
      });
    });
  }

  process() {
    if (!this.isProcessing) this._processNext();
  }

  handleProxyError(req, res, failedTarget) {
    const existing = this.pendingRequests.findIndex((r) => r.req === req);
    if (existing !== -1) {
      const [item] = this.pendingRequests.splice(existing, 1);
      if (item.retries < this.maxRetries) {
        this.pendingRequests.unshift({ req, res, retries: item.retries + 1 });
        if (!this.isProcessing) this._processNext();
      } else {
        if (!res.headersSent) res.status(502).json({ error: 'All retries exhausted' });
      }
    }
  }

  getQueueLength() {
    return this.pendingRequests.length;
  }
}

export default LoadBalancerQueue;