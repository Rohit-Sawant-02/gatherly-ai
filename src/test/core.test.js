import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatINR,
  parseNumber,
  generateBudgetAllocations,
  generateContextualBudgetAllocations,
  recalculateBudget,
  recalculateAllocationsPreservingSpent,
  detectBudgetConflicts,
  generateTradeOffSuggestions,
  detectEventChangeConflicts,
  analyzeVendorQuotation,
  validateEvent,
  calcProgress,
  daysUntil,
  urgencyLevel,
  daysUntilLabel,
  filterVendors,
  compareVendorPrices,
  BUDGET_CATEGORIES,
  DEFAULT_PRIORITIES,
} from '../utils/helpers.js';
import { getAssistantResponse } from '../utils/assistant.js';
import { generateTasks, getTaskDependencyStatus, rescheduleTasksOnDateShift, createCustomTask } from '../utils/tasks.js';
import { KEYS, getItem, setItem, removeItem, clearAll, storageAvailable } from '../utils/storage.js';
import { validateDemoLogin, getSavedSession, saveSession, clearSession, DEMO_CREDENTIALS } from '../utils/auth.js';

// ─── Currency ───────────────────────────────────────────────────────────────

describe('formatINR', () => {
  it('formats zero', () => {
    expect(formatINR(0)).toBe('₹0');
  });
  it('formats positive integer', () => {
    const result = formatINR(50000);
    expect(result).toContain('50,000');
    expect(result).toContain('₹');
  });
  it('handles NaN gracefully', () => {
    expect(formatINR('not a number')).toBe('₹0');
  });
});

describe('parseNumber', () => {
  it('parses string numbers', () => {
    expect(parseNumber('50000')).toBe(50000);
  });
  it('parses currency strings', () => {
    expect(parseNumber('₹50,000')).toBe(50000);
  });
  it('returns 0 for empty string', () => {
    expect(parseNumber('')).toBe(0);
  });
  it('passes through numbers', () => {
    expect(parseNumber(12345)).toBe(12345);
  });
});

// ─── Budget allocation ───────────────────────────────────────────────────────

describe('generateBudgetAllocations', () => {
  it('generates correct number of categories', () => {
    const allocs = generateBudgetAllocations(100000, 'wedding');
    expect(allocs).toHaveLength(BUDGET_CATEGORIES.length);
  });

  it('allocations sum to approximately 100% of budget', () => {
    const budget = 100000;
    const allocs = generateBudgetAllocations(budget, 'wedding');
    const total = allocs.reduce((s, a) => s + a.allocated, 0);
    // Allow small rounding difference
    expect(Math.abs(total - budget)).toBeLessThan(10);
  });

  it('works for birthday occasion', () => {
    const allocs = generateBudgetAllocations(25000, 'birthday');
    expect(allocs.length).toBeGreaterThan(0);
    allocs.forEach(a => {
      expect(a.allocated).toBeGreaterThanOrEqual(0);
    });
  });

  it('handles zero budget', () => {
    const allocs = generateBudgetAllocations(0, 'birthday');
    allocs.forEach(a => {
      expect(a.allocated).toBe(0);
    });
  });
});

describe('recalculateBudget', () => {
  it('calculates total allocated and spent', () => {
    const allocs = [
      { id: 'venue', label: 'Venue', allocated: 30000, spent: 25000 },
      { id: 'catering', label: 'Catering', allocated: 40000, spent: 40000 },
    ];
    const { totalAllocated, totalSpent } = recalculateBudget(allocs);
    expect(totalAllocated).toBe(70000);
    expect(totalSpent).toBe(65000);
  });

  it('detects overspending', () => {
    const allocs = [
      { id: 'venue', label: 'Venue', allocated: 10000, spent: 15000 },
    ];
    const { totalAllocated, totalSpent } = recalculateBudget(allocs);
    expect(totalSpent).toBeGreaterThan(totalAllocated);
  });
});

// ─── Event validation ────────────────────────────────────────────────────────

describe('validateEvent', () => {
  const validEvent = {
    name: 'Test Party',
    occasion: 'birthday',
    date: '2025-12-31',
    guestCount: 50,
    budget: 30000,
  };

  it('passes valid event', () => {
    const errors = validateEvent(validEvent);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('requires name', () => {
    const errors = validateEvent({ ...validEvent, name: '' });
    expect(errors.name).toBeTruthy();
  });

  it('requires occasion', () => {
    const errors = validateEvent({ ...validEvent, occasion: '' });
    expect(errors.occasion).toBeTruthy();
  });

  it('requires date', () => {
    const errors = validateEvent({ ...validEvent, date: '' });
    expect(errors.date).toBeTruthy();
  });

  it('rejects invalid date strings', () => {
    const errors = validateEvent({ ...validEvent, date: 'not-a-valid-date' });
    expect(errors.date).toBeTruthy();
  });

  it('rejects zero guest count', () => {
    const errors = validateEvent({ ...validEvent, guestCount: 0 });
    expect(errors.guestCount).toBeTruthy();
  });

  it('rejects negative guest count', () => {
    const errors = validateEvent({ ...validEvent, guestCount: -5 });
    expect(errors.guestCount).toBeTruthy();
  });

  it('rejects zero budget', () => {
    const errors = validateEvent({ ...validEvent, budget: 0 });
    expect(errors.budget).toBeTruthy();
  });
});

// ─── Checklist & progress ────────────────────────────────────────────────────

describe('calcProgress', () => {
  it('returns 0 for no tasks', () => {
    expect(calcProgress([])).toBe(0);
  });

  it('returns 100 when all done', () => {
    const tasks = [
      { id: '1', completed: true },
      { id: '2', completed: true },
    ];
    expect(calcProgress(tasks)).toBe(100);
  });

  it('returns 50 when half done', () => {
    const tasks = [
      { id: '1', completed: true },
      { id: '2', completed: false },
    ];
    expect(calcProgress(tasks)).toBe(50);
  });

  it('returns 0 for null/undefined', () => {
    expect(calcProgress(null)).toBe(0);
    expect(calcProgress(undefined)).toBe(0);
  });
});

// ─── Date utilities ──────────────────────────────────────────────────────────

describe('daysUntil', () => {
  it('returns null for null input', () => {
    expect(daysUntil(null)).toBeNull();
  });

  it('returns null for invalid date', () => {
    expect(daysUntil('not-a-date')).toBeNull();
  });

  it('returns negative for past date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const yr = pastDate.getFullYear();
    const mo = String(pastDate.getMonth() + 1).padStart(2, '0');
    const da = String(pastDate.getDate()).padStart(2, '0');
    const result = daysUntil(`${yr}-${mo}-${da}`);
    expect(result).toBe(-5);
  });

  it('returns positive for future date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const yr = futureDate.getFullYear();
    const mo = String(futureDate.getMonth() + 1).padStart(2, '0');
    const da = String(futureDate.getDate()).padStart(2, '0');
    const result = daysUntil(`${yr}-${mo}-${da}`);
    expect(result).toBe(10);
  });

  it('returns 0 for today', () => {
    const now = new Date();
    const yr = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const da = String(now.getDate()).padStart(2, '0');
    expect(daysUntil(`${yr}-${mo}-${da}`)).toBe(0);
  });
});

describe('urgencyLevel', () => {
  it('returns "past" for negative days', () => {
    expect(urgencyLevel(-1)).toBe('past');
  });
  it('returns "critical" for 0 days', () => {
    expect(urgencyLevel(0)).toBe('critical');
  });
  it('returns "critical" for 3 days', () => {
    expect(urgencyLevel(3)).toBe('critical');
  });
  it('returns "high" for 7 days', () => {
    expect(urgencyLevel(7)).toBe('high');
  });
  it('returns "medium" for 14 days', () => {
    expect(urgencyLevel(14)).toBe('medium');
  });
  it('returns "normal" for 30 days', () => {
    expect(urgencyLevel(30)).toBe('normal');
  });
});

// ─── Task generation ─────────────────────────────────────────────────────────

describe('generateTasks', () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 60);
  const dateStr = futureDate.toISOString().slice(0, 10);

  it('generates wedding tasks', () => {
    const tasks = generateTasks('wedding', dateStr);
    expect(tasks.length).toBeGreaterThan(5);
    tasks.forEach(t => {
      expect(t.id).toBeTruthy();
      expect(t.title).toBeTruthy();
      expect(['high', 'medium', 'low']).toContain(t.priority);
      expect(t.completed).toBe(false);
    });
  });

  it('generates birthday tasks', () => {
    const tasks = generateTasks('birthday', dateStr);
    expect(tasks.length).toBeGreaterThan(3);
  });

  it('generates community tasks', () => {
    const tasks = generateTasks('community', dateStr);
    expect(tasks.length).toBeGreaterThan(3);
  });

  it('falls back to birthday for unknown type', () => {
    const tasks = generateTasks('unknown', dateStr);
    expect(tasks.length).toBeGreaterThan(0);
  });
});

// ─── Assistant responses ─────────────────────────────────────────────────────

describe('getAssistantResponse', () => {
  const weddingEvent = {
    id: '1',
    name: 'Test Wedding',
    occasion: 'wedding',
    date: '2025-12-31',
    budget: 500000,
    guestCount: 150,
  };

  const birthdayEvent = {
    id: '2',
    name: 'Test Birthday',
    occasion: 'birthday',
    date: '2025-11-15',
    budget: 20000,
    guestCount: 50,
  };

  it('responds to budget query', () => {
    const response = getAssistantResponse('What is my budget?', weddingEvent, []);
    expect(response.message).toBeTruthy();
    expect(response.message.length).toBeGreaterThan(50);
  });

  it('responds differently for wedding vs birthday budget', () => {
    const r1 = getAssistantResponse('budget tips', weddingEvent, []);
    const r2 = getAssistantResponse('budget tips', birthdayEvent, []);
    // Different events should get different budget info
    expect(r1.message).not.toBe(r2.message);
  });

  it('responds to decoration query', () => {
    const response = getAssistantResponse('Give me decoration ideas', weddingEvent, []);
    expect(response.message).toContain('Decoration');
  });

  it('responds to food query', () => {
    const response = getAssistantResponse('food planning tips', birthdayEvent, []);
    expect(response.message).toBeTruthy();
    expect(response.suggestions).toBeInstanceOf(Array);
  });

  it('provides fallback for unknown query', () => {
    const response = getAssistantResponse('xyzzy magic words', null, []);
    expect(response.message).toBeTruthy();
    expect(response.suggestions).toBeInstanceOf(Array);
  });

  it('handles null event gracefully', () => {
    expect(() => getAssistantResponse('hello', null, [])).not.toThrow();
  });

  it('includes suggestions array', () => {
    const response = getAssistantResponse('budget', weddingEvent, []);
    expect(response.suggestions).toBeInstanceOf(Array);
    expect(response.suggestions.length).toBeGreaterThan(0);
  });

  it('generates structured plan overview on plan intent', () => {
    const response = getAssistantResponse('Generate My Plan', weddingEvent, [
      { id: '1', title: 'Confirm venue', priority: 'high', completed: false },
    ]);
    expect(response.message).toContain('Tailored Plan Overview');
    expect(response.message).toContain(weddingEvent.name);
    expect(response.message).toContain('Confirm venue');
  });

  it('incorporates theme and food preferences into advice', () => {
    const themedEvent = {
      ...weddingEvent,
      theme: 'Rustic Bohemian',
      foodPreferences: 'Full Vegan Buffet',
    };
    const decorResp = getAssistantResponse('decorations', themedEvent, []);
    expect(decorResp.message).toContain('Rustic Bohemian');

    const foodResp = getAssistantResponse('food catering', themedEvent, []);
    expect(foodResp.message).toContain('Full Vegan Buffet');
  });
});

// ─── Vendor filtering & price comparison ─────────────────────────────────────

describe('filterVendors', () => {
  const vendors = [
    { id: '1', category: 'catering', status: 'booked', eventId: 'ev1' },
    { id: '2', category: 'photography', status: 'enquired', eventId: 'ev1' },
    { id: '3', category: 'catering', status: 'enquired', eventId: 'ev2' },
  ];

  it('returns all with no filters', () => {
    expect(filterVendors(vendors)).toHaveLength(3);
  });

  it('filters by category', () => {
    const result = filterVendors(vendors, { category: 'catering' });
    expect(result).toHaveLength(2);
    result.forEach(v => expect(v.category).toBe('catering'));
  });

  it('filters by status', () => {
    const result = filterVendors(vendors, { status: 'booked' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters by eventId', () => {
    const result = filterVendors(vendors, { eventId: 'ev1' });
    expect(result).toHaveLength(2);
  });

  it('combines multiple filters', () => {
    const result = filterVendors(vendors, { category: 'catering', status: 'enquired' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('returns empty for no match', () => {
    const result = filterVendors(vendors, { category: 'entertainment' });
    expect(result).toHaveLength(0);
  });
});

describe('compareVendorPrices', () => {
  const vendors = [
    { id: '1', category: 'catering', price: 50000, status: 'quoted' },
    { id: '2', category: 'catering', price: 35000, status: 'quoted' },
    { id: '3', category: 'catering', price: 45000, status: 'quoted' },
    { id: '4', category: 'photography', price: 20000, status: 'booked' },
    { id: '5', category: 'venue', price: 0, status: 'enquired' },
  ];

  it('groups vendors by category', () => {
    const comparisons = compareVendorPrices(vendors);
    expect(comparisons).toHaveLength(3);
  });

  it('calculates min, max, average and savings for a category', () => {
    const comparisons = compareVendorPrices(vendors);
    const catering = comparisons.find(c => c.category === 'catering');
    expect(catering).toBeDefined();
    expect(catering.count).toBe(3);
    expect(catering.minPrice).toBe(35000);
    expect(catering.maxPrice).toBe(50000);
    expect(catering.savings).toBe(15000); // 50000 - 35000
    expect(catering.avgPrice).toBe(Math.round((50000 + 35000 + 45000) / 3));
  });

  it('handles vendors with unquoted/zero prices', () => {
    const comparisons = compareVendorPrices(vendors);
    const venue = comparisons.find(c => c.category === 'venue');
    expect(venue.pricedCount).toBe(0);
    expect(venue.minPrice).toBe(0);
    expect(venue.savings).toBe(0);
  });
});

// ─── Storage & Persistence ──────────────────────────────────────────────────

describe('Storage & Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('checks storage availability', () => {
    expect(storageAvailable()).toBe(true);
  });

  it('sets and gets item with round-trip serialization', () => {
    const testData = [{ id: '1', name: 'Wedding Gala', budget: 500000 }];
    const ok = setItem(KEYS.EVENTS, testData);
    expect(ok).toBe(true);

    const loaded = getItem(KEYS.EVENTS, []);
    expect(loaded).toEqual(testData);
  });

  it('returns defaultValue when key is missing', () => {
    const fallback = [{ id: 'default' }];
    expect(getItem('nonexistent_key', fallback)).toBe(fallback);
  });

  it('handles corrupted JSON safely without throwing', () => {
    localStorage.setItem(KEYS.EVENTS, '{invalid-json:::corrupt');
    const fallback = [];
    expect(() => getItem(KEYS.EVENTS, fallback)).not.toThrow();
    expect(getItem(KEYS.EVENTS, fallback)).toBe(fallback);
  });

  it('removes item correctly', () => {
    setItem(KEYS.SETTINGS, { demoLoaded: true });
    expect(getItem(KEYS.SETTINGS)).toEqual({ demoLoaded: true });

    removeItem(KEYS.SETTINGS);
    expect(getItem(KEYS.SETTINGS, null)).toBeNull();
  });

  it('clears all Gatherly keys while preserving non-gatherly data', () => {
    setItem(KEYS.EVENTS, [{ id: '1' }]);
    setItem(KEYS.VENDORS, [{ id: 'v1' }]);
    localStorage.setItem('other_app_data', 'keep_me');

    clearAll();
    expect(getItem(KEYS.EVENTS, null)).toBeNull();
    expect(getItem(KEYS.VENDORS, null)).toBeNull();
    expect(localStorage.getItem('other_app_data')).toBe('keep_me');
  });

  it('persists and retrieves activeEventId', () => {
    setItem(KEYS.ACTIVE_EVENT_ID, 'evt-12345');
    expect(getItem(KEYS.ACTIVE_EVENT_ID)).toBe('evt-12345');
  });
});

describe('Occasion & Community Support', () => {
  const communityEvent = {
    id: '3',
    name: 'Green Neighborhood Fair',
    occasion: 'community',
    date: '2025-10-30',
    budget: 45000,
    guestCount: 200,
  };

  it('provides tailored community event advice', () => {
    const budgetResp = getAssistantResponse('budget breakdown', communityEvent, []);
    expect(budgetResp.message).toContain('community');
    expect(budgetResp.message).toContain('₹45,000');

    const decorResp = getAssistantResponse('decorations', communityEvent, []);
    expect(decorResp.message).toContain('Eco-friendly');
  });

  it('generates proportional community budget allocations', () => {
    const allocs = generateBudgetAllocations(communityEvent.budget, communityEvent.occasion);
    const sum = allocs.reduce((acc, a) => acc + a.allocated, 0);
    expect(Math.abs(sum - communityEvent.budget)).toBeLessThan(10);
    expect(allocs.find(a => a.id === 'venue')?.allocated).toBeGreaterThan(0);
    expect(allocs.find(a => a.id === 'catering')?.allocated).toBeGreaterThan(0);
  });
});

// ─── Task 1: Demo Login & Authentication ────────────────────────────────────

describe('Demo Login & Session Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('accepts correct fixed demo credentials', () => {
    const res = validateDemoLogin('demo@gatherly.app', 'Gatherly2026!');
    expect(res.success).toBe(true);
    expect(res.user).toBeDefined();
    expect(res.user.email).toBe('demo@gatherly.app');
  });

  it('accepts email case-insensitively', () => {
    const res = validateDemoLogin('DEMO@GATHERLY.APP', 'Gatherly2026!');
    expect(res.success).toBe(true);
  });

  it('rejects incorrect password', () => {
    const res = validateDemoLogin('demo@gatherly.app', 'WrongPassword123');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid demo credentials');
  });

  it('rejects arbitrary email addresses', () => {
    const res = validateDemoLogin('arbitrary@gmail.com', 'Gatherly2026!');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid demo credentials');
  });

  it('rejects missing or empty credentials', () => {
    expect(validateDemoLogin('', 'Gatherly2026!').success).toBe(false);
    expect(validateDemoLogin('demo@gatherly.app', '').success).toBe(false);
  });

  it('rejects malformed email format', () => {
    expect(validateDemoLogin('not-an-email', 'Gatherly2026!').success).toBe(false);
  });

  it('persists demo session in localStorage', () => {
    const loginRes = validateDemoLogin('demo@gatherly.app', 'Gatherly2026!');
    saveSession(loginRes.user);

    const session = getSavedSession();
    expect(session).not.toBeNull();
    expect(session.email).toBe('demo@gatherly.app');
  });

  it('logout removes session while completely preserving user event data', () => {
    // Seed user event data
    const existingEvents = [{ id: 'evt-1', name: 'My Sister Wedding', budget: 600000 }];
    const existingVendors = [{ id: 'v-1', name: 'Elite Decorators' }];
    setItem(KEYS.EVENTS, existingEvents);
    setItem(KEYS.VENDORS, existingVendors);

    // Save session
    saveSession({ email: 'demo@gatherly.app' });
    expect(getSavedSession()).not.toBeNull();

    // Logout
    clearSession();
    expect(getSavedSession()).toBeNull();

    // Verify event data is completely intact
    expect(getItem(KEYS.EVENTS)).toEqual(existingEvents);
    expect(getItem(KEYS.VENDORS)).toEqual(existingVendors);
  });
});

// ─── Task 2: Contextual, Connected Planning Logic ───────────────────────────

describe('Benchmark Testing Scenario: Wedding (₹8,00,000, 200 Guests, 4 Months)', () => {
  const weddingScenario = {
    id: 'benchmark-wedding',
    name: 'Priya & Arjun Wedding',
    occasion: 'wedding',
    budget: 800000,
    guestCount: 200,
    date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 4 months
    priorities: {
      catering: 'high',
      venue: 'high',
      photography: 'high',
      decorations: 'medium',
      entertainment: 'medium',
      invitations: 'medium',
      miscellaneous: 'low',
    },
  };

  it('generates contextual budget allocations summing exactly to total budget', () => {
    const allocs = generateContextualBudgetAllocations(
      weddingScenario.budget,
      weddingScenario.occasion,
      weddingScenario.guestCount,
      weddingScenario.priorities
    );

    const sum = allocs.reduce((s, a) => s + a.allocated, 0);
    expect(sum).toBe(800000);

    const venue = allocs.find(a => a.id === 'venue');
    const catering = allocs.find(a => a.id === 'catering');
    const photo = allocs.find(a => a.id === 'photography');

    expect(venue.allocated).toBeGreaterThanOrEqual(200000);
    expect(catering.allocated).toBeGreaterThanOrEqual(200000);
    expect(photo.allocated).toBeGreaterThanOrEqual(80000);
  });

  it('calculates realistic per-guest catering rates for 200 guests', () => {
    const allocs = generateContextualBudgetAllocations(
      weddingScenario.budget,
      weddingScenario.occasion,
      weddingScenario.guestCount,
      weddingScenario.priorities
    );
    const catering = allocs.find(a => a.id === 'catering');
    const ratePerGuest = Math.round(catering.allocated / weddingScenario.guestCount);

    // Realistic catering in India ranges ~₹1,000 - ₹1,500/head for weddings
    expect(ratePerGuest).toBeGreaterThanOrEqual(1000);
    expect(ratePerGuest).toBeLessThanOrEqual(1600);
  });

  it('detects over-allocation and budget conflicts correctly', () => {
    const inflatedAllocs = [
      { id: 'venue', label: 'Venue', allocated: 400000, spent: 0 },
      { id: 'catering', label: 'Food', allocated: 500000, spent: 0 }, // 900,000 total > 800,000
    ];
    const conflicts = detectBudgetConflicts(800000, inflatedAllocs, 200, 'wedding');
    const overAllocConflict = conflicts.find(c => c.type === 'over_allocated');

    expect(overAllocConflict).toBeDefined();
    expect(overAllocConflict.severity).toBe('high');
    expect(overAllocConflict.message).toContain('₹1,00,000');
  });

  it('generates priority-driven trade-offs preserving high priorities', () => {
    const allocs = generateContextualBudgetAllocations(
      weddingScenario.budget,
      weddingScenario.occasion,
      weddingScenario.guestCount,
      weddingScenario.priorities
    );
    const tradeOffs = generateTradeOffSuggestions(weddingScenario, allocs);

    expect(tradeOffs.length).toBeGreaterThan(0);
    // Decor and entertainment should be targeted for savings, not food or venue
    const targetedCategories = tradeOffs.map(t => t.categoryId);
    expect(targetedCategories).toContain('decorations');
    expect(targetedCategories).toContain('entertainment');
    expect(targetedCategories).not.toContain('catering');
    expect(targetedCategories).not.toContain('venue');
  });

  it('recalculates allocations upon budget update while preserving user spent numbers', () => {
    const originalAllocs = [
      { id: 'venue', label: 'Venue', allocated: 240000, spent: 100000 },
      { id: 'catering', label: 'Food & Catering', allocated: 240000, spent: 50000 },
      { id: 'decorations', label: 'Decorations', allocated: 120000, spent: 20000 },
      { id: 'photography', label: 'Photography', allocated: 96000, spent: 0 },
      { id: 'entertainment', label: 'Entertainment', allocated: 40000, spent: 0 },
      { id: 'invitations', label: 'Invitations', allocated: 24000, spent: 10000 },
      { id: 'miscellaneous', label: 'Miscellaneous', allocated: 40000, spent: 0 },
    ];

    // Change budget from ₹8,00,000 to ₹10,00,000
    const updated = recalculateAllocationsPreservingSpent(
      originalAllocs,
      1000000,
      'wedding',
      200,
      weddingScenario.priorities
    );

    // Sum should now equal 10,00,000
    const total = updated.reduce((s, a) => s + a.allocated, 0);
    expect(total).toBe(1000000);

    // Spent amounts MUST be preserved exactly
    expect(updated.find(a => a.id === 'venue').spent).toBe(100000);
    expect(updated.find(a => a.id === 'catering').spent).toBe(50000);
    expect(updated.find(a => a.id === 'decorations').spent).toBe(20000);
    expect(updated.find(a => a.id === 'invitations').spent).toBe(10000);
  });

  it('detects event conflicts when date is compressed or guests increase', () => {
    const oldEvent = { ...weddingScenario, date: '2026-06-30', guestCount: 200, budget: 800000 };
    const compressedEvent = { ...weddingScenario, date: '2026-04-15', guestCount: 250, budget: 700000 };

    const conflicts = detectEventChangeConflicts(oldEvent, compressedEvent);
    expect(conflicts.length).toBeGreaterThanOrEqual(2);

    const guestConflict = conflicts.find(c => c.type === 'guest_increase');
    expect(guestConflict).toBeDefined();
    expect(guestConflict.message).toContain('+50 guests');
  });
});

// ─── Task 2D: Dependency-Aware Tasks ────────────────────────────────────────

describe('Dependency-Aware Timeline & Checklist', () => {
  const weddingTasks = generateTasks('wedding', '2026-10-31');

  it('assigns dependency codes to interrelated tasks', () => {
    const venueTask = weddingTasks.find(t => t.code === 'venue');
    const catererTask = weddingTasks.find(t => t.code === 'caterer');
    const inviteTask = weddingTasks.find(t => t.code === 'invites');

    expect(catererTask.dependsOn).toContain('venue');
    expect(inviteTask.dependsOn).toContain('venue');
    expect(inviteTask.dependsOn).toContain('guest_list');
  });

  it('identifies blocked tasks when prerequisites are incomplete', () => {
    const catererTask = weddingTasks.find(t => t.code === 'caterer');
    const status = getTaskDependencyStatus(catererTask, weddingTasks);

    expect(status.isBlocked).toBe(true);
    expect(status.pendingPrerequisites).toContain('Book venue & confirm date');
  });

  it('unblocks task when all prerequisites are marked complete', () => {
    const modifiedTasks = weddingTasks.map(t =>
      t.code === 'venue' ? { ...t, completed: true } : t
    );
    const catererTask = modifiedTasks.find(t => t.code === 'caterer');
    const status = getTaskDependencyStatus(catererTask, modifiedTasks);

    expect(status.isBlocked).toBe(false);
    expect(status.pendingPrerequisites).toHaveLength(0);
  });

  it('reschedules task deadlines when event date shifts', () => {
    const oldDate = '2026-10-31';
    const newEarlierDate = '2026-09-15'; // 46 days earlier
    const res = rescheduleTasksOnDateShift(weddingTasks, newEarlierDate, oldDate);

    expect(res.updatedTasks).toHaveLength(weddingTasks.length);
    // Task offset of -14 should now calculate from newEarlierDate
    const confirmTask = res.updatedTasks.find(t => t.code === 'vendors_confirm');
    expect(confirmTask.deadline).toBe('2026-09-01');
  });
});

// ─── Task 2E: Vendor Quotation Comparison ───────────────────────────────────

describe('Vendor Quotation Comparison with Capacities & Inclusions', () => {
  const vendors = [
    {
      id: 'v1',
      category: 'catering',
      name: 'Budget Feasts',
      price: 200000,
      guestCapacity: 200,
      additionalCharges: 10000,
      servicesIncluded: 'Buffet lunch, cutlery, basic servers',
      contact: '9876543210',
      status: 'quoted',
    },
    {
      id: 'v2',
      category: 'catering',
      name: 'Royal Banquets',
      price: 260000,
      guestCapacity: 200,
      additionalCharges: 20000,
      servicesIncluded: 'Live counters, chaat, 4-course dinner, uniforms',
      contact: '9812345678',
      status: 'quoted',
    },
    {
      id: 'v3',
      category: 'catering',
      name: 'Incomplete Caterer',
      price: 0,
      guestCapacity: 0,
      additionalCharges: null,
      servicesIncluded: '',
      contact: '',
      status: 'enquired',
    },
  ];

  it('analyzes base price, additional charges, and effective total', () => {
    const analyzed = analyzeVendorQuotation(vendors[0]);
    expect(analyzed.effectivePrice).toBe(210000); // 200,000 + 10,000
    expect(analyzed.pricePerGuest).toBe(1000); // 200,000 / 200
  });

  it('identifies missing quotation details for user clarification', () => {
    const incomplete = analyzeVendorQuotation(vendors[2]);
    expect(incomplete.hasMissingDetails).toBe(true);
    expect(incomplete.missingDetails).toContain('Quoted base price missing');
    expect(incomplete.missingDetails).toContain('Direct contact details missing');
    expect(incomplete.missingDetails).toContain('Guest capacity / pax count not specified');
    expect(incomplete.missingDetails).toContain('Itemized service inclusions not listed');
  });

  it('compares vendor quotations across a category', () => {
    const comparisons = compareVendorPrices(vendors);
    const cateringGroup = comparisons.find(c => c.category === 'catering');

    expect(cateringGroup).toBeDefined();
    expect(cateringGroup.minPrice).toBe(200000);
    expect(cateringGroup.maxPrice).toBe(260000);
    expect(cateringGroup.savings).toBe(60000);
    expect(cateringGroup.minEffectivePrice).toBe(210000);
  });
});

// ─── Task 3: Contextual Assistant ───────────────────────────────────────────

describe('Contextual Assistant Intelligence', () => {
  const weddingEvent = {
    id: 'test-wedding-scenario',
    name: 'Priya & Arjun Wedding',
    occasion: 'wedding',
    budget: 800000,
    guestCount: 200,
    date: '2026-11-30',
    priorities: {
      catering: 'high',
      venue: 'high',
      photography: 'high',
      decorations: 'medium',
      entertainment: 'medium',
      invitations: 'low',
    },
    budget_allocations: generateContextualBudgetAllocations(800000, 'wedding', 200),
  };

  const tasks = generateTasks('wedding', '2026-11-30');

  it('responds with concrete trade-off suggestions protecting high priorities', () => {
    const response = getAssistantResponse('Where can I cut expenses or trade off?', weddingEvent, tasks);
    expect(response.message).toContain('Trade-Off');
    // High priority catering and venue are protected
    expect(response.message).toContain('Decorations');
  });

  it('explains task dependency sequence', () => {
    const response = getAssistantResponse('What should I do first and what are the dependencies?', weddingEvent, tasks);
    expect(response.message).toContain('Dependency');
    expect(response.message).toContain('Venue & Date Lock');
  });

  it('explains guest count ripple effect on catering and budget', () => {
    const response = getAssistantResponse('What happens if my guest count increases?', weddingEvent, tasks);
    expect(response.message).toContain('Guest Count & Capacity Ripple Effect');
    expect(response.message).toContain('200 guests');
    expect(response.message).toContain('+50 Guests');
  });

  it('handles unsupported queries with helpful structured guidance', () => {
    const response = getAssistantResponse('Can you predict tomorrow stock prices?', weddingEvent, tasks);
    expect(response.message).toContain('I specialize in deterministic event planning logic');
    expect(response.suggestions.length).toBeGreaterThanOrEqual(3);
  });
});



