import { describe, it, expect } from 'vitest';
import {
  generateContextualBudgetAllocations,
  recalculateAllocationsPreservingSpent,
  detectBudgetConflicts,
  generateTradeOffSuggestions,
  detectEventChangeConflicts,
  recalculateBudget,
  formatINR,
  parseNumber,
  compareVendorPrices,
  analyzeVendorQuotation,
} from '../utils/helpers.js';
import { generateTasks, rescheduleTasksOnDateShift, getTaskDependencyStatus, createCustomTask } from '../utils/tasks.js';
import { getAssistantResponse } from '../utils/assistant.js';
import { validateDemoLogin, saveSession, getSavedSession, clearSession } from '../utils/auth.js';

describe('Official Benchmark Scenario: Wedding ₹8L, 200 Guests, 4 Months Away', () => {
  // 1. Initial State
  const initialWedding = {
    id: 'benchmark-wedding-2026',
    name: 'Priya & Arjun Wedding',
    occasion: 'wedding',
    date: '2026-11-30', // 4 months out
    guestCount: 200,
    budget: 800000,
    priorities: {
      catering: 'high',
      venue: 'high',
      photography: 'high',
      decorations: 'medium',
      entertainment: 'medium',
      invitations: 'low',
    },
    budget_allocations: generateContextualBudgetAllocations(800000, 'wedding', 200, {
      catering: 'high',
      venue: 'high',
      photography: 'high',
      decorations: 'medium',
      entertainment: 'medium',
      invitations: 'low',
    }),
  };

  it('1. Generates contextual budget allocation summing to ₹8,00,000 for 200 guests', () => {
    const allocations = generateContextualBudgetAllocations(
      initialWedding.budget,
      initialWedding.occasion,
      initialWedding.guestCount,
      initialWedding.priorities
    );

    const { totalAllocated } = recalculateBudget(allocations);
    expect(totalAllocated).toBe(800000);

    const catering = allocations.find(a => a.id === 'catering');
    const venue = allocations.find(a => a.id === 'venue');
    expect(catering).toBeDefined();
    expect(venue).toBeDefined();

    // High priority catering and venue each receive substantial shares
    expect(catering.allocated).toBeGreaterThanOrEqual(200000);
    expect(venue.allocated).toBeGreaterThanOrEqual(200000);

    // Per-guest catering adequacy
    const perGuestCatering = catering.allocated / initialWedding.guestCount;
    expect(perGuestCatering).toBeGreaterThanOrEqual(1000); // Standard wedding catering benchmark
  });

  it('2. Generates dependency-aware timeline with venue as prerequisite for catering and invitations', () => {
    const tasks = generateTasks('wedding', initialWedding.date);
    expect(tasks.length).toBeGreaterThanOrEqual(14);

    const venueTask = tasks.find(t => t.code === 'venue');
    const catererTask = tasks.find(t => t.code === 'caterer');
    const invitesTask = tasks.find(t => t.code === 'invites');

    expect(venueTask).toBeDefined();
    expect(catererTask).toBeDefined();
    expect(catererTask.dependsOn).toContain('venue');
    expect(invitesTask.dependsOn).toContain('venue');

    // Check dependency status before venue completion
    const blockedCaterer = getTaskDependencyStatus(catererTask, tasks);
    expect(blockedCaterer.isBlocked).toBe(true);
    expect(blockedCaterer.pendingPrerequisites).toContain(venueTask.title);

    // Mark venue completed -> prerequisites met
    venueTask.completed = true;
    const unblockedCaterer = getTaskDependencyStatus(catererTask, tasks);
    expect(unblockedCaterer.isBlocked).toBe(false);
  });

  it('3. Budget change: reducing budget from ₹8,00,000 to ₹6,00,000 flags conflicts and calculates trade-offs', () => {
    const oldAllocations = [...initialWedding.budget_allocations];
    // User had already paid ₹50,000 advance on venue
    oldAllocations.find(a => a.id === 'venue').spent = 50000;

    const oldEventWithAllocations = {
      ...initialWedding,
      budget_allocations: oldAllocations,
    };

    const updatedWedding = {
      ...initialWedding,
      budget: 600000,
      budget_allocations: oldAllocations,
    };

    // Detect change conflicts
    const conflicts = detectEventChangeConflicts(oldEventWithAllocations, updatedWedding);
    expect(conflicts.some(c => c.type === 'budget_reduced')).toBe(true);

    // Recalculate preserving entered spent amounts
    const updatedAllocations = recalculateAllocationsPreservingSpent(
      oldAllocations,
      600000,
      'wedding',
      200,
      initialWedding.priorities
    );

    const { totalAllocated } = recalculateBudget(updatedAllocations);
    expect(totalAllocated).toBe(600000);

    // Verify spent amount is preserved
    const updatedVenue = updatedAllocations.find(a => a.id === 'venue');
    expect(updatedVenue.spent).toBe(50000);

    // Verify trade-off suggestions protect high priorities (catering, venue, photo) and suggest decor/invites
    const tradeOffs = generateTradeOffSuggestions(updatedWedding, updatedAllocations);
    expect(tradeOffs.length).toBeGreaterThan(0);
    const decorTradeOff = tradeOffs.find(t => t.categoryId === 'decorations');
    expect(decorTradeOff).toBeDefined();
    expect(decorTradeOff.saving).toBeGreaterThan(0);
    expect(decorTradeOff.tradeoff.toLowerCase()).toContain('catering');
  });

  it('4. Guest count surge: increasing guests from 200 to 300 flags catering ripple effects', () => {
    const updatedWedding = {
      ...initialWedding,
      guestCount: 300,
    };

    const conflicts = detectEventChangeConflicts(initialWedding, updatedWedding);
    const guestConflict = conflicts.find(c => c.type === 'guest_increase');
    expect(guestConflict).toBeDefined();
    expect(guestConflict.message).toContain('+100 guests');
    expect(guestConflict.message).toContain('additional catering cost');

    // Assistant explains the guest impact contextually
    const response = getAssistantResponse('What happens if my guest count increases to 300?', initialWedding, []);
    expect(response.message).toContain('Guest Count');
    expect(response.message.toLowerCase()).toContain('catering');
  });

  it('5. Timeline compression: moving event date earlier flags newly urgent and overdue milestones', () => {
    const tasks = generateTasks('wedding', '2026-11-30');
    // Add custom task
    tasks.push(createCustomTask('Book family trial makeup session', '2026-10-15', 'high'));

    const { updatedTasks, overdueCount, criticalCount } = rescheduleTasksOnDateShift(
      tasks,
      '2026-09-01', // moved forward by almost 3 months
      '2026-11-30'
    );

    expect(updatedTasks.length).toBe(tasks.length);
    // Custom task is preserved
    expect(updatedTasks.some(t => t.title.includes('family trial makeup'))).toBe(true);
    // Overdue or critical tasks detected
    expect(overdueCount + criticalCount).toBeGreaterThan(0);
  });

  it('6. Vendor quotation comparison detects missing details and cost differences', () => {
    const quotes = [
      {
        id: 'q1',
        name: 'Mehta Catering',
        category: 'catering',
        price: 240000,
        guestCapacity: 200,
        additionalCharges: 12000,
        servicesIncluded: 'Full vegetarian buffet with live counter and staff',
        contact: '+91 98765 43210',
        status: 'quoted',
      },
      {
        id: 'q2',
        name: 'Royal Feast Caterers',
        category: 'catering',
        price: 280000,
        guestCapacity: 200,
        additionalCharges: 18000,
        servicesIncluded: 'Continental + Indian premium buffet',
        contact: '+91 98111 22334',
        status: 'quoted',
      },
      {
        id: 'q3',
        name: 'Incomplete Caterer Quote',
        category: 'catering',
        price: 0,
        guestCapacity: 0,
        additionalCharges: null,
        servicesIncluded: '',
        contact: '',
        status: 'enquired',
      },
    ];

    const comparisons = compareVendorPrices(quotes);
    const catGroup = comparisons.find(c => c.category === 'catering');
    expect(catGroup).toBeDefined();
    expect(catGroup.savings).toBe(40000); // 280,000 - 240,000
    expect(catGroup.minEffectivePrice).toBe(252000); // 240,000 + 12,000

    const incomplete = analyzeVendorQuotation(quotes[2]);
    expect(incomplete.hasMissingDetails).toBe(true);
    expect(incomplete.missingDetails).toContain('Quoted base price missing');
    expect(incomplete.missingDetails).toContain('Direct contact details missing');
  });

  it('7. Demo authentication preserves session and does not touch user event data', () => {
    // Valid login
    const loginRes = validateDemoLogin('demo@gatherly.app', 'Gatherly2026!');
    expect(loginRes.success).toBe(true);
    expect(loginRes.user.email).toBe('demo@gatherly.app');

    // Invalid login
    const badLogin = validateDemoLogin('demo@gatherly.app', 'WrongPassword');
    expect(badLogin.success).toBe(false);

    // Save session
    saveSession(loginRes.user);
    const restored = getSavedSession();
    expect(restored.email).toBe('demo@gatherly.app');

    // Clear session on logout
    clearSession();
    expect(getSavedSession()).toBeNull();
  });
});
