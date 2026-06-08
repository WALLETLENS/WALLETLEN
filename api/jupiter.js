// Vercel Serverless - Jupiter PnL Proxy
// Bypasses CORS restriction on Jupiter's portfolio API

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://walletlens.dev');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { wallet } = req.query;
  if (!wallet || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  try {
    // Try multiple Jupiter endpoints
    const endpoints = [
      `https://fe-cache.jup.ag/portfolio/walletPnl?wallet=${wallet}`,
      `https://stats.jup.ag/portfolio/walletPnl?wallet=${wallet}`,
    ];
    
    for (const url of endpoints) {
      try {
        const r = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'WalletLens/1.0',
            'Origin': 'https://jup.ag'
          },
          signal: AbortSignal.timeout(5000)
        });
        if (r.ok) {
          const data = await r.json();
          res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
          return res.status(200).json(data);
        }
      } catch(e) { continue; }
    }
    return res.status(404).json({ error: 'No PnL data found' });
  } catch(e) {
    return res.status(500).json({ error: 'Jupiter API unavailable' });
  }
}
