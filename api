// Vercel Serverless Function - Solana RPC Proxy
// Hides QuickNode key from public HTML
 
const RPC_URL = 'https://cosmopolitan-tiniest-arm.solana-mainnet.quiknode.pro/ac776064cb8c9f4331d354e5a00fb531af49988c/';
 
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  // Basic rate limiting via headers
  res.setHeader('Access-Control-Allow-Origin', 'https://walletlens.dev');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
 
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'RPC request failed' });
  }
}
 
