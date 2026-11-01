import React, { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X, AlertTriangle, Lock, Unlock, CheckCircle2, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Button, Card, Badge, EmptyState, SectionHeader, ProgressBar, Modal, Input, Select } from './ui/index.jsx';
import { daysUntil, daysUntilLabel, urgencyLevel, calcProgress, generateId, formatShortDate, parseDate } from '../utils/helpers.js';
import { createCustomTask, getTaskDependencyStatus } from '../utils/tasks.js';

const PRIORITY_COLORS = { high: 'red', medium: 'gold', low: 'sage' };
const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };

function priorityOrder(p) { return { high: 0, medium: 1, low: 2 }[p] ?? 2; }

function TaskItem({ task, allTasks, onToggle, onEdit, onDelete }) {
  const days = daysUntil(task.deadline);
  const urgency = urgencyLevel(days);
  const depStatus = getTaskDependencyStatus(task, allTasks);
  const isOverdue = !task.completed && days !== null && days < 0;

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-150 group shadow-2xs
        ${task.completed ? 'bg-ivory-50/80 border-ivory-100 opacity-65' : 'bg-white border-ivory-200 hover:border-sage-200'}
        ${isOverdue ? 'border-l-4 border-l-red-500 bg-red-50/20' : !task.completed && urgency === 'critical' ? 'border-l-4 border-l-red-400' : !task.completed && urgency === 'high' ? 'border-l-4 border-l-orange-400' : ''}
      `}
    >
      <button
        onClick={() => onToggle(task.id)}
        aria-label={task.completed ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" complete`}
        className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-all duration-150 cursor-pointer
          ${task.completed ? 'bg-sage-500 border-sage-500 text-white' : 'border-charcoal-300 hover:border-sage-400 bg-white'}
        `}
      >
        {task.completed && <Check size={12} strokeWidth={3} aria-hidden="true" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-medium ${task.completed ? 'line-through text-charcoal-400' : 'text-charcoal-900'}`}>
            {task.title}
            {task.custom && <span className="ml-1.5 text-xs text-charcoal-400 font-normal">(custom)</span>}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <Badge variant={PRIORITY_COLORS[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>

          {task.deadline && (
            <span className={`text-xs font-medium flex items-center gap-1 ${
              isOverdue ? 'text-red-600 font-bold' : !task.completed && urgency === 'critical' ? 'text-red-600' : !task.completed && urgency === 'high' ? 'text-orange-600' : 'text-charcoal-500'
            }`}>
              {isOverdue ? (
                <>
                  <AlertTriangle size={11} aria-hidden="true" />
                  Overdue ({daysUntilLabel(days)}) · {formatShortDate(task.deadline)}
                </>
              ) : (
                <>
                  <Clock size={11} aria-hidden="true" />
                  {daysUntilLabel(days)} · {formatShortDate(task.deadline)}
                </>
              )}
            </span>
          )}

          {/* Dependency indicator */}
          {!task.completed && depStatus.isBlocked && (
            <span
              className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-medium"
              title={`Waiting for: ${depStatus.pendingPrerequisites.join(', ')}`}
            >
              <Lock size={10} aria-hidden="true" />
              <span>Waiting for: {depStatus.pendingPrerequisites[0]}{depStatus.pendingPrerequisites.length > 1 ? ` (+${depStatus.pendingPrerequisites.length - 1})` : ''}</span>
            </span>
          )}

          {!task.completed && !depStatus.isBlocked && depStatus.totalPrerequisites > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              <CheckCircle2 size={10} aria-hidden="true" />
              <span>Prerequisites met</span>
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

function TaskModal({ isOpen, onClose, onSave, initial, availableTasks = [] }) {
  const [form, setForm] = useState(initial || { title: '', deadline: '', priority: 'medium', dependsOn: [] });
  React.useEffect(() => {
    setForm(initial || { title: '', deadline: '', priority: 'medium', dependsOn: [] });
  }, [initial]);

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
          placeholder="e.g. Confirm wedding transport"
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
            { value: 'high', label: 'High Priority' },
            { value: 'medium', label: 'Medium Priority' },
            { value: 'low', label: 'Low Priority' },
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
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'ready' | 'blocked' | 'done' | 'overdue'
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
    const newTask = createCustomTask(form.title, form.deadline || null, form.priority, form.dependsOn || []);
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

  const overdue = tasks.filter(t => !t.completed && daysUntil(t.deadline) !== null && daysUntil(t.deadline) < 0);
  const blocked = tasks.filter(t => !t.completed && getTaskDependencyStatus(t, tasks).isBlocked);
  const ready = tasks.filter(t => !t.completed && !getTaskDependencyStatus(t, tasks).isBlocked);
  const completed = tasks.filter(t => t.completed);

  const filtered = tasks
    .filter(t => {
      const dep = getTaskDependencyStatus(t, tasks);
      const isOverdue = !t.completed && daysUntil(t.deadline) !== null && daysUntil(t.deadline) < 0;

      if (filterStatus === 'done' && !t.completed) return false;
      if (filterStatus === 'pending' && t.completed) return false;
      if (filterStatus === 'ready' && (t.completed || dep.isBlocked)) return false;
      if (filterStatus === 'blocked' && (t.completed || !dep.isBlocked)) return false;
      if (filterStatus === 'overdue' && !isOverdue) return false;

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

  return (
    <div>
      <SectionHeader
        title="Timeline & Checklist"
        description={`${event.name} · ${completed.length}/${tasks.length} tasks complete (${progress}%)`}
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

      {/* Progress & Milestone Overview */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-charcoal-900">Overall Planning Progress</h2>
            <p className="text-xs text-charcoal-400 mt-0.5">
              Completing tasks updates dependencies and unlocks subsequent planning stages
            </p>
          </div>
          <span className="text-2xl font-bold text-sage-600">{progress}%</span>
        </div>
        <ProgressBar value={progress} />

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-ivory-100 text-center">
          <div className="p-2 bg-ivory-50 rounded-lg">
            <p className="text-xs text-charcoal-400">Ready to Action</p>
            <p className="text-sm font-bold text-sage-700">{ready.length}</p>
          </div>
          <div className="p-2 bg-ivory-50 rounded-lg">
            <p className="text-xs text-charcoal-400">Blocked by Tasks</p>
            <p className="text-sm font-bold text-amber-700">{blocked.length}</p>
          </div>
          <div className="p-2 bg-ivory-50 rounded-lg">
            <p className="text-xs text-charcoal-400">Overdue</p>
            <p className={`text-sm font-bold ${overdue.length > 0 ? 'text-red-600' : 'text-charcoal-600'}`}>
              {overdue.length}
            </p>
          </div>
          <div className="p-2 bg-ivory-50 rounded-lg">
            <p className="text-xs text-charcoal-400">Completed</p>
            <p className="text-sm font-bold text-charcoal-800">{completed.length}</p>
          </div>
        </div>

        {overdue.length > 0 && (
          <div role="alert" className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
            <div>
              <strong>{overdue.length} task{overdue.length !== 1 ? 's are' : ' is'} overdue:</strong> Review your deadlines to prevent schedule slips.
            </div>
          </div>
        )}
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {[
            ['all', 'All Tasks'],
            ['ready', `Ready (${ready.length})`],
            ['blocked', `Blocked (${blocked.length})`],
            ['overdue', `Overdue (${overdue.length})`],
            ['done', `Completed (${completed.length})`],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterStatus(val)}
              aria-pressed={filterStatus === val}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer
                ${filterStatus === val ? 'bg-sage-500 text-white border-sage-500 shadow-subtle' : 'bg-white text-charcoal-600 border-ivory-300 hover:border-sage-300'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5" role="group" aria-label="Filter by priority">
          {[['all','All Priorities'],['high','High'],['medium','Medium'],['low','Low']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterPriority(val)}
              aria-pressed={filterPriority === val}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer
                ${filterPriority === val ? 'bg-charcoal-700 text-white border-charcoal-700' : 'bg-white text-charcoal-600 border-ivory-300 hover:border-charcoal-400'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon="🎉" title="No tasks match this filter" description="Try selecting a different status or priority filter." />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              allTasks={tasks}
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
        availableTasks={tasks}
      />
    </div>
  );
}
