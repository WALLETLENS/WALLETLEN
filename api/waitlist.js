// Vercel Serverless - Waitlist endpoint
// Stores emails server-side, forwards to Gmail via Formspree

const FORMSPREE_URL = 'https://formspree.io/f/xkoajdyr';
const submitted = new Set(); // In-memory dedup (resets on cold start, fine for beta)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://walletlens.dev');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  // Basic dedup
  const normalized = email.toLowerCase().trim();
  if (submitted.has(normalized)) {
    return res.status(200).json({ ok: true, message: 'Already on waitlist' });
  }

  try {
    const r = await fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: normalized, source: 'WalletLens Pro Waitlist', timestamp: new Date().toISOString() })
    });
    if (r.ok) {
      submitted.add(normalized);
      return res.status(200).json({ ok: true });
    }
    throw new Error('Formspree failed');
  } catch(e) {
    return res.status(500).json({ error: 'Failed to join waitlist' });
  }
}
