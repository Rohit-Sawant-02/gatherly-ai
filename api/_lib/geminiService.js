/**
 * Server-side Google Gemini Integration Service for Gatherly AI.
 * 
 * SECURITY RULES:
 * - Runs exclusively server-side (Node.js runtime / serverless functions).
 * - Never expose GEMINI_API_KEY to browser bundles, client logs, or error responses.
 * - Enforces payload size limits, schema validation, and in-memory rate limiting.
 */

const SUPPORTED_MODELS = [
  'gemini-3.8-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
];

// In-memory sliding window rate limiter
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;
const ipRequestHistory = new Map();

/**
 * Clean up old rate limit records periodically
 */
function cleanupRateLimits() {
  const now = Date.now();
  for (const [ip, timestamps] of ipRequestHistory.entries()) {
    const valid = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (valid.length === 0) {
      ipRequestHistory.delete(ip);
    } else {
      ipRequestHistory.set(ip, valid);
    }
  }
}

/**
 * Checks in-memory rate limit for a client identifier (IP or token).
 */
export function checkRateLimit(clientId = 'default') {
  cleanupRateLimits();
  const now = Date.now();
  const timestamps = ipRequestHistory.get(clientId) || [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = recent[0];
    const retryAfter = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  recent.push(now);
  ipRequestHistory.set(clientId, recent);
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - recent.length };
}

/**
 * Validates and sanitizes incoming chat request payload.
 */
export function validateChatPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return { valid: false, error: 'Message cannot be empty.' };
  }
  if (message.length > 2000) {
    return { valid: false, error: 'Message exceeds maximum length of 2,000 characters.' };
  }

  // Validate eventContext if supplied
  let sanitizedContext = null;
  if (body.eventContext && typeof body.eventContext === 'object') {
    const ctx = body.eventContext;
    sanitizedContext = {
      name: typeof ctx.name === 'string' ? ctx.name.slice(0, 120) : '',
      occasion: typeof ctx.occasion === 'string' ? ctx.occasion.slice(0, 50) : '',
      date: typeof ctx.date === 'string' ? ctx.date.slice(0, 30) : '',
      daysRemaining: typeof ctx.daysRemaining === 'number' ? ctx.daysRemaining : null,
      guestCount: Math.max(0, Number(ctx.guestCount) || 0),
      budget: Math.max(0, Number(ctx.budget) || 0),
      location: typeof ctx.location === 'string' ? ctx.location.slice(0, 150) : '',
      primaryFocus: typeof ctx.primaryFocus === 'string' ? ctx.primaryFocus.slice(0, 50) : '',
      theme: typeof ctx.theme === 'string' ? ctx.theme.slice(0, 100) : '',
      foodPreferences: typeof ctx.foodPreferences === 'string' ? ctx.foodPreferences.slice(0, 150) : '',
      priorities: ctx.priorities && typeof ctx.priorities === 'object' ? ctx.priorities : {},
      budget_allocations: Array.isArray(ctx.budget_allocations)
        ? ctx.budget_allocations.slice(0, 15).map(a => ({
            label: String(a.label || a.id || '').slice(0, 50),
            allocated: Math.max(0, Number(a.allocated) || 0),
            spent: Math.max(0, Number(a.spent) || 0),
            percentage: Number(a.percentage) || 0,
          }))
        : [],
      tasksSummary: ctx.tasksSummary && typeof ctx.tasksSummary === 'object' ? ctx.tasksSummary : null,
      vendorsSummary: ctx.vendorsSummary && typeof ctx.vendorsSummary === 'object' ? ctx.vendorsSummary : null,
      recentChanges: Array.isArray(ctx.recentChanges)
        ? ctx.recentChanges.slice(0, 5).map(c => String(c).slice(0, 200))
        : [],
    };
  }

  // Validate conversation history (up to last 6 messages)
  const sanitizedHistory = [];
  if (Array.isArray(body.history)) {
    for (const h of body.history.slice(-6)) {
      if (h && typeof h === 'object') {
        const role = h.role === 'model' || h.type === 'assistant' ? 'model' : 'user';
        const text = String(h.text || h.message || '').trim().slice(0, 1500);
        if (text) {
          sanitizedHistory.push({ role, text });
        }
      }
    }
  }

  return {
    valid: true,
    data: {
      message,
      eventContext: sanitizedContext,
      history: sanitizedHistory,
    },
  };
}

/**
 * Builds system prompt and contextual content payload for Google Gemini.
 */
function buildGeminiContents(data) {
  const { message, eventContext, history } = data;

  const systemInstructions = [
    'You are Gatherly AI — an intelligent, context-aware celebration and event planning assistant.',
    'Your mission is to help users plan events (weddings, birthdays, community celebrations) with realistic budgets, practical timelines, vendor trade-offs, and change-aware recommendations.',
    '',
    'CORE PRINCIPLES & GUIDELINES:',
    '1. CONTEXTUAL AWARENESS: Always tailor your response directly to the active event details provided below. Do not give generic replies when real event parameters (budget, guests, date, priorities) are provided.',
    '2. BUDGET & TRADE-OFFS: Use Indian Rupee (₹/INR) conventions. If a budget is tight, reduced, or over-allocated, suggest concrete trade-offs (e.g. seasonal local decor vs imported flowers, DJ vs 5-piece live band, digital invitations vs luxury boxed cards) while actively protecting the user\'s high-priority categories.',
    '3. CHANGE-AWARE PLANNING: When the user asks about or has experienced a change (such as reducing budget from ₹8L to ₹6L, or increasing guests from 200 to 300, or moving the date earlier):',
    '   - Explicitly analyze what changed and explain why it impacts the plan.',
    '   - Calculate the ripple effects (e.g., catering per-plate strain, venue capacity, timeline compression).',
    '   - Suggest realistic alternatives and adjustments without restarting the entire plan.',
    '   - Preserve the user\'s existing milestones and choices.',
    '4. DEPENDENCY-AWARE TIMELINES: Understand task order (e.g., budget & venue must be secured before booking caterers, photographers, or sending formal invites).',
    '5. VENDOR QUOTATION COMPARISON: Highlight price differences, hidden charges (taxes, transport, overtime), guest capacity, itemized inclusions, and missing details the user must clarify before signing.',
    '6. HONEST ESTIMATES: Always make it clear that all prices, vendor estimates, and savings are planning estimates or illustrative suggestions, not guaranteed contract prices or verified vendor quotes.',
    '7. FORMATTING: Structure responses with clear headings, bullet points, and actionable next steps. Keep responses concise, supportive, and practical.',
  ].join('\n');

  let contextDescription = 'ACTIVE EVENT CONTEXT:\n';
  if (eventContext && eventContext.name) {
    contextDescription += `- Event: "${eventContext.name}" (${eventContext.occasion || 'Event'})\n`;
    contextDescription += `- Planned Date: ${eventContext.date || 'TBD'} (${eventContext.daysRemaining !== null ? `${eventContext.daysRemaining} days remaining` : 'Date pending'})\n`;
    contextDescription += `- Guest Count: ${eventContext.guestCount} guests\n`;
    contextDescription += `- Planned Budget: ₹${Number(eventContext.budget).toLocaleString('en-IN')}`;
    if (eventContext.guestCount > 0 && eventContext.budget > 0) {
      const perGuest = Math.round(eventContext.budget / eventContext.guestCount);
      contextDescription += ` (~₹${perGuest.toLocaleString('en-IN')} per guest)\n`;
    } else {
      contextDescription += '\n';
    }
    if (eventContext.location) contextDescription += `- Location / Venue: ${eventContext.location}\n`;
    if (eventContext.theme) contextDescription += `- Theme: ${eventContext.theme}\n`;
    if (eventContext.foodPreferences) contextDescription += `- Food Preferences: ${eventContext.foodPreferences}\n`;
    if (eventContext.primaryFocus) contextDescription += `- Primary Planning Focus: ${eventContext.primaryFocus}\n`;

    if (eventContext.priorities && Object.keys(eventContext.priorities).length > 0) {
      const pList = Object.entries(eventContext.priorities)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      contextDescription += `- Planner Category Priorities: ${pList}\n`;
    }

    if (eventContext.budget_allocations && eventContext.budget_allocations.length > 0) {
      const allocSummary = eventContext.budget_allocations
        .map(a => `${a.label}: ₹${Number(a.allocated).toLocaleString('en-IN')} (${a.percentage}%, spent: ₹${Number(a.spent).toLocaleString('en-IN')})`)
        .join('; ');
      contextDescription += `- Budget Allocations: ${allocSummary}\n`;
    }

    if (eventContext.tasksSummary) {
      const ts = eventContext.tasksSummary;
      contextDescription += `- Tasks Overview: ${ts.completed || 0}/${ts.total || 0} completed, ${ts.overdue || 0} overdue, ${ts.blocked || 0} waiting for prerequisites. Next priority: "${ts.nextAction || 'Review checklist'}"\n`;
    }

    if (eventContext.vendorsSummary) {
      const vs = eventContext.vendorsSummary;
      contextDescription += `- Vendors Status: ${vs.total || 0} total vendors recorded across categories (${vs.booked || 0} booked, ${vs.quoted || 0} quoted).\n`;
    }

    if (eventContext.recentChanges && eventContext.recentChanges.length > 0) {
      contextDescription += `- RECENT EVENT CHANGES DETECTED:\n${eventContext.recentChanges.map(c => `  * ${c}`).join('\n')}\n`;
    }
  } else {
    contextDescription += 'No active event selected yet. Provide helpful general event planning guidance and invite the user to create or select an event.\n';
  }

  // Construct Gemini API contents array
  const contents = [];

  // Add previous conversation turns
  if (history && history.length > 0) {
    for (const h of history) {
      contents.push({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }],
      });
    }
  }

  // Add current prompt augmented with context & system instructions
  const augmentedPrompt = `${systemInstructions}\n\n${contextDescription}\n\nUSER INQUIRY:\n${message}`;
  contents.push({
    role: 'user',
    parts: [{ text: augmentedPrompt }],
  });

  return contents;
}

/**
 * Calls Google Gemini API with fallback models and 15s timeout.
 */
export async function callGeminiAPI(data, apiKey = process.env.GEMINI_API_KEY) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please add your API key from Google AI Studio to .env');
  }

  const contents = buildGeminiContents(data);
  const requestedModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const modelsToTry = [requestedModel, ...SUPPORTED_MODELS.filter(m => m !== requestedModel)];

  let lastError = null;

  for (const model of modelsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        const msg = errorData.error?.message || `Gemini API returned status ${status}`;

        if (status === 404 && model !== modelsToTry[modelsToTry.length - 1]) {
          // Model deprecated or not found for key, try next model
          lastError = new Error(msg);
          continue;
        }

        if (status === 429) {
          throw new Error('Google Gemini API rate limit or quota exceeded for this minute. Please wait a moment and try again.');
        }

        throw new Error(`Gemini API error (${status}): ${msg}`);
      }

      const resData = await response.json();
      const candidate = resData.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Gemini API returned an empty response.');
      }

      // Generate dynamic follow-up suggestions based on context
      const suggestions = generateContextualSuggestions(data.eventContext, data.message);

      return {
        success: true,
        source: 'gemini',
        model,
        text,
        suggestions,
        usage: resData.usageMetadata || null,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      if (err.name === 'AbortError') {
        lastError = new Error(`Request to model ${model} timed out after 18 seconds.`);
      }
      if (err.message?.includes('rate limit') || err.message?.includes('quota')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('All supported Gemini models failed to respond.');
}

/**
 * Generates dynamic follow-up suggestions based on event context.
 */
export function generateContextualSuggestions(eventContext, currentQuery = '') {
  if (!eventContext || !eventContext.occasion) {
    return [
      'How do I create a new event plan?',
      'What are realistic budget benchmarks?',
      'How does Gatherly handle trade-offs?',
    ];
  }

  const queryLower = (currentQuery || '').toLowerCase();
  const occasion = eventContext.occasion;
  const budget = Number(eventContext.budget) || 0;
  const guests = Number(eventContext.guestCount) || 1;

  if (queryLower.includes('budget') || queryLower.includes('cut') || queryLower.includes('cost')) {
    return [
      `What happens if budget drops to ₹${Math.round(budget * 0.75).toLocaleString('en-IN')}?`,
      `How to cut ₹50,000 without affecting food?`,
      `What are the highest risk budget categories?`,
      `Review task dependencies`,
    ];
  }

  if (queryLower.includes('guest') || queryLower.includes('headcount')) {
    return [
      `Impact of adding +50 guests (to ${guests + 50})`,
      `What venue capacity is needed for ${guests} guests?`,
      `How to reduce catering cost per plate?`,
      `Compare catering quotations`,
    ];
  }

  if (occasion === 'wedding') {
    return [
      'What should I prioritize first?',
      `How to split my ₹${budget.toLocaleString('en-IN')} budget?`,
      'What trade-offs should I consider?',
      'Compare my vendor quotations',
    ];
  }

  return [
    'What tasks should I do first?',
    'How should I allocate my budget?',
    'Where can I save money?',
    'Review my vendor options',
  ];
}
