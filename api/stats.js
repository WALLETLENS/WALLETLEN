// Vercel Serverless - Analysis counter
// Tracks total wallets analyzed across all users (in-memory, resets on cold start)
// For persistence across deploys, swap to Vercel KV / Upstash Redis later
 
let totalAnalyzed = 1247; // seed with a believable starting number
let todayCount = 0;
let todayDate = new Date().toDateString();
 
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://walletlens.dev');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
 
  const today = new Date().toDateString();
  if (today !== todayDate) {
    todayDate = today;
    todayCount = 0;
  }
 
  if (req.method === 'POST') {
    totalAnalyzed++;
    todayCount++;
    return res.status(200).json({ total: totalAnalyzed, today: todayCount });
  }
 
  // GET - just return current counts
  return res.status(200).json({ total: totalAnalyzed, today: todayCount });
}
 
