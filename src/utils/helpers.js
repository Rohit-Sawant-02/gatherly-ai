// Currency, date, and event utility functions

// ─── Currency ───────────────────────────────────────────────────────────────

export function formatINR(amount) {
  const num = Number(amount);
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function parseNumber(str) {
  if (typeof str === 'number') return str;
  const cleaned = String(str).replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

// ─── Date helpers ────────────────────────────────────────────────────────────

export function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

export function toLocalDateString(d = new Date()) {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysUntil(dateStr) {
  const target = parseDate(dateStr);
  if (!target) return null;
  const t = today();
  const diff = Math.round((target.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function formatDate(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatShortDate(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function addDays(dateStr, days) {
  const d = parseDate(dateStr);
  if (!d) return null;
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  const year = result.getFullYear();
  const month = String(result.getMonth() + 1).padStart(2, '0');
  const day = String(result.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysUntilLabel(days) {
  if (days === null) return 'Unknown';
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`;
  if (days === 0) return 'Today!';
  if (days === 1) return 'Tomorrow';
  return `${days} days away`;
}

export function urgencyLevel(days) {
  if (days === null) return 'normal';
  if (days < 0) return 'past';
  if (days === 0) return 'critical';
  if (days <= 3) return 'critical';
  if (days <= 7) return 'high';
  if (days <= 14) return 'medium';
  return 'normal';
}

// ─── ID generation ───────────────────────────────────────────────────────────

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Budget allocation ───────────────────────────────────────────────────────

/**
 * Default percentage allocations by category per event type.
 * These are illustrative estimates, not market quotes.
 */
const ALLOCATION_RULES = {
  wedding: {
    venue: 30,
    catering: 30,
    decorations: 15,
    photography: 12,
    entertainment: 5,
    invitations: 3,
    miscellaneous: 5,
  },
  birthday: {
    venue: 20,
    catering: 35,
    decorations: 20,
    photography: 10,
    entertainment: 8,
    invitations: 2,
    miscellaneous: 5,
  },
  community: {
    venue: 25,
    catering: 30,
    decorations: 15,
    photography: 8,
    entertainment: 12,
    invitations: 5,
    miscellaneous: 5,
  },
};

export const DEFAULT_PRIORITIES = {
  wedding: {
    catering: 'high',
    venue: 'high',
    photography: 'high',
    decorations: 'medium',
    entertainment: 'medium',
    invitations: 'medium',
    miscellaneous: 'low',
  },
  birthday: {
    catering: 'high',
    decorations: 'high',
    entertainment: 'medium',
    venue: 'medium',
    photography: 'low',
    invitations: 'low',
    miscellaneous: 'low',
  },
  community: {
    catering: 'high',
    venue: 'high',
    entertainment: 'medium',
    decorations: 'medium',
    invitations: 'medium',
    photography: 'low',
    miscellaneous: 'low',
  },
};

const PRIORITY_MULTIPLIERS = {
  high: 1.25,
  medium: 1.0,
  low: 0.75,
};

export const BUDGET_CATEGORIES = [
  { id: 'venue', label: 'Venue' },
  { id: 'catering', label: 'Food & Catering' },
  { id: 'decorations', label: 'Decorations' },
  { id: 'photography', label: 'Photography' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'invitations', label: 'Invitations' },
  { id: 'miscellaneous', label: 'Miscellaneous' },
];

/**
 * Generate contextual budget allocations accounting for total budget,
 * event occasion, expected guest count, and planner priorities.
 */
export function generateContextualBudgetAllocations(totalBudget, eventType, guestCount = 100, priorities = {}) {
  const budget = Math.max(0, parseNumber(totalBudget));
  const guests = Math.max(1, parseNumber(guestCount));
  const rules = ALLOCATION_RULES[eventType] || ALLOCATION_RULES.birthday;
  const defPriorities = DEFAULT_PRIORITIES[eventType] || DEFAULT_PRIORITIES.birthday;
  const mergedPriorities = { ...defPriorities, ...priorities };

  // Calculate weighted shares
  const rawShares = {};
  let totalShare = 0;

  BUDGET_CATEGORIES.forEach(cat => {
    const basePct = rules[cat.id] || 5;
    const priority = mergedPriorities[cat.id] || 'medium';
    const mult = PRIORITY_MULTIPLIERS[priority] || 1.0;
    let share = basePct * mult;

    // Guest count sensitivity for catering and invitations
    if (cat.id === 'catering' && guests > 150 && eventType === 'wedding') {
      share *= 1.08; // scale up catering demand for large guest counts
    }
    if (cat.id === 'invitations' && guests > 200) {
      share *= 1.15;
    }

    rawShares[cat.id] = share;
    totalShare += share;
  });

  // Normalize percentages to sum to exactly 100%
  let runningAllocated = 0;
  const allocations = BUDGET_CATEGORIES.map((cat, idx) => {
    const rawPct = (rawShares[cat.id] / totalShare) * 100;
    const isLast = idx === BUDGET_CATEGORIES.length - 1;
    let allocated = 0;

    if (budget > 0) {
      if (isLast) {
        allocated = Math.max(0, budget - runningAllocated);
      } else {
        allocated = Math.round((rawPct / 100) * budget);
        runningAllocated += allocated;
      }
    }

    const effectivePct = budget > 0 ? Math.round((allocated / budget) * 100) : Math.round(rawPct);

    return {
      id: cat.id,
      label: cat.label,
      allocated,
      spent: 0,
      percentage: effectivePct,
      priority: mergedPriorities[cat.id] || 'medium',
      isEstimate: true,
    };
  });

  return allocations;
}

/**
 * Backwards compatible generator.
 */
export function generateBudgetAllocations(totalBudget, eventType, guestCount = 100, priorities = {}) {
  return generateContextualBudgetAllocations(totalBudget, eventType, guestCount, priorities);
}

/**
 * Recalculate allocations when budget or guest count changes, preserving user-entered spent numbers.
 */
export function recalculateAllocationsPreservingSpent(oldAllocations = [], newBudget, eventType, guestCount = 100, priorities = {}) {
  const fresh = generateContextualBudgetAllocations(newBudget, eventType, guestCount, priorities);
  return fresh.map(item => {
    const existing = oldAllocations.find(a => a.id === item.id);
    return {
      ...item,
      spent: existing ? parseNumber(existing.spent) : 0,
    };
  });
}

export function recalculateBudget(allocations = []) {
  const totalAllocated = allocations.reduce((s, a) => s + parseNumber(a.allocated), 0);
  const totalSpent = allocations.reduce((s, a) => s + parseNumber(a.spent), 0);
  return { totalAllocated, totalSpent };
}

/**
 * Detect budget conflicts, per-guest food strain, and over-allocation.
 */
export function detectBudgetConflicts(totalBudget, allocations = [], guestCount = 0, eventType = 'wedding') {
  const budget = parseNumber(totalBudget);
  const guests = Math.max(0, parseNumber(guestCount));
  const { totalAllocated, totalSpent } = recalculateBudget(allocations);
  const conflicts = [];

  // Over-allocated check
  if (totalAllocated > budget && budget > 0) {
    conflicts.push({
      type: 'over_allocated',
      severity: 'high',
      title: 'Allocations Exceed Budget',
      message: `Allocated categories total ${formatINR(totalAllocated)}, exceeding your available budget by ${formatINR(totalAllocated - budget)}.`,
      suggestedFix: 'Rebalance allocations to prevent silent budget overruns.',
    });
  }

  // Under-allocated check
  if (totalAllocated < budget && budget > 0) {
    conflicts.push({
      type: 'under_allocated',
      severity: 'info',
      title: 'Unallocated Budget Buffer',
      message: `${formatINR(budget - totalAllocated)} remains unallocated. Keep as emergency contingency or distribute to key priorities.`,
      suggestedFix: 'Retain as 5–10% contingency reserve.',
    });
  }

  // Over-spent check
  if (totalSpent > budget && budget > 0) {
    conflicts.push({
      type: 'over_spent',
      severity: 'critical',
      title: 'Actual Spend Exceeded Budget',
      message: `Total spent (${formatINR(totalSpent)}) has exceeded your planned budget by ${formatINR(totalSpent - budget)}.`,
      suggestedFix: 'Review pending vendor contracts to reduce upcoming expenses.',
    });
  }

  // Per-guest catering adequacy check
  if (guests > 0 && budget > 0) {
    const catering = allocations.find(a => a.id === 'catering');
    const cateringAlloc = catering ? parseNumber(catering.allocated) : 0;
    const perGuestCatering = Math.round(cateringAlloc / guests);

    const benchmarks = {
      wedding: { min: 800, recommended: 1200 },
      birthday: { min: 300, recommended: 550 },
      community: { min: 150, recommended: 300 },
    };
    const bm = benchmarks[eventType] || benchmarks.wedding;

    if (perGuestCatering < bm.min) {
      conflicts.push({
        type: 'catering_tight',
        severity: 'medium',
        title: 'Catering Per-Head Strained',
        message: `At ${formatINR(perGuestCatering)} per guest for catering (${guests} guests), your food budget is below typical ${eventType} estimates (min ${formatINR(bm.min)}/guest).`,
        suggestedFix: 'Consider simplifying course count or reallocating from low-priority decor/entertainment.',
      });
    }
  }

  return conflicts;
}

/**
 * Generate priority-driven trade-off recommendations when budget is tight or over-allocated.
 */
export function generateTradeOffSuggestions(event, allocations = []) {
  if (!event) return [];
  const budget = parseNumber(event.budget);
  const guests = Math.max(1, parseNumber(event.guestCount));
  const occasion = event.occasion || 'wedding';
  const priorities = event.priorities || DEFAULT_PRIORITIES[occasion] || {};
  const { totalAllocated } = recalculateBudget(allocations);

  const suggestions = [];

  // Protect high priorities
  const highPriorityNames = BUDGET_CATEGORIES
    .filter(c => (priorities[c.id] || 'medium') === 'high')
    .map(c => c.label);

  const decor = allocations.find(a => a.id === 'decorations');
  const decorAlloc = decor ? parseNumber(decor.allocated) : 0;
  if (decorAlloc > 20000 && (priorities.decorations !== 'high')) {
    const saving = Math.round(decorAlloc * 0.30);
    suggestions.push({
      categoryId: 'decorations',
      categoryLabel: 'Decorations',
      priority: priorities.decorations || 'medium',
      saving,
      rationale: 'Switch from imported exotic floral installations to seasonal local marigold/jasmine arrangements and reusable lighting.',
      tradeoff: `Saves ~${formatINR(saving)} while protecting core priorities (${highPriorityNames.slice(0, 2).join(' & ')}).`,
    });
  }

  const entertainment = allocations.find(a => a.id === 'entertainment');
  const entAlloc = entertainment ? parseNumber(entertainment.allocated) : 0;
  if (entAlloc > 15000 && (priorities.entertainment !== 'high')) {
    const saving = Math.round(entAlloc * 0.40);
    suggestions.push({
      categoryId: 'entertainment',
      categoryLabel: 'Entertainment',
      priority: priorities.entertainment || 'medium',
      saving,
      rationale: 'Opt for a curated DJ sound package and custom playlist instead of a 5-piece live musical band.',
      tradeoff: `Saves ~${formatINR(saving)} without impacting guest enjoyment or food quality.`,
    });
  }

  const invites = allocations.find(a => a.id === 'invitations');
  const inviteAlloc = invites ? parseNumber(invites.allocated) : 0;
  if (inviteAlloc > 8000 && (priorities.invitations !== 'high')) {
    const saving = Math.round(inviteAlloc * 0.60);
    suggestions.push({
      categoryId: 'invitations',
      categoryLabel: 'Invitations',
      priority: priorities.invitations || 'low',
      saving,
      rationale: 'Send elegant digital video/animated invitations with online RSVP tracking rather than boxed luxury cards with sweets.',
      tradeoff: `Saves ~${formatINR(saving)} and provides instant automated headcount tracking.`,
    });
  }

  const photo = allocations.find(a => a.id === 'photography');
  const photoAlloc = photo ? parseNumber(photo.allocated) : 0;
  if (photoAlloc > 40000 && (priorities.photography === 'low' || priorities.photography === 'medium')) {
    const saving = Math.round(photoAlloc * 0.25);
    suggestions.push({
      categoryId: 'photography',
      categoryLabel: 'Photography',
      priority: priorities.photography || 'medium',
      saving,
      rationale: 'Book a 1-day core coverage package (candid + traditional) with digital album delivery rather than multi-day pre-shoots and heavy printed albums.',
      tradeoff: `Saves ~${formatINR(saving)} while still capturing all key event moments.`,
    });
  }

  return suggestions;
}

/**
 * Detect planning conflicts when event date, guest count, or budget changes.
 */
export function detectEventChangeConflicts(oldEvent, newEvent) {
  if (!oldEvent || !newEvent) return [];
  const conflicts = [];

  // Date changed
  if (oldEvent.date && newEvent.date && oldEvent.date !== newEvent.date) {
    const oldDays = daysUntil(oldEvent.date);
    const newDays = daysUntil(newEvent.date);
    if (oldDays !== null && newDays !== null && newDays < oldDays) {
      const shift = oldDays - newDays;
      const tasks = oldEvent.tasks || [];
      const newlyUrgent = tasks.filter(t => !t.completed && t.deadline && daysUntil(t.deadline) <= 7).length;
      conflicts.push({
        type: 'date_advanced',
        severity: 'high',
        title: 'Timeline Compressed',
        message: `Event date moved earlier by ${shift} days (${newDays} days remaining). ${newlyUrgent} tasks may now have urgent or overdue deadlines.`,
      });
    }
  }

  // Guest count increased
  const oldGuests = parseNumber(oldEvent.guestCount);
  const newGuests = parseNumber(newEvent.guestCount);
  if (newGuests > oldGuests && oldGuests > 0) {
    const diff = newGuests - oldGuests;
    const estPlate = (oldEvent.occasion === 'wedding' ? 1200 : oldEvent.occasion === 'birthday' ? 500 : 250);
    const additionalCatering = diff * estPlate;
    conflicts.push({
      type: 'guest_increase',
      severity: 'medium',
      title: 'Guest Count Increased',
      message: `Guest count increased from ${oldGuests} to ${newGuests} (+${diff} guests). Estimated additional catering cost: ~${formatINR(additionalCatering)}.`,
    });
  }

  // Budget decreased
  const oldBudget = parseNumber(oldEvent.budget);
  const newBudget = parseNumber(newEvent.budget);
  if (newBudget < oldBudget && newBudget > 0) {
    const { totalAllocated } = recalculateBudget(oldEvent.budget_allocations || []);
    if (totalAllocated > newBudget) {
      conflicts.push({
        type: 'budget_reduced',
        severity: 'high',
        title: 'Budget Reduced Below Allocations',
        message: `Budget reduced from ${formatINR(oldBudget)} to ${formatINR(newBudget)}. Current category allocations exceed this by ${formatINR(totalAllocated - newBudget)}.`,
      });
    }
  }

  return conflicts;
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function validateEvent(data) {
  const errors = {};
  if (!data.name || !data.name.trim()) errors.name = 'Event name is required.';
  if (!data.occasion) errors.occasion = 'Please select an occasion type.';
  if (!data.date) {
    errors.date = 'Event date is required.';
  } else {
    const parsed = parseDate(data.date);
    if (!parsed) {
      errors.date = 'Please enter a valid date.';
    }
  }
  const guests = parseNumber(data.guestCount);
  if (!data.guestCount || guests <= 0) errors.guestCount = 'Guest count must be at least 1.';
  const budget = parseNumber(data.budget);
  if (!data.budget || budget <= 0) errors.budget = 'Total budget must be greater than 0.';
  return errors;
}

// ─── Progress ────────────────────────────────────────────────────────────────

export function calcProgress(tasks) {
  if (!tasks || tasks.length === 0) return 0;
  const done = tasks.filter(t => t.completed).length;
  return Math.round((done / tasks.length) * 100);
}

// ─── Filtering & Price Comparison ────────────────────────────────────────────

export function filterVendors(vendors, { category, status, eventId } = {}) {
  return vendors.filter(v => {
    if (category && category !== 'all' && v.category !== category) return false;
    if (status && status !== 'all' && v.status !== status) return false;
    if (eventId && v.eventId !== eventId) return false;
    return true;
  });
}

/**
 * Analyzes vendor quotation for price, inclusions, capacity, and missing clarifications.
 */
export function analyzeVendorQuotation(vendor) {
  const price = parseNumber(vendor.price);
  const addCharges = parseNumber(vendor.additionalCharges);
  const effectivePrice = price + addCharges;
  const guestCapacity = parseNumber(vendor.guestCapacity);
  const pricePerGuest = (guestCapacity > 0 && price > 0) ? Math.round(price / guestCapacity) : null;
  const effectivePerGuest = (guestCapacity > 0 && effectivePrice > 0) ? Math.round(effectivePrice / guestCapacity) : null;

  const missingDetails = [];
  if (price <= 0) {
    missingDetails.push('Quoted base price missing');
  }
  if (!vendor.contact || !vendor.contact.trim()) {
    missingDetails.push('Direct contact details missing');
  }
  if (['catering', 'venue'].includes(vendor.category) && guestCapacity <= 0) {
    missingDetails.push('Guest capacity / pax count not specified');
  }
  if (vendor.additionalCharges === undefined || vendor.additionalCharges === null || vendor.additionalCharges === '') {
    missingDetails.push('Additional charges (taxes, transport, overtime) unconfirmed');
  }
  if (!vendor.servicesIncluded || !vendor.servicesIncluded.trim()) {
    missingDetails.push('Itemized service inclusions not listed');
  }

  return {
    ...vendor,
    price,
    additionalCharges: addCharges,
    effectivePrice,
    guestCapacity,
    pricePerGuest,
    effectivePerGuest,
    missingDetails,
    hasMissingDetails: missingDetails.length > 0,
  };
}

export function compareVendorPrices(vendors = []) {
  const groups = {};
  vendors.forEach(v => {
    const cat = v.category || 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(analyzeVendorQuotation(v));
  });

  return Object.entries(groups).map(([category, items]) => {
    const prices = items.map(i => i.price).filter(p => p > 0);
    const effectivePrices = items.map(i => i.effectivePrice).filter(p => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length) : 0;
    const savings = maxPrice - minPrice;

    const minEffectivePrice = effectivePrices.length > 0 ? Math.min(...effectivePrices) : 0;
    const maxEffectivePrice = effectivePrices.length > 0 ? Math.max(...effectivePrices) : 0;

    const perGuestPrices = items.map(i => i.pricePerGuest).filter(pg => pg !== null && pg > 0);
    const minPerGuest = perGuestPrices.length > 0 ? Math.min(...perGuestPrices) : null;
    const totalMissingClarifications = items.reduce((s, i) => s + i.missingDetails.length, 0);

    return {
      category,
      items,
      count: items.length,
      pricedCount: prices.length,
      minPrice,
      maxPrice,
      avgPrice,
      savings,
      minEffectivePrice,
      maxEffectivePrice,
      minPerGuest,
      totalMissingClarifications,
    };
  });
}

// ─── Upcoming deadlines ──────────────────────────────────────────────────────

export function getUpcomingDeadlines(tasks, limitDays = 14) {
  const t = today();
  return tasks
    .filter(task => {
      if (task.completed) return false;
      if (!task.deadline) return false;
      const d = parseDate(task.deadline);
      if (!d) return false;
      const diff = Math.ceil((d - t) / (1000 * 60 * 60 * 24));
      return diff <= limitDays;
    })
    .sort((a, b) => {
      const da = parseDate(a.deadline);
      const db = parseDate(b.deadline);
      return da - db;
    });
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

