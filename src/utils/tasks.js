// Task templates per event type, with deadline offsets relative to event date.
// Negative offset = days BEFORE the event.

const BASE_TASKS = {
  wedding: [
    { title: 'Set event budget and priorities', offset: -180, priority: 'high' },
    { title: 'Book venue', offset: -150, priority: 'high' },
    { title: 'Finalize guest list', offset: -120, priority: 'high' },
    { title: 'Send save-the-date notices', offset: -90, priority: 'high' },
    { title: 'Book caterer / finalize menu', offset: -90, priority: 'high' },
    { title: 'Book photographer / videographer', offset: -90, priority: 'high' },
    { title: 'Choose and order decorations', offset: -60, priority: 'medium' },
    { title: 'Book entertainment / DJ / band', offset: -60, priority: 'medium' },
    { title: 'Send formal invitations', offset: -45, priority: 'high' },
    { title: 'Arrange transportation', offset: -30, priority: 'medium' },
    { title: 'Confirm all vendor bookings', offset: -14, priority: 'high' },
    { title: 'Prepare event-day schedule', offset: -7, priority: 'high' },
    { title: 'Final guest count to caterer', offset: -7, priority: 'high' },
    { title: 'Pack and organise personal items', offset: -2, priority: 'medium' },
    { title: 'Day-of coordinator briefing', offset: 0, priority: 'high' },
  ],
  birthday: [
    { title: 'Set budget and theme', offset: -45, priority: 'high' },
    { title: 'Book or arrange venue', offset: -30, priority: 'high' },
    { title: 'Finalise guest list', offset: -30, priority: 'medium' },
    { title: 'Send invitations', offset: -21, priority: 'high' },
    { title: 'Order / arrange birthday cake', offset: -14, priority: 'high' },
    { title: 'Plan decorations and theme setup', offset: -14, priority: 'medium' },
    { title: 'Arrange food and refreshments', offset: -10, priority: 'high' },
    { title: 'Plan activities or entertainment', offset: -10, priority: 'medium' },
    { title: 'Buy or arrange party favours', offset: -7, priority: 'low' },
    { title: 'Confirm guest attendance (RSVP)', offset: -5, priority: 'medium' },
    { title: 'Set up decorations', offset: -1, priority: 'high' },
    { title: 'Prepare day-of schedule', offset: -1, priority: 'medium' },
    { title: 'Pick up / collect cake and supplies', offset: 0, priority: 'high' },
  ],
  community: [
    { title: 'Define event goals and format', offset: -60, priority: 'high' },
    { title: 'Secure venue or outdoor space', offset: -45, priority: 'high' },
    { title: 'Create and distribute promotional material', offset: -30, priority: 'high' },
    { title: 'Organise volunteer roles', offset: -30, priority: 'medium' },
    { title: 'Arrange food stalls or catering', offset: -21, priority: 'high' },
    { title: 'Book entertainment or speakers', offset: -21, priority: 'medium' },
    { title: 'Set up registration or ticketing', offset: -14, priority: 'medium' },
    { title: 'Order banners and decorations', offset: -14, priority: 'medium' },
    { title: 'Confirm vendors and suppliers', offset: -7, priority: 'high' },
    { title: 'Prepare event-day schedule', offset: -5, priority: 'high' },
    { title: 'Conduct volunteer briefing', offset: -2, priority: 'medium' },
    { title: 'Set up venue', offset: -1, priority: 'high' },
    { title: 'Day-of coordination and check-in', offset: 0, priority: 'high' },
  ],
};

import { generateId, addDays, daysUntil } from './helpers.js';

/**
 * Generate tasks for an event. Deadlines are clamped so nothing appears
 * already overdue beyond 30 days if the event is imminent.
 */
export function generateTasks(eventType, eventDate) {
  const templates = BASE_TASKS[eventType] || BASE_TASKS.birthday;
  const days = daysUntil(eventDate);
  return templates.map(t => {
    const deadlineDate = addDays(eventDate, t.offset);
    // Adjust priority for urgent events
    let priority = t.priority;
    if (days !== null && days <= 7 && priority === 'low') priority = 'medium';
    if (days !== null && days <= 3 && priority === 'medium') priority = 'high';
    return {
      id: generateId(),
      title: t.title,
      deadline: deadlineDate,
      priority,
      completed: false,
      custom: false,
    };
  });
}

export function createCustomTask(title, deadline = null, priority = 'medium') {
  return {
    id: generateId(),
    title: title.trim(),
    deadline,
    priority,
    completed: false,
    custom: true,
  };
}
