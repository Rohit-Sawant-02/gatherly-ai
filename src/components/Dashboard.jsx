import React from 'react';
import { Sparkles, Calendar, CheckSquare, DollarSign, Users, ChevronRight, TrendingUp, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Button, Card, Badge, EmptyState, ProgressBar } from './ui/index.jsx';
import { formatINR, formatShortDate, daysUntil, daysUntilLabel, urgencyLevel, calcProgress, getUpcomingDeadlines, recalculateBudget } from '../utils/helpers.js';

function StatCard({ icon: Icon, label, value, sub, color = 'sage' }) {
  const colors = {
    sage: 'bg-sage-50 text-sage-600',
    gold: 'bg-gold-50 text-gold-600',
    charcoal: 'bg-charcoal-50 text-charcoal-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <Card className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon size={22} aria-hidden="true" />
      </div>
      <div>
        <p className="text-2xl font-bold text-charcoal-900">{value}</p>
        <p className="text-sm text-charcoal-500">{label}</p>
        {sub && <p className="text-xs text-charcoal-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

function UpcomingEvent({ event, onClick }) {
  const days = daysUntil(event.date);
  const urgency = urgencyLevel(days);
  const tasks = event.tasks || [];
  const progress = calcProgress(tasks);
  const urgencyColors = {
    critical: 'text-red-600',
    high: 'text-orange-600',
    medium: 'text-gold-600',
    normal: 'text-sage-600',
    past: 'text-charcoal-400',
  };
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl bg-ivory-50 border border-ivory-200 hover:border-sage-300 hover:bg-sage-50 transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-semibold text-charcoal-900 text-sm group-hover:text-sage-700 transition-colors">{event.name}</p>
          <p className="text-xs text-charcoal-400 mt-0.5">{formatShortDate(event.date)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-semibold ${urgencyColors[urgency]}`}>{daysUntilLabel(days)}</span>
          <ChevronRight size={14} className="text-charcoal-300 group-hover:text-sage-500 transition-colors" aria-hidden="true" />
        </div>
      </div>
      <ProgressBar value={progress} label={`${progress}% complete`} showLabel={true} />
    </button>
  );
}

function DeadlineItem({ task, event }) {
  const days = daysUntil(task.deadline);
  const urgency = urgencyLevel(days);
  const priorityColors = { high: 'red', medium: 'orange', low: 'default' };
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-ivory-100 last:border-0">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${urgency === 'critical' ? 'bg-red-500' : urgency === 'high' ? 'bg-orange-400' : 'bg-gold-400'}`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-charcoal-700 truncate">{task.title}</p>
        <p className="text-xs text-charcoal-400">{event?.name}</p>
      </div>
      <Badge variant={urgency === 'critical' ? 'red' : urgency === 'high' ? 'orange' : 'gold'}>
        {daysUntilLabel(days)}
      </Badge>
    </div>
  );
}

export default function Dashboard() {
  const { state, dispatch, navigate } = useApp();
  const { events, activeEventId } = state;

  const upcomingEvents = events
    .filter(e => (daysUntil(e.date) ?? -1) >= 0)
    .sort((a, b) => (daysUntil(a.date) ?? 9999) - (daysUntil(b.date) ?? 9999))
    .slice(0, 3);

  const totalBudget = events.reduce((s, e) => s + (Number(e.budget) || 0), 0);
  const totalTasks = events.flatMap(e => e.tasks || []);
  const completedTasks = totalTasks.filter(t => t.completed).length;

  // Upcoming deadlines across all events (next 14 days)
  const allDeadlines = events.flatMap(ev =>
    getUpcomingDeadlines(ev.tasks || [], 14).map(t => ({ task: t, event: ev }))
  ).sort((a, b) => {
    const da = a.task.deadline ? new Date(a.task.deadline) : new Date('9999');
    const db = b.task.deadline ? new Date(b.task.deadline) : new Date('9999');
    return da - db;
  }).slice(0, 5);

  const selectedEvent = events.find(e => e.id === activeEventId) || events[0] || null;
  const allocations = selectedEvent?.budget_allocations || [];
  const { totalAllocated, totalSpent } = recalculateBudget(allocations);
  const eventBudget = Number(selectedEvent?.budget) || 0;
  const spentPct = eventBudget > 0 ? Math.min(100, Math.round((totalSpent / eventBudget) * 100)) : 0;
  const remainingBudget = eventBudget - totalSpent;

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-sage-600 to-sage-800 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-sage-500/30 rounded-full -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
        <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-gold-500/10 rounded-full translate-y-1/2" aria-hidden="true" />
        <div className="relative">
          <p className="text-sage-200 text-sm font-medium mb-1">Welcome to Gatherly AI</p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Every detail, beautifully planned.</h1>
          <p className="text-sage-200 text-sm max-w-md mb-5">
            Plan weddings, birthdays, and community events with smart budgeting, checklists, and vendor management.
          </p>
          <Button
            variant="gold"
            size="lg"
            onClick={() => navigate('plan')}
            ariaLabel="Start planning a new event"
          >
            <Sparkles size={18} aria-hidden="true" />
            Plan an Event
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Total Events" value={events.length} color="sage" />
        <StatCard icon={TrendingUp} label="Upcoming" value={upcomingEvents.length} color="gold" />
        <StatCard icon={CheckSquare} label="Tasks Done" value={`${completedTasks}/${totalTasks.length}`} color="charcoal" />
        <StatCard icon={DollarSign} label="Total Budget" value={formatINR(totalBudget)} color="charcoal" />
      </div>

      {/* Selected Event Budget Summary */}
      {selectedEvent && (
        <Card className="border-sage-200 bg-gradient-to-br from-white to-ivory-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="sage">Budget Summary</Badge>
                <span className="text-xs text-charcoal-400 capitalize">{selectedEvent.occasion}</span>
              </div>
              <h2 className="text-lg font-bold text-charcoal-900">{selectedEvent.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              {events.length > 1 && (
                <select
                  value={selectedEvent.id}
                  onChange={(e) => dispatch({ type: 'SET_ACTIVE_EVENT', payload: e.target.value })}
                  aria-label="Select event for budget summary"
                  className="text-xs border border-ivory-300 rounded-lg px-2.5 py-1.5 bg-white text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-sage-400"
                >
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </select>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_EVENT', payload: selectedEvent.id });
                  navigate('budget');
                }}
              >
                Budget Planner <ChevronRight size={14} aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-ivory-100/70 border border-ivory-200 text-center">
              <p className="text-xs text-charcoal-400 mb-0.5">Budget</p>
              <p className="text-base font-bold text-charcoal-900">{formatINR(eventBudget)}</p>
            </div>
            <div className="p-3 rounded-lg bg-ivory-100/70 border border-ivory-200 text-center">
              <p className="text-xs text-charcoal-400 mb-0.5">Allocated</p>
              <p className="text-base font-bold text-charcoal-700">{formatINR(totalAllocated)}</p>
            </div>
            <div className="p-3 rounded-lg bg-ivory-100/70 border border-ivory-200 text-center">
              <p className="text-xs text-charcoal-400 mb-0.5">Total Spent</p>
              <p className={`text-base font-bold ${totalSpent > eventBudget ? 'text-red-600' : 'text-charcoal-900'}`}>{formatINR(totalSpent)}</p>
            </div>
            <div className="p-3 rounded-lg bg-ivory-100/70 border border-ivory-200 text-center">
              <p className="text-xs text-charcoal-400 mb-0.5">Remaining</p>
              <p className={`text-base font-bold ${remainingBudget < 0 ? 'text-red-600' : 'text-sage-600'}`}>{formatINR(remainingBudget)}</p>
            </div>
          </div>

          <ProgressBar
            value={spentPct}
            label={`Spent ${formatINR(totalSpent)} of ${formatINR(eventBudget)}`}
            variant={totalSpent > eventBudget ? 'red' : 'sage'}
          />

          {totalSpent > eventBudget && (
            <p role="alert" className="text-xs text-red-600 mt-2 flex items-center gap-1 font-medium">
              <AlertTriangle size={12} aria-hidden="true" />
              Over budget by {formatINR(totalSpent - eventBudget)}. Review category spending.
            </p>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-charcoal-900">Upcoming Events</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('events')}>View all</Button>
          </div>
          {upcomingEvents.length === 0 ? (
            <EmptyState
              icon="🎉"
              title="No upcoming events"
              description="Create your first event to get started."
              action={<Button variant="primary" size="sm" onClick={() => navigate('plan')}>Plan an Event</Button>}
            />
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map(event => (
                <UpcomingEvent
                  key={event.id}
                  event={event}
                  onClick={() => { navigate('events'); }}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-charcoal-900">Upcoming Deadlines</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('checklist')}>View all</Button>
          </div>
          {allDeadlines.length === 0 ? (
            <EmptyState
              icon="✅"
              title="No urgent deadlines"
              description="You're all caught up! Create events and tasks to track your planning."
            />
          ) : (
            <div>
              {allDeadlines.map(({ task, event }) => (
                <DeadlineItem key={task.id} task={task} event={event} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <h2 className="text-base font-semibold text-charcoal-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '✨', label: 'Plan Event', action: () => navigate('plan'), color: 'bg-sage-50 hover:bg-sage-100 text-sage-700' },
            { icon: '✅', label: 'Checklist', action: () => navigate('checklist'), color: 'bg-gold-50 hover:bg-gold-100 text-gold-700' },
            { icon: '👥', label: 'Vendors', action: () => navigate('vendors'), color: 'bg-charcoal-50 hover:bg-charcoal-100 text-charcoal-700' },
            { icon: '💡', label: 'Inspiration', action: () => navigate('inspiration'), color: 'bg-ivory-100 hover:bg-ivory-200 text-charcoal-600' },
          ].map(q => (
            <button
              key={q.label}
              onClick={q.action}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl ${q.color} transition-all duration-150 border border-transparent hover:border-current/10`}
            >
              <span className="text-2xl" aria-hidden="true">{q.icon}</span>
              <span className="text-sm font-medium">{q.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
