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

export function daysUntil(dateStr) {
  const target = parseDate(dateStr);
  if (!target) return null;
  const t = today();
  const diff = Math.ceil((target - t) / (1000 * 60 * 60 * 24));
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
  return result.toISOString().slice(0, 10);
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
 * Returns default percentage allocations by category per event type.
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

export const BUDGET_CATEGORIES = [
  { id: 'venue', label: 'Venue' },
  { id: 'catering', label: 'Food & Catering' },
  { id: 'decorations', label: 'Decorations' },
  { id: 'photography', label: 'Photography' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'invitations', label: 'Invitations' },
  { id: 'miscellaneous', label: 'Miscellaneous' },
];

export function generateBudgetAllocations(totalBudget, eventType) {
  const budget = parseNumber(totalBudget);
  const rules = ALLOCATION_RULES[eventType] || ALLOCATION_RULES.birthday;
  return BUDGET_CATEGORIES.map(cat => ({
    id: cat.id,
    label: cat.label,
    allocated: Math.round((rules[cat.id] / 100) * budget),
    spent: 0,
    percentage: rules[cat.id],
  }));
}

export function recalculateBudget(allocations) {
  const totalAllocated = allocations.reduce((s, a) => s + parseNumber(a.allocated), 0);
  const totalSpent = allocations.reduce((s, a) => s + parseNumber(a.spent), 0);
  return { totalAllocated, totalSpent };
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

export function compareVendorPrices(vendors = []) {
  const groups = {};
  vendors.forEach(v => {
    const cat = v.category || 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(v);
  });

  return Object.entries(groups).map(([category, items]) => {
    const prices = items.map(i => parseNumber(i.price)).filter(p => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length) : 0;
    const savings = maxPrice - minPrice;
    return {
      category,
      items,
      count: items.length,
      pricedCount: prices.length,
      minPrice,
      maxPrice,
      avgPrice,
      savings,
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

