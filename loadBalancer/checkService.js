const services = [
  "https://gatherup-now-messagebroker-service.onrender.com",
  "https://gatherup-now-loadbalancer-service.onrender.com",
  "https://gatherup-now-cache-service.onrender.com",
  "https://gatherup-now-queue-service.onrender.com"
];

async function checkService(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${url}/health`, {
      method: "GET",
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log(`[pulse] ${url} -> ${res.ok ? "UP" : "DOWN"} (${res.status})`);
  } catch (err) {
    console.log(`[pulse] ${url} -> DOWN (${err.message})`);
  }
}

function pulseCheck() {
  services.forEach(checkService);
}

export function startServicePulse(intervalMs = 5 * 60 * 1000) {
  pulseCheck();
  return setInterval(pulseCheck, intervalMs);
}