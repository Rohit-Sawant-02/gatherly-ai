/**
 * Client-Side AI Orchestrator for Gatherly AI.
 * 
 * Interacts with the secure server-side `/api/chat` endpoint.
 * Implements client-side query caching to avoid repeated API calls.
 * Automatically falls back to the deterministic local rule engine if the server
 * or Gemini API is offline or quota-limited, ensuring 100% application reliability.
 */

import { getAssistantResponse } from './assistant.js';
import { daysUntil, parseNumber } from './helpers.js';
import { getTaskDependencyStatus } from './tasks.js';

// Cache to prevent duplicate Gemini calls on identical questions and event state
const queryCache = new Map();
const CACHE_MAX_ENTRIES = 50;

/**
 * Creates a fast hash key from the query and active event fingerprint.
 */
function getCacheKey(message, event) {
  if (!event) return `noevent:${message.trim().toLowerCase()}`;
  return `${event.id}:${event.budget}:${event.guestCount}:${event.date}:${message.trim().toLowerCase()}`;
}

/**
 * Builds the sanitized context object sent to the server-side Gemini endpoint.
 */
function buildClientEventContext(event, tasks = [], vendors = []) {
  if (!event) return null;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const overdueTasks = tasks.filter(t => !t.completed && t.deadline && daysUntil(t.deadline) < 0).length;
  const blockedTasks = tasks.filter(t => !t.completed && getTaskDependencyStatus(t, tasks).isBlocked).length;
  const nextPending = tasks.find(t => !t.completed && !getTaskDependencyStatus(t, tasks).isBlocked);

  const eventVendors = vendors.filter(v => !v.eventId || v.eventId === event.id);
  const bookedVendors = eventVendors.filter(v => v.status === 'booked' || v.status === 'paid').length;
  const quotedVendors = eventVendors.filter(v => v.status === 'quoted').length;

  return {
    name: event.name,
    occasion: event.occasion,
    date: event.date,
    daysRemaining: daysUntil(event.date),
    guestCount: parseNumber(event.guestCount),
    budget: parseNumber(event.budget),
    location: event.location || '',
    theme: event.theme || '',
    foodPreferences: event.foodPreferences || '',
    primaryFocus: event.primaryFocus || 'balanced',
    priorities: event.priorities || {},
    budget_allocations: (event.budget_allocations || []).map(a => ({
      label: a.label || a.id,
      allocated: parseNumber(a.allocated),
      spent: parseNumber(a.spent),
      percentage: a.percentage,
    })),
    tasksSummary: {
      total: totalTasks,
      completed: completedTasks,
      overdue: overdueTasks,
      blocked: blockedTasks,
      nextAction: nextPending ? nextPending.title : 'All critical milestones cleared',
    },
    vendorsSummary: {
      total: eventVendors.length,
      booked: bookedVendors,
      quoted: quotedVendors,
    },
    recentChanges: event._recentChanges || [],
  };
}

/**
 * Sends a user query to Gatherly's AI planner.
 * First tries Google Gemini via server-side `/api/chat`.
 * Falls back gracefully to the deterministic rule-based planner if server is offline.
 */
export async function askGatherlyAI(message, activeEvent, tasks = [], vendors = [], history = []) {
  const cleanMsg = String(message || '').trim();
  if (!cleanMsg) {
    return {
      text: 'Please ask a question about your event plan, budget, or timeline.',
      suggestions: ['How should I allocate my budget?', 'What should I do first?'],
      source: 'client',
    };
  }

  // Check client-side cache
  const cacheKey = getCacheKey(cleanMsg, activeEvent);
  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey);
  }

  const eventContext = buildClientEventContext(activeEvent, tasks, vendors);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: cleanMsg,
        eventContext,
        history,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const result = {
        source: 'gemini',
        model: data.model || 'gemini-3.8-flash',
        text: data.text,
        suggestions: data.suggestions || [],
      };

      // Store in query cache
      if (queryCache.size >= CACHE_MAX_ENTRIES) {
        const firstKey = queryCache.keys().next().value;
        queryCache.delete(firstKey);
      }
      queryCache.set(cacheKey, result);

      return result;
    }

    // Server returned non-200 (e.g. rate limit, 503 missing key)
    const errorData = await response.json().catch(() => ({}));
    const notice = errorData.error || `Server returned status ${response.status}`;

    // Fall back to local rule-based planner
    const localRes = getAssistantResponse(cleanMsg, activeEvent, tasks);
    return {
      source: 'local',
      model: 'Local Smart Planner',
      text: localRes.message,
      suggestions: localRes.suggestions || [],
      notice: `${notice} — switched to offline local planning engine.`,
    };
  } catch (networkErr) {
    // Network failure, timeout, or static deployment without serverless backend
    const localRes = getAssistantResponse(cleanMsg, activeEvent, tasks);
    return {
      source: 'local',
      model: 'Local Smart Planner',
      text: localRes.message,
      suggestions: localRes.suggestions || [],
      notice: 'Server endpoint unreachable — using local offline planning engine.',
    };
  }
}

