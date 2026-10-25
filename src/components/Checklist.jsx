import React, { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Button, Card, Badge, EmptyState, SectionHeader, ProgressBar, Modal, Input, Select } from './ui/index.jsx';
import { daysUntil, daysUntilLabel, urgencyLevel, calcProgress, generateId, formatShortDate, parseDate } from '../utils/helpers.js';
import { createCustomTask } from '../utils/tasks.js';

const PRIORITY_COLORS = { high: 'red', medium: 'gold', low: 'sage' };
const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };

function priorityOrder(p) { return { high: 0, medium: 1, low: 2 }[p] ?? 2; }

function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const days = daysUntil(task.deadline);
  const urgency = urgencyLevel(days);

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-150 group
        ${task.completed ? 'bg-ivory-50 border-ivory-100 opacity-60' : 'bg-white border-ivory-200 hover:border-sage-200'}
        ${!task.completed && urgency === 'critical' ? 'border-l-4 border-l-red-400' : ''}
        ${!task.completed && urgency === 'high' ? 'border-l-4 border-l-orange-400' : ''}
      `}
    >
      <button
        onClick={() => onToggle(task.id)}
        aria-label={task.completed ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" complete`}
        className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-all duration-150
          ${task.completed ? 'bg-sage-500 border-sage-500 text-white' : 'border-charcoal-300 hover:border-sage-400'}
        `}
      >
        {task.completed && <Check size={12} strokeWidth={3} aria-hidden="true" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${task.completed ? 'line-through text-charcoal-400' : 'text-charcoal-900'}`}>
          {task.title}
          {task.custom && <span className="ml-1.5 text-xs text-charcoal-400 font-normal">(custom)</span>}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge variant={PRIORITY_COLORS[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>
          {task.deadline && (
            <span className={`text-xs font-medium ${!task.completed && urgency === 'critical' ? 'text-red-600' : !task.completed && urgency === 'high' ? 'text-orange-600' : 'text-charcoal-400'}`}>
              {!task.completed && urgency === 'critical' && <AlertTriangle size={10} className="inline mr-0.5" aria-hidden="true" />}
              {daysUntilLabel(days)} · {formatShortDate(task.deadline)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task)}
          aria-label={`Edit ${task.title}`}
          className="p-1.5 rounded text-charcoal-400 hover:text-charcoal-700 hover:bg-ivory-100 transition-colors"
        >
          <Pencil size={13} aria-hidden="true" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          aria-label={`Delete ${task.title}`}
          className="p-1.5 rounded text-charcoal-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function TaskModal({ isOpen, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || { title: '', deadline: '', priority: 'medium' });
  React.useEffect(() => { setForm(initial || { title: '', deadline: '', priority: 'medium' }); }, [initial]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Task' : 'Add Custom Task'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="task-title" label="Task Title" required
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Book venue"
        />
        <Input
          id="task-deadline" label="Deadline" type="date"
          value={form.deadline || ''}
          onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
        />
        <Select
          id="task-priority" label="Priority"
          value={form.priority}
          onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
          options={[
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' },
          ]}
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>Cancel</Button>
          <Button type="submit" variant="primary" fullWidth>{initial ? 'Save Changes' : 'Add Task'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Checklist() {
  const { state, dispatch, navigate, activeEvent } = useApp();
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const event = activeEvent || state.events[0] || null;

  const handleToggle = (taskId) => {
    if (!event) return;
    const updated = event.tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    dispatch({ type: 'UPDATE_EVENT', payload: { id: event.id, tasks: updated } });
  };

  const handleAddTask = (form) => {
    if (!event) return;
    const newTask = createCustomTask(form.title, form.deadline || null, form.priority);
    dispatch({ type: 'UPDATE_EVENT', payload: { id: event.id, tasks: [...(event.tasks || []), newTask] } });
  };

  const handleEditTask = (form) => {
    if (!event || !editTask) return;
    const updated = event.tasks.map(t =>
      t.id === editTask.id ? { ...t, ...form } : t
    );
    dispatch({ type: 'UPDATE_EVENT', payload: { id: event.id, tasks: updated } });
    setEditTask(null);
  };

  const handleDelete = (taskId) => {
    if (!event) return;
    const updated = event.tasks.filter(t => t.id !== taskId);
    dispatch({ type: 'UPDATE_EVENT', payload: { id: event.id, tasks: updated } });
  };

  const tasks = event?.tasks || [];
  const progress = calcProgress(tasks);

  const filtered = tasks
    .filter(t => {
      if (filterStatus === 'done' && !t.completed) return false;
      if (filterStatus === 'pending' && t.completed) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return priorityOrder(a.priority) - priorityOrder(b.priority);
    });

  if (!event) {
    return (
      <div>
        <SectionHeader title="Timeline & Checklist" />
        <Card>
          <EmptyState
            icon="✅"
            title="No event found"
            description="Create an event to view and manage its checklist."
            action={<Button variant="primary" onClick={() => navigate('plan')}>Plan an Event</Button>}
          />
        </Card>
      </div>
    );
  }

  const overdue = tasks.filter(t => !t.completed && daysUntil(t.deadline) !== null && daysUntil(t.deadline) < 0);

  return (
    <div>
      <SectionHeader
        title="Timeline & Checklist"
        description={`${event.name} · ${tasks.filter(t => t.completed).length}/${tasks.length} tasks complete`}
        actions={
          <div className="flex items-center gap-2">
            {state.events.length > 1 && (
              <select
                value={event.id}
                onChange={(e) => dispatch({ type: 'SET_ACTIVE_EVENT', payload: e.target.value })}
                className="text-xs border border-ivory-300 rounded-lg px-2.5 py-1.5 bg-white text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-sage-400"
                aria-label="Switch active event for checklist"
              >
                {state.events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            )}
            <Button variant="primary" size="sm" onClick={() => { setEditTask(null); setModalOpen(true); }}>
              <Plus size={16} aria-hidden="true" /> Add Task
            </Button>
          </div>
        }
      />

      {/* Progress */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-charcoal-900">Overall Progress</h2>
          <span className="text-2xl font-bold text-sage-600">{progress}%</span>
        </div>
        <ProgressBar value={progress} />
        {overdue.length > 0 && (
          <p role="alert" className="text-xs text-red-600 mt-3 flex items-center gap-1">
            <AlertTriangle size={12} aria-hidden="true" />
            {overdue.length} overdue task{overdue.length !== 1 ? 's' : ''} — please review.
          </p>
        )}
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1.5" role="group" aria-label="Filter by status">
          {[['all','All'],['pending','Pending'],['done','Done']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterStatus(val)} aria-pressed={filterStatus === val}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                ${filterStatus === val ? 'bg-sage-500 text-white border-sage-500' : 'bg-white text-charcoal-600 border-ivory-300 hover:border-sage-300'}`}
            >{label}</button>
          ))}
        </div>
        <div className="flex gap-1.5" role="group" aria-label="Filter by priority">
          {[['all','All'],['high','High'],['medium','Medium'],['low','Low']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterPriority(val)} aria-pressed={filterPriority === val}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                ${filterPriority === val ? 'bg-charcoal-700 text-white border-charcoal-700' : 'bg-white text-charcoal-600 border-ivory-300 hover:border-charcoal-400'}`}
            >{label}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon="🎉" title="No tasks match this filter" description="Try adjusting the filters above." />
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <TaskItem
              key={task.id} task={task}
              onToggle={handleToggle}
              onEdit={(t) => { setEditTask(t); setModalOpen(true); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <TaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null); }}
        onSave={editTask ? handleEditTask : handleAddTask}
        initial={editTask}
      />
    </div>
  );
}
