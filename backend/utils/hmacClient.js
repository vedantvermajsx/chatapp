import crypto from 'crypto';


const SERVICE_ID = process.env.SERVICE_ID || 'backend';

function sha256(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

function requireSecret() {
  const HMAC_SECRET = process.env.HMAC_SECRET;
  if (!HMAC_SECRET) throw new Error('[hmacClient] HMAC_SECRET env var is not set');
  return HMAC_SECRET;
}

export function buildSignatureHeaders(method, fullPath, body = '') {
  const HMAC_SECRET = requireSecret();
  const timestamp = Date.now().toString();
  const bodyHash = sha256(body);
  const signingString = `${method.toUpperCase()}\n${fullPath}\n${timestamp}\n${bodyHash}`;
  const signature = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(signingString, 'utf8')
    .digest('hex');

  return {
    'x-service-id': SERVICE_ID,
    'x-timestamp': timestamp,
    'x-signature': signature,
  };
}


export function attachHmacInterceptor(axiosInstance) {
  axiosInstance.interceptors.request.use((config) => {
    const method = (config.method || 'get').toUpperCase();

    let fullPath = config.url || '/';
    try {
      if (config.baseURL) {
        const baseUrl = new URL(
          config.baseURL.endsWith('/') ? config.baseURL : config.baseURL + '/'
        );
        const basePath = baseUrl.pathname.replace(/\/$/, ''); 
        const relPath = fullPath.startsWith('/') ? fullPath : '/' + fullPath;  
        fullPath = basePath + relPath; 
      }
    } catch {
    }

    let bodyStr = '';
    if (config.data !== undefined && config.data !== null) {
      bodyStr = typeof config.data === 'string' ? config.data : JSON.stringify(config.data);
    }

    const hmacHeaders = buildSignatureHeaders(method, fullPath, bodyStr);
    Object.assign(config.headers, hmacHeaders);
    return config;
  });

  axiosInstance.interceptors.response.use(undefined, async (error) => {
    const config = error.config;
    if (!config || error.response?.status !== 429) throw error;
    config.__retry429 = (config.__retry429 || 0) + 1;
    if (config.__retry429 > 3) throw error;
    const retryAfter = Number(error.response.headers?.['retry-after']);
    const delay = Math.min((retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** config.__retry429), 10000);
    await new Promise((r) => setTimeout(r, delay));
    return axiosInstance.request(config); // request interceptor re-signs with a fresh timestamp
  });
}


export function signWsMessage(msgObj) {
  const HMAC_SECRET = requireSecret();
  const timestamp = Date.now().toString();
  const payloadStr = msgObj.payload !== undefined ? JSON.stringify(msgObj.payload) : '';
  const signingString = `${msgObj.type}\n${msgObj.channel || ''}\n${timestamp}\n${payloadStr}`;
  const signature = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(signingString, 'utf8')
    .digest('hex');

  return { ...msgObj, serviceId: SERVICE_ID, timestamp, signature };
}
