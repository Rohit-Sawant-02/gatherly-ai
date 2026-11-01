/**
 * Vercel / Antideploy Serverless Function for Google Gemini Chat.
 * Endpoint: POST /api/chat
 */

import { validateChatPayload, checkRateLimit, callGeminiAPI } from './_lib/geminiService.js';

export default async function handler(req, res) {
  // CORS & Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
    return;
  }

  // Rate Limiting by client IP
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'client';
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Retry-After', String(rateLimit.retryAfter));
    res.end(JSON.stringify({
      error: `Rate limit exceeded. Please wait ${rateLimit.retryAfter} seconds before trying again.`,
      retryAfter: rateLimit.retryAfter,
    }));
    return;
  }

  // Parse Body if needed
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Malformed JSON payload.' }));
      return;
    }
  }

  // Validate payload
  const validation = validateChatPayload(body);
  if (!validation.valid) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: validation.error }));
    return;
  }

  try {
    const result = await callGeminiAPI(validation.data);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err) {
    // Sanitize error message to prevent leaking internal stack traces or keys
    const isClientFriendly = err.message?.includes('rate limit') || err.message?.includes('GEMINI_API_KEY');
    const safeError = isClientFriendly
      ? err.message
      : 'The AI planning assistant encountered a temporary service issue. Please try again or use the local planner.';

    res.statusCode = err.message?.includes('GEMINI_API_KEY') ? 503 : 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: safeError,
      fallbackAvailable: true,
    }));
  }
}
