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
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function getDemoEvents() {
  const e1id = generateId();
  const e2id = generateId();

  // Test Scenario: Wedding, ₹8,00,000 budget, 200 guests, 4 months (120 days) away
  const e1Tasks = generateTasks('wedding', futureDate(120));
  // Mark initial budget and venue search milestones complete
  e1Tasks.slice(0, 3).forEach(t => (t.completed = true));

  const e2Tasks = generateTasks('birthday', futureDate(14));
  e2Tasks.slice(0, 2).forEach(t => (t.completed = true));

  return [
    {
      id: e1id,
      name: 'Priya & Arjun Wedding',
      occasion: 'wedding',
      date: futureDate(120),
      location: 'Grand Ballroom, Mumbai',
      guestCount: 200,
      budget: 800000,
      primaryFocus: 'food',
      theme: 'Classic Ivory & Gold',
      foodPreferences: 'Vegetarian with live chaat & pasta counters',
      notes: 'Hackathon benchmark scenario: Wedding, ₹8,00,000 budget, 200 guests, 4 months away.',
      createdAt: new Date().toISOString(),
      tasks: e1Tasks,
      budget_allocations: generateBudgetAllocations(800000, 'wedding', 200),
      _demo: true,
    },
    {
      id: e2id,
      name: 'Rahul\'s 30th Birthday',
      occasion: 'birthday',
      date: futureDate(14),
      location: 'Home Garden, Bangalore',
      guestCount: 40,
      budget: 25000,
      primaryFocus: 'balanced',
      theme: 'Retro 90s',
      foodPreferences: 'Finger foods and snacks',
      notes: 'Sample demo event — not real data.',
      createdAt: new Date().toISOString(),
      tasks: e2Tasks,
      budget_allocations: generateBudgetAllocations(25000, 'birthday', 40),
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
      price: 240000,
      guestCapacity: 200,
      additionalCharges: 12000,
      servicesIncluded: '4 starters, 3 main curries, live chaat counter, dessert buffet, service staff, cutlery',
      notes: 'Quoted for 200 pax, vegetarian full service at ~₹1,200/plate. SAMPLE DATA.',
      status: 'quoted',
      _demo: true,
    },
    {
      id: generateId(),
      eventId: e1id,
      name: 'Royal Feast Caterers',
      category: 'catering',
      contact: '+91 98111 22334',
      price: 280000,
      guestCapacity: 200,
      additionalCharges: 18000,
      servicesIncluded: '5 starters, continental + Indian mains, live counter, bespoke mocktail bar',
      notes: 'Premium package, 200 pax. SAMPLE DATA.',
      status: 'enquired',
      _demo: true,
    },
    {
      id: generateId(),
      eventId: e1id,
      name: 'Lens & Light Photography',
      category: 'photography',
      contact: '+91 87654 32109',
      price: 90000,
      guestCapacity: 0,
      additionalCharges: 5000,
      servicesIncluded: 'Full day candid + traditional coverage, drone footage, 2 photographers, raw video files',
      notes: 'Wedding day package. SAMPLE DATA.',
      status: 'booked',
      _demo: true,
    },
    {
      id: generateId(),
      eventId: e2id,
      name: 'Party Prop Rentals',
      category: 'decorations',
      contact: '+91 76543 21098',
      price: 5000,
      guestCapacity: 40,
      additionalCharges: 500,
      servicesIncluded: 'Retro 90s cassette banner, balloon arch, photo booth props',
      notes: 'Setup and teardown included. SAMPLE DATA.',
      status: 'booked',
      _demo: true,
    },
  ];
}
