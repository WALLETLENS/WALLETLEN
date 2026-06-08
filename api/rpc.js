// Vercel Serverless - Solana RPC Proxy
// Protects QuickNode key, adds rate limiting + caching

const RPC_URL = 'https://cosmopolitan-tiniest-arm.solana-mainnet.quiknode.pro/ac776064cb8c9f4331d354e5a00fb531af49988c/';
const ALLOWED_METHODS = ['getSignaturesForAddress','getAccountInfo','getTransaction','getBalance','getTokenSupply','getTokenAccountsByOwner','getMultipleAccounts','getBlockTime'];
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

// Simple IP rate limiting
const ipLimits = new Map();
const IP_LIMIT = 30; // requests per minute
const IP_WINDOW = 60000;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://walletlens.dev');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // IP rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const ipData = ipLimits.get(ip) || { count: 0, reset: now + IP_WINDOW };
  if (now > ipData.reset) { ipData.count = 0; ipData.reset = now + IP_WINDOW; }
  ipData.count++;
  ipLimits.set(ip, ipData);
  if (ipData.count > IP_LIMIT) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
  }

  // Validate request body
  let body;
  try { body = req.body; } catch(e) { return res.status(400).json({ error: 'Invalid request' }); }
  if (!body?.method) return res.status(400).json({ error: 'Missing method' });

  // Whitelist RPC methods - prevent abuse
  if (!ALLOWED_METHODS.includes(body.method)) {
    return res.status(403).json({ error: `Method not allowed: ${body.method}` });
  }

  // Cache key
  const cacheKey = JSON.stringify({ method: body.method, params: body.params });
  const cached = cache.get(cacheKey);
  if (cached && (now - cached.ts) < CACHE_TTL) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cached.data);
  }

  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, id: 1, jsonrpc: '2.0' }),
    });
    const data = await response.json();
    
    // Cache successful responses
    if (!data.error) cache.set(cacheKey, { data, ts: now });
    
    // Clean old cache entries periodically
    if (cache.size > 500) {
      for (const [k, v] of cache.entries()) {
        if (now - v.ts > CACHE_TTL * 2) cache.delete(k);
      }
    }
    
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'RPC request failed', message: error.message });
  }
}
