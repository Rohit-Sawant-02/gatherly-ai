import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateChatPayload,
  checkRateLimit,
  generateContextualSuggestions,
  callGeminiAPI,
} from '../../api/_lib/geminiService.js';

describe('Gemini Service - validateChatPayload', () => {
  it('rejects empty or whitespace-only messages', () => {
    expect(validateChatPayload({ message: '' }).valid).toBe(false);
    expect(validateChatPayload({ message: '   ' }).valid).toBe(false);
    expect(validateChatPayload(null).valid).toBe(false);
    expect(validateChatPayload('string').valid).toBe(false);
  });

  it('rejects messages longer than 2000 characters', () => {
    const hugeMessage = 'a'.repeat(2001);
    const result = validateChatPayload({ message: hugeMessage });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('maximum length');
  });

  it('validates and sanitizes a valid chat payload with event context', () => {
    const payload = {
      message: 'Where should I reduce costs for my wedding?',
      eventContext: {
        name: 'Priya & Arjun Wedding',
        occasion: 'wedding',
        budget: 800000,
        guestCount: 200,
        date: '2026-11-30',
        location: 'Mumbai Ballroom',
        priorities: { catering: 'high', venue: 'high', decor: 'medium' },
        budget_allocations: [
          { label: 'Venue', allocated: 240000, spent: 0, percentage: 30 },
          { label: 'Catering', allocated: 240000, spent: 0, percentage: 30 },
        ],
      },
      history: [
        { role: 'user', text: 'Hello' },
        { role: 'model', text: 'Hi! How can I help with your wedding?' },
      ],
    };

    const result = validateChatPayload(payload);
    expect(result.valid).toBe(true);
    expect(result.data.message).toBe('Where should I reduce costs for my wedding?');
    expect(result.data.eventContext.budget).toBe(800000);
    expect(result.data.eventContext.guestCount).toBe(200);
    expect(result.data.history).toHaveLength(2);
  });
});

describe('Gemini Service - checkRateLimit', () => {
  it('allows requests within window threshold', () => {
    const clientId = 'test-client-unique-' + Date.now();
    const first = checkRateLimit(clientId);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBeGreaterThan(0);
  });

  it('blocks when request count exceeds limit', () => {
    const clientId = 'flooder-' + Date.now();
    for (let i = 0; i < 30; i++) {
      checkRateLimit(clientId);
    }
    const blocked = checkRateLimit(clientId);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });
});

describe('Gemini Service - generateContextualSuggestions', () => {
  it('returns generic suggestions when no context is active', () => {
    const suggestions = generateContextualSuggestions(null);
    expect(suggestions.length).toBeGreaterThanOrEqual(3);
  });

  it('tailors suggestions to wedding with budget inquiry', () => {
    const suggestions = generateContextualSuggestions(
      { occasion: 'wedding', budget: 800000, guestCount: 200 },
      'Can I cut my budget?'
    );
    expect(suggestions.some(s => s.toLowerCase().includes('budget') || s.toLowerCase().includes('cut'))).toBe(true);
  });

  it('tailors suggestions to guest count surge inquiry', () => {
    const suggestions = generateContextualSuggestions(
      { occasion: 'wedding', budget: 800000, guestCount: 200 },
      'What if my guest count goes up?'
    );
    expect(suggestions.some(s => s.toLowerCase().includes('guest') || s.toLowerCase().includes('catering'))).toBe(true);
  });
});

describe('Gemini Service - callGeminiAPI Key Enforcement', () => {
  it('throws helpful error if GEMINI_API_KEY is missing', async () => {
    await expect(
      callGeminiAPI({ message: 'Hello' }, '')
    ).rejects.toThrow('GEMINI_API_KEY is not configured');
  });
});

