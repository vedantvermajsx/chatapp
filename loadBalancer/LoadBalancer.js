import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import httpProxy from 'http-proxy';
import dotenv from 'dotenv';

dotenv.config();

import ServerHealthManager from './ServerHealthManager.js';
import LoadBalancerQueue from './LoadBalancerQueue.js';

class LoadBalancer {
  constructor(servers, options = {}) {
    const {
      healthCheckCooldownMs = 30000,
      healthCheckIntervalMs = 10000 * 10,
      maxRetries = 3,
      port = 8080,
      rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
      rateLimitMaxRequests = parseInt(process.env.RATE_LIMIT_MAX, 10) || 300
    } = options;

    this.healthManager = new ServerHealthManager(
      servers,
      healthCheckCooldownMs
    );

    this.queue = new LoadBalancerQueue(
      this.healthManager,
      maxRetries
    );

    this.port = port;
    this.healthCheckIntervalMs = healthCheckIntervalMs;
    this.rateLimitWindowMs = rateLimitWindowMs;
    this.rateLimitMaxRequests = rateLimitMaxRequests;

    this.server = null;

    this.app = express();

    
    
    
    
    
    
    
    
    this.proxies = new Map();
    for (const server of servers) {
      const proxy = httpProxy.createProxyServer({
        target: server,
        changeOrigin: true,
        ws: true,
        xfwd: true
      });

      proxy.on('error', (err, req, res) => {
        console.error(
          `[${new Date().toISOString()}] [LB] Proxy error (${server}):`,
          err.message
        );
        this.healthManager.markUnhealthy(server);

        if (res && !res.headersSent && typeof res.writeHead === 'function') {
          if (res.status) {
            this.queue.handleProxyError(req, res, server);
          } else {
            res.writeHead(502);
            res.end('Bad gateway');
          }
        } else if (res && res.destroy) {
          res.destroy();
        }
      });

      proxy.on('proxyRes', (proxyRes, req) => {
        console.log(
          `[${new Date().toISOString()}] [LB] ${req.method} ${req.url} -> ${server} (${proxyRes.statusCode})`
        );
        this.healthManager.markHealthy(server);
      });

      this.proxies.set(server, proxy);
    }

    this.app.use(
      cors({
        origin: process.env.CLIENT_URL,
        methods: 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
        allowedHeaders: 'Content-Type,Authorization',
        credentials: true
      })
    );

    this.setupRequestLogger();
    this.setupRateLimiter();
    this.setupRoutes();
  }

  setupRequestLogger() {
    this.app.use((req, res, next) => {
      const start = Date.now();

      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} from ${req.ip} - Started`
      );

      res.on('finish', () => {
        console.log(
          `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${Date.now() - start}ms)`
        );
      });

      next();
    });
  }

  setupRateLimiter() {
    const limiter = rateLimit({
      windowMs: this.rateLimitWindowMs,
      max: this.rateLimitMaxRequests,
      standardHeaders: true,
      legacyHeaders: false
    });

    this.app.use(limiter);
  }

  setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({
        loadBalancer: 'healthy',
        backendServers: this.healthManager.getStatus(),
        queueLength: this.queue.getQueueLength()
      });
    });

    this.app.use(async (req, res) => {
      
      
      
      
      const isSocketIO = req.path.startsWith('/socket.io');
      let target;

      if (isSocketIO) {
        target = this.getStickyServer(this.getClientIp(req));
      } else {
        target = await this.healthManager.getNextHealthyServer();
      }

      if (!target) {
        return res.status(502).json({
          error: 'No healthy backend servers available'
        });
      }

      const proxy = this.proxies.get(target);
      proxy.web(req, res);
    });
  }

  getClientIp(req) {
    return (
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      '0.0.0.0'
    );
  }

  
  
  
  
  
  
  getStickyServer(clientIp) {
    const healthy = [...this.healthManager.servers].filter(
      (s) => this.healthManager.serverStatus.get(s)?.healthy !== false
    );

    if (healthy.length === 0) return null;

    let hash = 0;
    for (let i = 0; i < clientIp.length; i++) {
      hash = (hash * 31 + clientIp.charCodeAt(i)) >>> 0;
    }
    return healthy[hash % healthy.length];
  }

  startHealthChecks() {
    setInterval(async () => {
      for (const server of this.healthManager.servers) {
        const status = this.healthManager.serverStatus.get(server);

        if (!status.healthy) {
          await this.healthManager.checkServerHealth(server);

          if (this.healthManager.serverStatus.get(server).healthy) {
            console.log(
              `[${new Date().toISOString()}] Server restored: ${server}`
            );
            this.queue.process();
          }
        }
      }
    }, this.healthCheckIntervalMs);
  }

  start() {
    this.startHealthChecks();

    this.server = this.app.listen(this.port, () => {
      console.log(
        `[${new Date().toISOString()}] Load Balancer listening on ${this.port}`
      );
    });

    
    
    
    
    
    
    this.server.on('upgrade', (req, socket, head) => {
      const clientIp = this.getClientIp(req);
      const target = this.getStickyServer(clientIp);

      if (!target) {
        socket.destroy();
        return;
      }

      const proxy = this.proxies.get(target);

      console.log(
        `[${new Date().toISOString()}] [LB] WS Upgrade -> ${target} (${req.url}) [client: ${clientIp}]`
      );

      proxy.ws(req, socket, head);
    });
  }
}

export default LoadBalancer;
