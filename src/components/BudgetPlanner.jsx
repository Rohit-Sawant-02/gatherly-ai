import React, { useState, useMemo } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Button, Card, Input, EmptyState, SectionHeader, ProgressBar } from './ui/index.jsx';
import { formatINR, parseNumber, generateBudgetAllocations, recalculateBudget, BUDGET_CATEGORIES } from '../utils/helpers.js';

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
        className="flex h-6 rounded-full overflow-hidden border border-ivory-200 mb-3"
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

function CategoryRow({ allocation, onChange }) {
  const allocated = parseNumber(allocation.allocated);
  const spent = parseNumber(allocation.spent);
  const remaining = allocated - spent;
  const overBudget = spent > allocated;
  const spentPct = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;

  return (
    <div className="p-4 rounded-xl border border-ivory-200 bg-white hover:border-sage-200 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-charcoal-900">{allocation.label}</h3>
        {overBudget && (
          <span className="flex items-center gap-1 text-xs text-red-600 font-medium" role="alert">
            <AlertTriangle size={12} aria-hidden="true" /> Over budget
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Input
          id={`alloc-${allocation.id}`}
          label="Allocated (₹)"
          type="number"
          value={allocation.allocated}
          onChange={(e) => onChange(allocation.id, 'allocated', e.target.value)}
          prefix="₹"
        />
        <Input
          id={`spent-${allocation.id}`}
          label="Spent (₹)"
          type="number"
          value={allocation.spent}
          onChange={(e) => onChange(allocation.id, 'spent', e.target.value)}
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

  const event = activeEvent || state.events[0] || null;

  const handleChange = (id, field, rawValue) => {
    if (!event) return;
    const value = Math.max(0, parseNumber(rawValue));
    const updated = (event.budget_allocations || []).map(a =>
      a.id === id ? { ...a, [field]: value } : a
    );
    dispatch({ type: 'UPDATE_EVENT', payload: { id: event.id, budget_allocations: updated } });
  };

  const handleReset = () => {
    if (!event) return;
    const fresh = generateBudgetAllocations(event.budget, event.occasion);
    dispatch({ type: 'UPDATE_EVENT', payload: { id: event.id, budget_allocations: fresh } });
  };

  const allocations = event?.budget_allocations || [];
  const { totalAllocated, totalSpent } = useMemo(() => recalculateBudget(allocations), [allocations]);
  const totalBudget = Number(event?.budget) || 0;
  const overAllocated = totalAllocated > totalBudget;
  const underAllocated = totalAllocated < totalBudget && totalBudget > 0;
  const remaining = totalBudget - totalAllocated;
  const spentRemaining = totalBudget - totalSpent;

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
        description={`Managing budget for: ${event.name}`}
        actions={
          <div className="flex items-center gap-2">
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
            <Button variant="secondary" size="sm" onClick={handleReset}>
              Reset to Defaults
            </Button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Budget', value: formatINR(totalBudget), color: 'text-charcoal-900' },
          { label: 'Allocated', value: formatINR(totalAllocated), color: overAllocated ? 'text-red-600' : 'text-sage-600' },
          { label: 'Total Spent', value: formatINR(totalSpent), color: totalSpent > totalBudget ? 'text-red-600' : 'text-charcoal-700' },
          { label: 'Remaining', value: formatINR(spentRemaining), color: spentRemaining < 0 ? 'text-red-600' : 'text-sage-600' },
        ].map(s => (
          <Card key={s.label} className="text-center">
            <p className="text-xs text-charcoal-400 mb-1">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Warnings */}
      {overAllocated && (
        <div role="alert" className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            <strong>Over-allocated:</strong> Your category totals ({formatINR(totalAllocated)}) exceed your budget ({formatINR(totalBudget)}) by {formatINR(totalAllocated - totalBudget)}.
          </span>
        </div>
      )}
      {underAllocated && (
        <div className="flex items-start gap-2 p-3 bg-gold-50 border border-gold-200 rounded-lg text-sm text-gold-800 mb-4">
          <Info size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            <strong>{formatINR(remaining)} unallocated.</strong> Consider distributing this across categories or keeping it as a contingency.
          </span>
        </div>
      )}

      {/* Chart */}
      <Card className="mb-6">
        <h2 className="text-sm font-semibold text-charcoal-700 mb-4">Budget Allocation Overview</h2>
        <AllocationBar allocations={allocations} totalBudget={totalBudget} />
        <p className="text-xs text-charcoal-400 italic flex items-center gap-1">
          <Info size={11} aria-hidden="true" />
          Amounts are illustrative estimates based on typical event ratios — not market quotes.
        </p>
      </Card>

      {/* Categories */}
      <div>
        <h2 className="text-base font-semibold text-charcoal-900 mb-4">Category Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allocations.map(a => (
            <CategoryRow key={a.id} allocation={a} onChange={handleChange} />
          ))}
        </div>
      </div>
    </div>
  );
}
