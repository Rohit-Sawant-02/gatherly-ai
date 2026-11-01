/**
 * Serverless Health & Capabilities Endpoint.
 * Endpoint: GET /api/health
 */

export default function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Type', 'application/json');

  const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10);
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  res.statusCode = 200;
  res.end(JSON.stringify({
    status: 'ok',
    service: 'Gatherly AI Server',
    geminiConfigured: hasApiKey,
    model,
    timestamp: new Date().toISOString(),
  }));
}
