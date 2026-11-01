import React, { useState, useMemo } from 'react';
import { AlertTriangle, Info, Sparkles, ArrowRight, CheckCircle2, RotateCcw, Sliders, Scale } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Button, Card, Input, EmptyState, SectionHeader, ProgressBar, Badge } from './ui/index.jsx';
import {
  formatINR,
  parseNumber,
  generateContextualBudgetAllocations,
  recalculateBudget,
  recalculateAllocationsPreservingSpent,
  detectBudgetConflicts,
  generateTradeOffSuggestions,
  DEFAULT_PRIORITIES,
  BUDGET_CATEGORIES,
} from '../utils/helpers.js';

function AllocationBar({ allocations, totalBudget }) {
  const total = Math.max(totalBudget, 1);
  const colors = [
    'bg-sage-500', 'bg-gold-400', 'bg-charcoal-400', 'bg-sage-300',
    'bg-gold-300', 'bg-charcoal-300', 'bg-sage-200',
  ];
  return (
    <div className="mb-6">
      <div
        role="img"
        aria-label="Budget allocation chart"
        className="flex h-6 rounded-full overflow-hidden border border-ivory-200 mb-3 shadow-inner"
      >
        {allocations.map((a, i) => {
          const pct = Math.round((parseNumber(a.allocated) / total) * 100);
          if (pct === 0) return null;
          return (
            <div
              key={a.id}
              className={`${colors[i % colors.length]} transition-all duration-300`}
              style={{ width: `${pct}%` }}
              title={`${a.label}: ${pct}%`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3">
        {allocations.map((a, i) => {
          const pct = total > 0 ? Math.round((parseNumber(a.allocated) / total) * 100) : 0;
          return (
            <div key={a.id} className="flex items-center gap-1.5 text-xs text-charcoal-600">
              <span className={`w-3 h-3 rounded-sm flex-shrink-0 ${colors[i % colors.length]}`} aria-hidden="true" />
              {a.label} ({pct}%)
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryRow({ allocation, totalBudget, guestCount, onAllocationChange, onPriorityChange }) {
  const allocated = parseNumber(allocation.allocated);
  const spent = parseNumber(allocation.spent);
  const remaining = allocated - spent;
  const overBudget = spent > allocated;
  const spentPct = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;
  const pctOfTotal = totalBudget > 0 ? Math.round((allocated / totalBudget) * 100) : 0;
  const perGuest = (guestCount > 0 && allocation.id === 'catering' && allocated > 0)
    ? Math.round(allocated / guestCount)
    : null;

  const priorityColors = {
    high: 'red',
    medium: 'gold',
    low: 'sage',
  };

  return (
    <div className="p-4 rounded-xl border border-ivory-200 bg-white hover:border-sage-200 transition-colors shadow-2xs">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-charcoal-900">{allocation.label}</h3>
            <span className="text-[11px] text-charcoal-400 font-normal">({pctOfTotal}%)</span>
          </div>
          {perGuest && (
            <p className="text-[11px] text-sage-700 font-medium mt-0.5">
              ~{formatINR(perGuest)} per plate ({guestCount} guests)
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <label htmlFor={`pri-${allocation.id}`} className="sr-only">Priority for {allocation.label}</label>
          <select
            id={`pri-${allocation.id}`}
            value={allocation.priority || 'medium'}
            onChange={(e) => onPriorityChange(allocation.id, e.target.value)}
            className="text-[11px] font-medium border border-ivory-300 rounded-md px-2 py-0.5 bg-ivory-50 text-charcoal-700 focus:outline-none focus:ring-1 focus:ring-sage-400"
            title="Adjust planner priority for this category"
          >
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          {overBudget && (
            <span className="flex items-center gap-1 text-xs text-red-600 font-medium" role="alert">
              <AlertTriangle size={12} aria-hidden="true" /> Over
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Input
          id={`alloc-${allocation.id}`}
          label="Allocated (₹)"
          type="number"
          value={allocation.allocated}
          onChange={(e) => onAllocationChange(allocation.id, 'allocated', e.target.value)}
          prefix="₹"
        />
        <Input
          id={`spent-${allocation.id}`}
          label="Spent (₹)"
          type="number"
          value={allocation.spent}
          onChange={(e) => onAllocationChange(allocation.id, 'spent', e.target.value)}
          prefix="₹"
        />
      </div>

      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-charcoal-500">
          Remaining: <strong className={remaining < 0 ? 'text-red-600' : 'text-sage-600'}>{formatINR(remaining)}</strong>
        </span>
        <span className="text-charcoal-400">{spentPct}% spent</span>
      </div>
      <ProgressBar value={spentPct} variant={overBudget ? 'red' : spentPct > 80 ? 'gold' : 'sage'} showLabel={false} />
    </div>
  );
}

export default function BudgetPlanner() {
  const { state, dispatch, navigate, activeEvent } = useApp();
  const [successNote, setSuccessNote] = useState('');

  const event = activeEvent || state.events[0] || null;

  const allocations = event?.budget_allocations || [];
  const { totalAllocated, totalSpent } = useMemo(() => recalculateBudget(allocations), [allocations]);
  const totalBudget = Number(event?.budget) || 0;
  const guestCount = Number(event?.guestCount) || 1;
  const overAllocated = totalAllocated > totalBudget;
  const underAllocated = totalAllocated < totalBudget && totalBudget > 0;
  const remaining = totalBudget - totalAllocated;
  const spentRemaining = totalBudget - totalSpent;
  const perGuestTotal = guestCount > 0 ? Math.round(totalBudget / guestCount) : 0;

  const conflicts = useMemo(() => {
    if (!event) return [];
    return detectBudgetConflicts(totalBudget, allocations, guestCount, event.occasion);
  }, [totalBudget, allocations, guestCount, event?.occasion]);

  const tradeOffSuggestions = useMemo(() => {
    if (!event) return [];
    return generateTradeOffSuggestions(event, allocations);
  }, [event, allocations]);

  const handleChange = (id, field, rawValue) => {
    if (!event) return;
    const value = Math.max(0, parseNumber(rawValue));
    const updated = (event.budget_allocations || []).map(a =>
      a.id === id ? { ...a, [field]: value } : a
    );
    dispatch({ type: 'UPDATE_EVENT', payload: { id: event.id, budget_allocations: updated } });
  };

  const handlePriorityChange = (id, newPriority) => {
    if (!event) return;
    const currentPriorities = event.priorities || DEFAULT_PRIORITIES[event.occasion] || {};
    const updatedPriorities = { ...currentPriorities, [id]: newPriority };
    const updatedAllocations = (event.budget_allocations || []).map(a =>
      a.id === id ? { ...a, priority: newPriority } : a
    );
    dispatch({
      type: 'UPDATE_EVENT',
      payload: {
        id: event.id,
        priorities: updatedPriorities,
        budget_allocations: updatedAllocations,
      },
    });
  };

  const handleRecalculateFromPriorities = () => {
    if (!event) return;
    const fresh = recalculateAllocationsPreservingSpent(
      event.budget_allocations || [],
      event.budget,
      event.occasion,
      event.guestCount,
      event.priorities || {}
    );
    dispatch({ type: 'UPDATE_EVENT', payload: { id: event.id, budget_allocations: fresh } });
    setSuccessNote('Allocations recalculated based on guest count and priorities! Spent tracking was preserved.');
    setTimeout(() => setSuccessNote(''), 4000);
  };

  const handleRebalance = () => {
    if (!event || totalAllocated === 0) return;
    const ratio = totalBudget / totalAllocated;
    let running = 0;
    const rebalanced = allocations.map((a, idx) => {
      const isLast = idx === allocations.length - 1;
      let newAlloc = isLast ? Math.max(0, totalBudget - running) : Math.round(parseNumber(a.allocated) * ratio);
      running += newAlloc;
      return {
        ...a,
        allocated: newAlloc,
      };
    });
    dispatch({ type: 'UPDATE_EVENT', payload: { id: event.id, budget_allocations: rebalanced } });
    setSuccessNote('Budget rebalanced proportionally to fit within your total budget!');
    setTimeout(() => setSuccessNote(''), 4000);
  };

  const handleApplyTradeOff = (tradeOff) => {
    if (!event) return;
    const saving = tradeOff.saving;
    const updated = allocations.map(a => {
      if (a.id === tradeOff.categoryId) {
        return { ...a, allocated: Math.max(0, parseNumber(a.allocated) - saving) };
      }
      return a;
    });
    dispatch({ type: 'UPDATE_EVENT', payload: { id: event.id, budget_allocations: updated } });
    setSuccessNote(`Applied trade-off on ${tradeOff.categoryLabel}: reduced allocation by ${formatINR(saving)}.`);
    setTimeout(() => setSuccessNote(''), 4500);
  };

  if (!event) {
    return (
      <div>
        <SectionHeader title="Budget Planner" description="Track and manage your event budget" />
        <Card>
          <EmptyState
            icon="💰"
            title="No event found"
            description="Create an event to start planning and allocating your budget."
            action={
              <Button variant="primary" onClick={() => navigate('plan')}>Plan an Event</Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Budget Planner"
        description={`Managing budget for ${event.name} · ${guestCount} guests · ${formatINR(perGuestTotal)}/head overall`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {state.events.length > 1 && (
              <select
                value={event.id}
                onChange={(e) => dispatch({ type: 'SET_ACTIVE_EVENT', payload: e.target.value })}
                className="text-xs border border-ivory-300 rounded-lg px-2.5 py-1.5 bg-white text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-sage-400"
                aria-label="Switch active event for budget"
              >
                {state.events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalculateFromPriorities}
              title="Recalculate allocations using guest count, occasion, and priority weights (preserves spent amounts)"
            >
              <Sliders size={13} aria-hidden="true" />
              Recalculate from Priorities
            </Button>
            {overAllocated && (
              <Button
                variant="gold"
                size="sm"
                onClick={handleRebalance}
                title="Proportionally scale down allocations to fit available budget"
              >
                <Scale size={13} aria-hidden="true" />
                Fit to Budget
              </Button>
            )}
          </div>
        }
      />

      {successNote && (
        <div role="status" className="flex items-center gap-2 p-3 bg-sage-50 border border-sage-200 rounded-xl text-sm text-sage-800 mb-5 animate-fadeIn">
          <CheckCircle2 size={16} className="text-sage-600 flex-shrink-0" />
          <span>{successNote}</span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Budget', value: formatINR(totalBudget), color: 'text-charcoal-900', sub: `${formatINR(perGuestTotal)}/guest` },
          { label: 'Allocated', value: formatINR(totalAllocated), color: overAllocated ? 'text-red-600' : 'text-sage-600', sub: `${Math.round((totalAllocated / Math.max(1, totalBudget)) * 100)}% of budget` },
          { label: 'Total Spent', value: formatINR(totalSpent), color: totalSpent > totalBudget ? 'text-red-600' : 'text-charcoal-700', sub: `${formatINR(spentRemaining)} unspent` },
          { label: 'Allocated Buffer', value: formatINR(remaining), color: remaining < 0 ? 'text-red-600' : 'text-sage-600', sub: remaining >= 0 ? 'Available for reserve' : 'Over-allocated' },
        ].map(s => (
          <Card key={s.label} className="text-center">
            <p className="text-xs text-charcoal-400 mb-1">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            {s.sub && <p className="text-[11px] text-charcoal-400 mt-0.5">{s.sub}</p>}
          </Card>
        ))}
      </div>

      {/* Dynamic Conflicts & Warnings */}
      {conflicts.length > 0 && (
        <div className="space-y-3 mb-6">
          {conflicts.map((c, i) => (
            <div
              key={i}
              role={c.severity === 'critical' || c.severity === 'high' ? 'alert' : 'status'}
              className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border text-sm leading-relaxed ${
                c.severity === 'critical' || c.severity === 'high'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : c.severity === 'medium'
                  ? 'bg-orange-50 border-orange-200 text-orange-800'
                  : 'bg-gold-50 border-gold-200 text-gold-900'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong className="font-semibold">{c.title}:</strong> {c.message}
                  {c.suggestedFix && (
                    <p className="text-xs mt-0.5 opacity-90">Recommendation: {c.suggestedFix}</p>
                  )}
                </div>
              </div>
              {c.type === 'over_allocated' && (
                <Button variant="danger" size="sm" onClick={handleRebalance} className="flex-shrink-0 text-xs py-1">
                  Rebalance Now
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Trade-Off Advisor Card */}
      {tradeOffSuggestions.length > 0 && (
        <Card className="mb-6 border-gold-200 bg-gradient-to-br from-gold-50/50 via-white to-ivory-50">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-gold-600" aria-hidden="true" />
            <h2 className="text-sm font-bold text-charcoal-900 uppercase tracking-wide">
              Priority & Trade-Off Advisor
            </h2>
            <Badge variant="gold">Smart Trade-offs</Badge>
          </div>
          <p className="text-xs text-charcoal-600 mb-4">
            Based on your selected priorities, here are realistic ways to optimize your budget without cutting high-priority experiences.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tradeOffSuggestions.map((to, i) => (
              <div key={i} className="p-3.5 bg-white rounded-xl border border-ivory-200 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-charcoal-800">{to.categoryLabel}</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Save ~{formatINR(to.saving)}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-600 mb-2 leading-relaxed">{to.rationale}</p>
                  <p className="text-[11px] text-charcoal-400 italic mb-3">{to.tradeoff}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyTradeOff(to)}
                  className="w-full text-xs text-sage-700 hover:text-sage-900"
                >
                  Apply This Trade-off
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Allocation Overview Chart */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-charcoal-700">Budget Allocation Overview</h2>
          <span className="text-xs text-charcoal-400">
            {allocations.length} categories · {formatINR(totalBudget)} total
          </span>
        </div>
        <AllocationBar allocations={allocations} totalBudget={totalBudget} />
        <p className="text-xs text-charcoal-500 italic flex items-center gap-1.5 border-t border-ivory-100 pt-3">
          <Info size={13} className="text-sage-600 flex-shrink-0" aria-hidden="true" />
          <span>
            Allocations are illustrative estimates tailored to guest count ({guestCount} pax) and your priorities — not confirmed vendor quotations.
          </span>
        </p>
      </Card>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-charcoal-900">Category Breakdown & Priorities</h2>
          <span className="text-xs text-charcoal-500">Edit values or adjust priorities directly</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allocations.map(a => (
            <CategoryRow
              key={a.id}
              allocation={a}
              totalBudget={totalBudget}
              guestCount={guestCount}
              onAllocationChange={handleChange}
              onPriorityChange={handlePriorityChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
