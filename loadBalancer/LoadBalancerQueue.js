class LoadBalancerQueue {
  constructor(healthManager, proxies, maxRetries = 3, requestTimeoutMs = 20000, maxConcurrent = 50) {
    this.healthManager = healthManager;
    this.proxies = proxies;
    this.maxRetries = maxRetries;
    this.requestTimeoutMs = requestTimeoutMs;
    this.maxConcurrent = maxConcurrent;
    this.pendingRequests = [];
    this.activeCount = 0;
  }

  enqueue(req, res, retries = 0) {
    this.pendingRequests.push({ req, res, retries });
    this._drain();
  }

  _drain() {
    while (this.activeCount < this.maxConcurrent && this.pendingRequests.length > 0) {
      const item = this.pendingRequests.shift();
      this.activeCount++;
      this._handle(item);
    }
  }

  _handle({ req, res, retries }) {
    this.healthManager.getNextHealthyServer().then((target) => {
      if (!target) {
        if (!res.headersSent) {
          res.status(502).json({ error: 'No healthy backend servers available' });
        }
        this._release();
        return;
      }

      const proxy = this.proxies.get(target);
      let settled = false;
      let watchdog;
      let onFinish, onProxyRes, onProxyError;

      const finalize = () => {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        res.removeListener('finish', onFinish);
        res.removeListener('close', onFinish);
        proxy.removeListener('proxyRes', onProxyRes);
        proxy.removeListener('error', onProxyError);
        this._release();
      };

      onFinish = () => finalize();
      onProxyRes = () => {
        this.healthManager.markHealthy(target);
        finalize();
      };
      onProxyError = (err) => {
        if (settled) return;
        console.error(`[Queue] Proxy error (${target}):`, err.message);
        this.healthManager.markUnhealthy(target);
        settled = true;
        clearTimeout(watchdog);
        res.removeListener('finish', onFinish);
        res.removeListener('close', onFinish);
        proxy.removeListener('proxyRes', onProxyRes);
        proxy.removeListener('error', onProxyError);
        
        this.activeCount--;
        if (retries < this.maxRetries) {
          this.pendingRequests.unshift({ req, res, retries: retries + 1 });
        } else if (!res.headersSent) {
          res.status(502).json({ error: 'All retries exhausted' });
        }
        this._drain();
      };
      
      res.once('finish', onFinish);
      res.once('close', onFinish);

      watchdog = setTimeout(() => {
        console.error(`[Queue] Watchdog timeout (${target}) - forcing release`);
        this.healthManager.markUnhealthy(target);
        if (!res.headersSent && res.destroy) {
          res.destroy();
        }
        finalize();
      }, this.requestTimeoutMs);

      proxy.once('proxyRes', onProxyRes);
      proxy.once('error', onProxyError);

      proxy.web(req, res, {}, (err) => {
        if (settled) return;
        onProxyError(err);
      });
    });
  }

  _release() {
    this.activeCount--;
    this._drain();
  }

  process() {
    this._drain();
  }

  handleProxyError(req, res, failedTarget) {
    const existing = this.pendingRequests.findIndex((r) => r.req === req);
    if (existing !== -1) {
      const [item] = this.pendingRequests.splice(existing, 1);
      if (item.retries < this.maxRetries) {
        this.pendingRequests.unshift({ req, res, retries: item.retries + 1 });
        this._drain();
      } else if (!res.headersSent) {
        res.status(502).json({ error: 'All retries exhausted' });
      }
    }
  }

  getQueueLength() {
    return this.pendingRequests.length;
  }

  getActiveCount() {
    return this.activeCount;
  }
}

export default LoadBalancerQueue;