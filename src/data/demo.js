/**
 * Demo data for the sample/demo mode.
 * Labelled clearly as sample data throughout the UI.
 */

import { generateId } from '../utils/helpers.js';
import { generateTasks } from '../utils/tasks.js';
import { generateBudgetAllocations } from '../utils/helpers.js';

const TODAY = new Date();
const futureDate = (days) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export function getDemoEvents() {
  const e1id = generateId();
  const e2id = generateId();

  const e1Tasks = generateTasks('wedding', futureDate(45));
  // Mark some complete
  e1Tasks.slice(0, 4).forEach(t => (t.completed = true));

  const e2Tasks = generateTasks('birthday', futureDate(12));
  e2Tasks.slice(0, 2).forEach(t => (t.completed = true));

  return [
    {
      id: e1id,
      name: 'Priya & Arjun Wedding',
      occasion: 'wedding',
      date: futureDate(45),
      location: 'Grand Ballroom, Mumbai',
      guestCount: 150,
      budget: 500000,
      theme: 'Classic Ivory & Gold',
      foodPreferences: 'Vegetarian with live counters',
      notes: 'Sample demo event — not real data.',
      createdAt: new Date().toISOString(),
      tasks: e1Tasks,
      budget_allocations: generateBudgetAllocations(500000, 'wedding'),
      _demo: true,
    },
    {
      id: e2id,
      name: 'Rahul\'s 30th Birthday',
      occasion: 'birthday',
      date: futureDate(12),
      location: 'Home Garden, Bangalore',
      guestCount: 40,
      budget: 25000,
      theme: 'Retro 90s',
      foodPreferences: 'Finger foods and snacks',
      notes: 'Sample demo event — not real data.',
      createdAt: new Date().toISOString(),
      tasks: e2Tasks,
      budget_allocations: generateBudgetAllocations(25000, 'birthday'),
      _demo: true,
    },
  ];
}

export function getDemoVendors(eventIds) {
  const [e1id, e2id] = eventIds;
  return [
    {
      id: generateId(),
      eventId: e1id,
      name: 'Mehta Catering Co.',
      category: 'catering',
      contact: '+91 98765 43210',
      price: 150000,
      notes: 'Quoted for 150 pax, vegetarian full service. SAMPLE DATA.',
      status: 'booked',
      _demo: true,
    },
    {
      id: generateId(),
      eventId: e1id,
      name: 'Lens & Light Photography',
      category: 'photography',
      contact: '+91 87654 32109',
      price: 55000,
      notes: '8-hour package, 2 photographers. SAMPLE DATA.',
      status: 'enquired',
      _demo: true,
    },
    {
      id: generateId(),
      eventId: e2id,
      name: 'Party Prop Rentals',
      category: 'decorations',
      contact: '+91 76543 21098',
      price: 5000,
      notes: 'Retro 90s props and balloon arch. SAMPLE DATA.',
      status: 'booked',
      _demo: true,
    },
  ];
}
