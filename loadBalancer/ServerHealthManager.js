class ServerHealthManager {
  constructor(servers, cooldownMs = 3000) {
    this.servers = servers;
    this.cooldownMs = cooldownMs;
    this.serverStatus = new Map();
    this.currentIndex = 0;
    this.inFlightChecks = new Map();

    servers.forEach(server => {
      this.serverStatus.set(server, {
        healthy: true,
        lastChecked: 0
      });
    });

    this.ready = Promise.all(
      servers.map(server => this.checkServerHealth(server))
    );
  }

  static async create(servers, cooldownMs) {
    const manager = new ServerHealthManager(servers, cooldownMs);
    await manager.ready;
    return manager;
  }

  async checkServerHealth(server) {
    const status = this.serverStatus.get(server);
    const now = Date.now();

    if (!status.healthy && (now - status.lastChecked) < this.cooldownMs) {
      return status.healthy;
    }

    if (this.inFlightChecks.has(server)) {
      return this.inFlightChecks.get(server);
    }

    const checkPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${server}/health`, {
          method: "GET",
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const isHealthy = response.ok;

        this.serverStatus.set(server, {
          healthy: isHealthy,
          lastChecked: Date.now()
        });

        return isHealthy;
      } catch (err) {
        console.error(`Health check failed for ${server}:`, err.message);
        this.serverStatus.set(server, {
          healthy: false,
          lastChecked: Date.now()
        });
        return false;
      } finally {
        this.inFlightChecks.delete(server);
      }
    })();

    this.inFlightChecks.set(server, checkPromise);
    return checkPromise;
  }

  getNextHealthyServer() {
    for (let i = 0; i < this.servers.length; i++) {
      const server = this.servers[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % this.servers.length;

      if (this.serverStatus.get(server).healthy) {
        return server;
      }
    }
    return null;
  }

  markHealthy(server) {
    this.serverStatus.set(server, {
      healthy: true,
      lastChecked: Date.now()
    });
  }

  markUnhealthy(server) {
    this.serverStatus.set(server, {
      healthy: false,
      lastChecked: Date.now()
    });
  }

  getStatus() {
    return Object.fromEntries(
      Array.from(this.serverStatus.entries()).map(([server, status]) => [server, status])
    );
  }
}

export default ServerHealthManager;