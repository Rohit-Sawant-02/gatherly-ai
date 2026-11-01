import React, { useState } from 'react';
import { Calendar, Trash2, Copy, ChevronRight, ExternalLink, Pencil, AlertTriangle, CheckCircle2, Sliders } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Button, Card, Badge, EmptyState, ProgressBar, ConfirmDialog, SectionHeader, Modal, Input, Select, Textarea } from './ui/index.jsx';
import {
  formatINR,
  formatDate,
  daysUntil,
  daysUntilLabel,
  urgencyLevel,
  calcProgress,
  generateId,
  parseNumber,
  validateEvent,
  recalculateAllocationsPreservingSpent,
  detectEventChangeConflicts,
  DEFAULT_PRIORITIES,
} from '../utils/helpers.js';
import { rescheduleTasksOnDateShift } from '../utils/tasks.js';

const OCCASION_LABELS = { wedding: '💍 Wedding', birthday: '🎂 Birthday', community: '🌿 Community' };
const OCCASION_COLORS = { wedding: 'gold', birthday: 'sage', community: 'default' };

function EditEventModal({ isOpen, onClose, onSave, event }) {
  const [form, setForm] = useState(() => ({
    name: event?.name || '',
    occasion: event?.occasion || 'wedding',
    date: event?.date || '',
    guestCount: event?.guestCount || '',
    budget: event?.budget || '',
    location: event?.location || '',
    theme: event?.theme || '',
    foodPreferences: event?.foodPreferences || '',
    primaryFocus: event?.primaryFocus || 'balanced',
    notes: event?.notes || '',
  }));
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (event) {
      setForm({
        name: event.name || '',
        occasion: event.occasion || 'wedding',
        date: event.date || '',
        guestCount: event.guestCount || '',
        budget: event.budget || '',
        location: event.location || '',
        theme: event.theme || '',
        foodPreferences: event.foodPreferences || '',
        primaryFocus: event.primaryFocus || 'balanced',
        notes: event.notes || '',
      });
      setErrors({});
    }
  }, [event]);

  const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateEvent(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Map primary focus to priorities
    const basePriorities = { ...(DEFAULT_PRIORITIES[form.occasion] || DEFAULT_PRIORITIES.wedding) };
    if (form.primaryFocus === 'food') basePriorities.catering = 'high';
    if (form.primaryFocus === 'venue') basePriorities.venue = 'high';
    if (form.primaryFocus === 'photography') basePriorities.photography = 'high';
    if (form.primaryFocus === 'decor') basePriorities.decorations = 'high';

    onSave({
      ...event,
      ...form,
      guestCount: parseNumber(form.guestCount),
      budget: parseNumber(form.budget),
      priorities: basePriorities,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Event Details" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="edit-event-name" label="Event Name" required
          value={form.name} onChange={set('name')}
          error={errors.name}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            id="edit-event-occasion" label="Occasion" required
            value={form.occasion} onChange={set('occasion')}
            options={[
              { value: 'wedding', label: '💍 Wedding' },
              { value: 'birthday', label: '🎂 Birthday' },
              { value: 'community', label: '🌿 Community' },
            ]}
          />
          <Input
            id="edit-event-date" label="Event Date" type="date" required
            value={form.date} onChange={set('date')}
            error={errors.date}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="edit-guest-count" label="Guest Count" type="number" required
            value={form.guestCount} onChange={set('guestCount')}
            error={errors.guestCount}
            hint="Headcount connects to catering and venue"
          />
          <Input
            id="edit-budget" label="Budget (₹)" type="number" required prefix="₹"
            value={form.budget} onChange={set('budget')}
            error={errors.budget}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            id="edit-primary-focus" label="Primary Planning Priority"
            value={form.primaryFocus} onChange={set('primaryFocus')}
            options={[
              { value: 'balanced', label: 'Balanced Experience' },
              { value: 'food', label: 'Food & Catering Focus' },
              { value: 'venue', label: 'Venue & Ambience Focus' },
              { value: 'photography', label: 'Photography & Memories Focus' },
              { value: 'decor', label: 'Decorations & Grandeur Focus' },
            ]}
            hint="Guides trade-off suggestions and budget splits"
          />
          <Input
            id="edit-location" label="Location / Venue"
            value={form.location} onChange={set('location')}
            placeholder="Venue address or name"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="edit-theme" label="Theme"
            value={form.theme} onChange={set('theme')}
            placeholder="e.g. Classic Ivory & Gold"
          />
          <Input
            id="edit-food" label="Food Preference"
            value={form.foodPreferences} onChange={set('foodPreferences')}
            placeholder="e.g. Full Vegetarian buffet"
          />
        </div>
        <Textarea
          id="edit-notes" label="Notes"
          value={form.notes} onChange={set('notes')}
          rows={2}
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>Cancel</Button>
          <Button type="submit" variant="primary" fullWidth>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}

function EventCard({ event, onOpen, onEdit, onDelete, onDuplicate }) {
  const days = daysUntil(event.date);
  const urgency = urgencyLevel(days);
  const tasks = event.tasks || [];
  const progress = calcProgress(tasks);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const urgencyBadgeColor = {
    critical: 'red',
    high: 'orange',
    medium: 'gold',
    normal: 'sage',
    past: 'default',
  }[urgency];

  return (
    <>
      <Card className="group hover:border-sage-300 transition-all duration-150 hover:shadow-elevated">
        {event._demo && (
          <div className="text-[10px] text-charcoal-400 bg-ivory-100 rounded-full px-2 py-0.5 inline-block mb-2 border border-ivory-200">
            SAMPLE DATA
          </div>
        )}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-charcoal-900 truncate text-base">{event.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={OCCASION_COLORS[event.occasion]}>{OCCASION_LABELS[event.occasion] || event.occasion}</Badge>
              {days !== null && (
                <Badge variant={urgencyBadgeColor}>{daysUntilLabel(days)}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(event)}
              aria-label={`Edit ${event.name}`}
              title="Edit event"
              className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-ivory-100 transition-colors"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => onDuplicate(event)}
              aria-label={`Duplicate ${event.name}`}
              title="Duplicate event"
              className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-ivory-100 transition-colors"
            >
              <Copy size={15} />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              aria-label={`Delete ${event.name}`}
              title="Delete event"
              className="p-1.5 rounded-lg text-charcoal-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-charcoal-400 mb-0.5">Date</p>
            <p className="text-sm text-charcoal-700 font-medium">{formatDate(event.date)}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-400 mb-0.5">Budget</p>
            <p className="text-sm text-charcoal-700 font-medium">{formatINR(event.budget)}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-400 mb-0.5">Guests</p>
            <p className="text-sm text-charcoal-700 font-medium">{event.guestCount || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-400 mb-0.5">Tasks</p>
            <p className="text-sm text-charcoal-700 font-medium">{tasks.filter(t => t.completed).length}/{tasks.length}</p>
          </div>
        </div>

        <ProgressBar value={progress} label="Planning progress" className="mb-4" />

        <Button
          variant="primary"
          size="sm"
          fullWidth
          onClick={() => onOpen(event)}
          ariaLabel={`Open ${event.name}`}
        >
          Open Event <ChevronRight size={14} aria-hidden="true" />
        </Button>
      </Card>

      <ConfirmDialog
        isOpen={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => { setConfirmDelete(false); onDelete(event.id); }}
        title="Delete Event"
        message={`Are you sure you want to delete "${event.name}"? This will also remove all associated tasks and vendors. This action cannot be undone.`}
        confirmLabel="Delete Event"
      />
    </>
  );
}

export default function MyEvents() {
  const { state, dispatch, navigate } = useApp();
  const [filter, setFilter] = useState('all');
  const [editingEvent, setEditingEvent] = useState(null);
  const [changeConflicts, setChangeConflicts] = useState([]);
  const [changeSuccess, setChangeSuccess] = useState('');

  const filtered = state.events.filter(e => {
    const days = daysUntil(e.date);
    if (filter === 'upcoming') return days !== null && days >= 0;
    if (filter === 'past') return days !== null && days < 0;
    return true;
  });

  const handleOpen = (event) => {
    dispatch({ type: 'SET_ACTIVE_EVENT', payload: event.id });
    navigate('checklist');
  };

  const handleDelete = (id) => {
    dispatch({ type: 'DELETE_EVENT', payload: id });
  };

  const handleDuplicate = (event) => {
    const newId = generateId();
    const duplicate = {
      ...event,
      id: newId,
      name: `${event.name} (Copy)`,
      createdAt: new Date().toISOString(),
      tasks: (event.tasks || []).map(t => ({ ...t, id: generateId(), completed: false })),
      budget_allocations: (event.budget_allocations || []).map(a => ({ ...a, spent: 0 })),
      _demo: false,
    };
    dispatch({ type: 'ADD_EVENT', payload: duplicate });
  };

  const handleSaveEdit = (updatedEvent) => {
    if (!editingEvent) return;

    // Detect conflicts between old event and edited event
    const detected = detectEventChangeConflicts(editingEvent, updatedEvent);
    setChangeConflicts(detected);

    let updatedAllocations = editingEvent.budget_allocations || [];
    const budgetChanged = updatedEvent.budget !== editingEvent.budget;
    const guestsChanged = updatedEvent.guestCount !== editingEvent.guestCount;
    const occasionChanged = updatedEvent.occasion !== editingEvent.occasion;

    if (budgetChanged || guestsChanged || occasionChanged) {
      updatedAllocations = recalculateAllocationsPreservingSpent(
        editingEvent.budget_allocations || [],
        updatedEvent.budget,
        updatedEvent.occasion,
        updatedEvent.guestCount,
        updatedEvent.priorities || {}
      );
    }

    // Reschedule task deadlines if event date moved
    let updatedTasks = editingEvent.tasks || [];
    if (editingEvent.date && updatedEvent.date && editingEvent.date !== updatedEvent.date) {
      const rescheduled = rescheduleTasksOnDateShift(updatedTasks, updatedEvent.date, editingEvent.date);
      updatedTasks = rescheduled.updatedTasks;
    }

    dispatch({
      type: 'UPDATE_EVENT',
      payload: {
        ...updatedEvent,
        tasks: updatedTasks,
        budget_allocations: updatedAllocations,
      },
    });

    setChangeSuccess(`"${updatedEvent.name}" updated! Allocations and timelines updated without erasing custom data.`);
    setTimeout(() => setChangeSuccess(''), 5000);
    setEditingEvent(null);
  };

  const filterButtons = [
    { id: 'all', label: 'All' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
  ];

  return (
    <div>
      <SectionHeader
        title="My Events"
        description={`${state.events.length} event${state.events.length !== 1 ? 's' : ''} saved`}
        actions={
          <Button variant="primary" onClick={() => navigate('plan')}>
            + Plan New Event
          </Button>
        }
      />

      {changeSuccess && (
        <div role="status" className="flex items-center gap-2 p-3 bg-sage-50 border border-sage-200 rounded-xl text-sm text-sage-800 mb-5 animate-fadeIn">
          <CheckCircle2 size={16} className="text-sage-600 flex-shrink-0" />
          <span>{changeSuccess}</span>
        </div>
      )}

      {changeConflicts.length > 0 && (
        <div className="space-y-2 mb-5">
          {changeConflicts.map((c, i) => (
            <div
              key={i}
              role="alert"
              className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs leading-relaxed ${
                c.severity === 'high' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-gold-50 border-gold-200 text-gold-900'
              }`}
            >
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
              <div>
                <strong className="font-semibold">{c.title}:</strong> {c.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {state.events.length > 0 && (
        <div className="flex gap-2 mb-6" role="group" aria-label="Filter events">
          {filterButtons.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border
                ${filter === f.id
                  ? 'bg-sage-500 text-white border-sage-500'
                  : 'bg-white text-charcoal-600 border-ivory-300 hover:border-sage-300'
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {state.events.length === 0 ? (
        <Card>
          <EmptyState
            icon="📅"
            title="No events yet"
            description="Create your first event and start planning with smart budgets, checklists, and vendor management."
            action={
              <Button variant="primary" onClick={() => navigate('plan')}>
                ✨ Plan Your First Event
              </Button>
            }
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon="🔍"
            title={`No ${filter} events`}
            description="Try changing the filter."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onOpen={handleOpen}
              onEdit={(ev) => setEditingEvent(ev)}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}

      <EditEventModal
        isOpen={Boolean(editingEvent)}
        onClose={() => setEditingEvent(null)}
        onSave={handleSaveEdit}
        event={editingEvent}
      />
    </div>
  );
}
