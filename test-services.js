import { performance } from 'node:perf_hooks';

// Defaults point at the deployed services on Render; override any via env for local runs.
const SERVICES = [
  { name: 'loadBalancer', url: process.env.LB_URL || 'https://gatherup-now-loadbalancer-service.onrender.com', path: '/health' },
  { name: 'backend-svc01', url: process.env.BACKEND1_URL || 'https://gatherup-now-backend-service.onrender.com', path: '/health' },
  { name: 'cacheService', url: process.env.CACHE_URL || 'https://gatherup-now-cache-service.onrender.com', path: '/health' },
  { name: 'messagebroker', url: process.env.BROKER_URL || 'https://gatherup-now-messagebroker-service.onrender.com', path: '/health' },
  { name: 'queueService', url: process.env.QUEUE_URL || 'https://gatherup-now-queue-service.onrender.com', path: '/health' },
];

const ITERATIONS = Number(process.env.ITERATIONS || 20);
const WARMUP = Number(process.env.WARMUP || 3);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 8000);

async function timeRequest(base, path, timeoutMs) {
  const url = base.replace(/\/+$/, '') + path;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();
  try {
    const res = await fetch(url, { signal: controller.signal });
    await res.arrayBuffer();
    return { ok: res.ok, status: res.status, ms: performance.now() - start };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      ms: performance.now() - start,
      error: err.name === 'AbortError' ? 'timeout' : err.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

function percentile(sortedAsc, p) {
  if (!sortedAsc.length) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.ceil((p / 100) * sortedAsc.length) - 1);
  return sortedAsc[idx];
}

function summarize(samples) {
  const ok = samples.filter((s) => s.ok).map((s) => s.ms);
  const sorted = [...ok].sort((a, b) => a - b);
  const avg = ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : 0;
  return {
    sent: samples.length,
    ok: ok.length,
    failed: samples.length - ok.length,
    min: sorted[0] || 0,
    avg,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    max: sorted[sorted.length - 1] || 0,
    error: samples.find((s) => s.error)?.error || null,
  };
}

async function benchmark(service) {
  for (let i = 0; i < WARMUP; i++) await timeRequest(service.url, service.path, TIMEOUT_MS);
  const samples = [];
  for (let i = 0; i < ITERATIONS; i++) {
    samples.push(await timeRequest(service.url, service.path, TIMEOUT_MS));
  }
  return summarize(samples);
}

const pad = (v, n) => String(v).padEnd(n);
const num = (v) => v.toFixed(1);

function statusLabel(s) {
  if (s.ok === 0) return 'DOWN';
  if (s.failed) return `${s.ok}/${s.sent} ok`;
  return 'ok';
}

function printRow(name, s) {
  console.log(
    pad(name, 15) +
      pad(statusLabel(s), 11) +
      pad(num(s.min), 10) +
      pad(num(s.avg), 10) +
      pad(num(s.p50), 10) +
      pad(num(s.p95), 10) +
      pad(num(s.max), 10)
  );
}

async function main() {
  console.log(
    `Benchmarking ${SERVICES.length} services — ${ITERATIONS} requests each, warmup ${WARMUP}, timeout ${TIMEOUT_MS}ms\n`
  );
  console.log(
    pad('SERVICE', 15) + pad('STATUS', 11) + pad('MIN(ms)', 10) + pad('AVG(ms)', 10) + pad('P50(ms)', 10) + pad('P95(ms)', 10) + pad('MAX(ms)', 10)
  );
  console.log('-'.repeat(76));

  const results = [];
  for (const service of SERVICES) {
    const s = await benchmark(service);
    results.push({ service, s });
    printRow(service.name, s);
  }

  const up = results.filter((r) => r.s.ok > 0).sort((a, b) => b.s.avg - a.s.avg);
  if (up.length) {
    console.log('\nSlowest by avg: ' + up.map((r) => `${r.service.name} ${num(r.s.avg)}ms`).join(' > '));
  }

  const down = results.filter((r) => r.s.ok === 0);
  if (down.length) {
    console.log('Down: ' + down.map((r) => `${r.service.name} (${r.s.error || 'unreachable'})`).join(', '));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});



/*
test 1


SERVICE        STATUS     MIN(ms)   AVG(ms)   P50(ms)   P95(ms)   MAX(ms)
----------------------------------------------------------------------------
loadBalancer   ok         317.1     366.8     345.0     548.5     560.9
backend-svc01  ok         319.9     380.5     337.1     546.4     859.7
cacheService   ok         154.2     171.9     163.1     199.6     230.0     
messagebroker  ok         313.8     380.4     342.4     521.3     919.3     
queueService   DOWN       0.0       0.0       0.0       0.0       0.0       

Slowest by avg: backend-svc01 380.5ms > messagebroker 380.4ms > loadBalancer 366.8ms > cacheService 171.9ms
Down: queueService (unreachable)
 vedant@DELUSION K:\chatnow  master 




*/