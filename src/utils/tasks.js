// Task templates per event type, with deadline offsets relative to event date
// and explicit dependencies between milestones.
// Negative offset = days BEFORE the event.

export const BASE_TASKS = {
  wedding: [
    { code: 'budget', title: 'Set event budget and priorities', offset: -180, priority: 'high', dependsOn: [] },
    { code: 'venue', title: 'Book venue & confirm date', offset: -150, priority: 'high', dependsOn: ['budget'] },
    { code: 'guest_list', title: 'Finalize guest list', offset: -120, priority: 'high', dependsOn: ['budget'] },
    { code: 'save_the_date', title: 'Send save-the-date notices', offset: -90, priority: 'high', dependsOn: ['venue', 'guest_list'] },
    { code: 'caterer', title: 'Book caterer / finalize menu', offset: -90, priority: 'high', dependsOn: ['venue'] },
    { code: 'photo', title: 'Book photographer / videographer', offset: -90, priority: 'high', dependsOn: ['venue'] },
    { code: 'decor', title: 'Choose and order decorations', offset: -60, priority: 'medium', dependsOn: ['venue'] },
    { code: 'music', title: 'Book entertainment / DJ / band', offset: -60, priority: 'medium', dependsOn: ['venue'] },
    { code: 'invites', title: 'Send formal invitations', offset: -45, priority: 'high', dependsOn: ['venue', 'guest_list'] },
    { code: 'transport', title: 'Arrange transportation & logistics', offset: -30, priority: 'medium', dependsOn: ['venue'] },
    { code: 'vendors_confirm', title: 'Confirm all vendor bookings', offset: -14, priority: 'high', dependsOn: ['caterer', 'photo', 'decor'] },
    { code: 'day_schedule', title: 'Prepare event-day schedule', offset: -7, priority: 'high', dependsOn: ['venue', 'vendors_confirm'] },
    { code: 'final_caterer', title: 'Final guest count to caterer', offset: -7, priority: 'high', dependsOn: ['invites', 'caterer'] },
    { code: 'packing', title: 'Pack and organise personal items', offset: -2, priority: 'medium', dependsOn: [] },
    { code: 'coordinator', title: 'Day-of coordinator briefing', offset: 0, priority: 'high', dependsOn: ['day_schedule'] },
  ],
  birthday: [
    { code: 'budget', title: 'Set budget and theme', offset: -45, priority: 'high', dependsOn: [] },
    { code: 'venue', title: 'Book or arrange venue', offset: -30, priority: 'high', dependsOn: ['budget'] },
    { code: 'guest_list', title: 'Finalise guest list', offset: -30, priority: 'medium', dependsOn: ['budget'] },
    { code: 'invites', title: 'Send invitations', offset: -21, priority: 'high', dependsOn: ['venue', 'guest_list'] },
    { code: 'cake', title: 'Order / arrange birthday cake', offset: -14, priority: 'high', dependsOn: [] },
    { code: 'decor', title: 'Plan decorations and theme setup', offset: -14, priority: 'medium', dependsOn: ['venue'] },
    { code: 'food', title: 'Arrange food and refreshments', offset: -10, priority: 'high', dependsOn: ['venue'] },
    { code: 'entertainment', title: 'Plan activities or entertainment', offset: -10, priority: 'medium', dependsOn: [] },
    { code: 'favours', title: 'Buy or arrange party favours', offset: -7, priority: 'low', dependsOn: ['guest_list'] },
    { code: 'rsvp', title: 'Confirm guest attendance (RSVP)', offset: -5, priority: 'medium', dependsOn: ['invites'] },
    { code: 'setup', title: 'Set up decorations', offset: -1, priority: 'high', dependsOn: ['decor', 'venue'] },
    { code: 'schedule', title: 'Prepare day-of schedule', offset: -1, priority: 'medium', dependsOn: [] },
    { code: 'pickup', title: 'Pick up / collect cake and supplies', offset: 0, priority: 'high', dependsOn: ['cake'] },
  ],
  community: [
    { code: 'goals', title: 'Define event goals and format', offset: -60, priority: 'high', dependsOn: [] },
    { code: 'venue', title: 'Secure venue or outdoor space', offset: -45, priority: 'high', dependsOn: ['goals'] },
    { code: 'promo', title: 'Create and distribute promotional material', offset: -30, priority: 'high', dependsOn: ['venue'] },
    { code: 'volunteers', title: 'Organise volunteer roles', offset: -30, priority: 'medium', dependsOn: ['goals'] },
    { code: 'catering', title: 'Arrange food stalls or catering', offset: -21, priority: 'high', dependsOn: ['venue'] },
    { code: 'entertainment', title: 'Book entertainment or speakers', offset: -21, priority: 'medium', dependsOn: ['venue'] },
    { code: 'ticketing', title: 'Set up registration or ticketing', offset: -14, priority: 'medium', dependsOn: ['promo'] },
    { code: 'banners', title: 'Order banners and decorations', offset: -14, priority: 'medium', dependsOn: ['venue'] },
    { code: 'vendors_confirm', title: 'Confirm vendors and suppliers', offset: -7, priority: 'high', dependsOn: ['catering', 'banners'] },
    { code: 'schedule', title: 'Prepare event-day schedule', offset: -5, priority: 'high', dependsOn: ['volunteers', 'vendors_confirm'] },
    { code: 'briefing', title: 'Conduct volunteer briefing', offset: -2, priority: 'medium', dependsOn: ['schedule'] },
    { code: 'setup', title: 'Set up venue', offset: -1, priority: 'high', dependsOn: ['venue', 'banners'] },
    { code: 'coordination', title: 'Day-of coordination and check-in', offset: 0, priority: 'high', dependsOn: ['briefing'] },
  ],
};

import { generateId, addDays, daysUntil } from './helpers.js';

/**
 * Generate tasks for an event with initial deadlines and dependency links.
 */
export function generateTasks(eventType, eventDate) {
  const templates = BASE_TASKS[eventType] || BASE_TASKS.birthday;
  const days = daysUntil(eventDate);
  return templates.map(t => {
    const deadlineDate = addDays(eventDate, t.offset);
    let priority = t.priority;
    if (days !== null && days <= 7 && priority === 'low') priority = 'medium';
    if (days !== null && days <= 3 && priority === 'medium') priority = 'high';
    return {
      id: generateId(),
      code: t.code,
      title: t.title,
      offset: t.offset,
      deadline: deadlineDate,
      priority,
      completed: false,
      custom: false,
      dependsOn: t.dependsOn || [],
    };
  });
}

/**
 * Resolves dependency status for a given task against the active task list.
 */
export function getTaskDependencyStatus(task, allTasks = []) {
  if (!task || !task.dependsOn || task.dependsOn.length === 0) {
    return { isBlocked: false, pendingPrerequisites: [], prerequisiteTitles: [] };
  }

  const prereqTasks = allTasks.filter(t =>
    task.dependsOn.includes(t.code) || task.dependsOn.includes(t.id)
  );

  const pending = prereqTasks.filter(t => !t.completed);
  const pendingTitles = pending.map(t => t.title);
  const allTitles = prereqTasks.map(t => t.title);

  return {
    isBlocked: pending.length > 0,
    pendingPrerequisites: pendingTitles,
    prerequisiteTitles: allTitles,
    totalPrerequisites: prereqTasks.length,
    completedPrerequisites: prereqTasks.length - pending.length,
  };
}

/**
 * Reschedule tasks when event date moves earlier or later.
 * Preserves completed state and user custom tasks.
 */
export function rescheduleTasksOnDateShift(tasks = [], newEventDate, oldEventDate) {
  if (!newEventDate || !Array.isArray(tasks)) return { updatedTasks: tasks, overdueCount: 0, criticalCount: 0 };

  const oldDays = oldEventDate ? daysUntil(oldEventDate) : null;
  const newDays = daysUntil(newEventDate);
  const daysShift = (oldDays !== null && newDays !== null) ? (newDays - oldDays) : 0;

  let overdueCount = 0;
  let criticalCount = 0;

  const updatedTasks = tasks.map(task => {
    let newDeadline = task.deadline;

    if (typeof task.offset === 'number') {
      newDeadline = addDays(newEventDate, task.offset);
    } else if (task.deadline && daysShift !== 0) {
      newDeadline = addDays(task.deadline, daysShift);
    }

    if (!task.completed && newDeadline) {
      const remaining = daysUntil(newDeadline);
      if (remaining !== null && remaining < 0) overdueCount++;
      else if (remaining !== null && remaining <= 3) criticalCount++;
    }

    return {
      ...task,
      deadline: newDeadline,
    };
  });

  return { updatedTasks, overdueCount, criticalCount };
}

export function createCustomTask(title, deadline = null, priority = 'medium', dependsOn = []) {
  return {
    id: generateId(),
    code: `custom_${Date.now()}`,
    title: title.trim(),
    deadline,
    priority,
    completed: false,
    custom: true,
    dependsOn: Array.isArray(dependsOn) ? dependsOn : [],
  };
}
