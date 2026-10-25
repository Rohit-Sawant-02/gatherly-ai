import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Sparkles, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Button, Input, Select, Textarea, Card } from './ui/index.jsx';
import { generateId, validateEvent, generateBudgetAllocations, parseNumber } from '../utils/helpers.js';
import { generateTasks } from '../utils/tasks.js';

const STEPS = [
  { id: 1, title: 'Event Basics', description: 'Name, type, and date' },
  { id: 2, title: 'Guests & Budget', description: 'How many and how much' },
  { id: 3, title: 'Style & Preferences', description: 'Theme and food' },
  { id: 4, title: 'Review & Generate', description: 'Confirm and create' },
];

const OCCASION_OPTIONS = [
  { value: '', label: 'Select occasion…', disabled: true },
  { value: 'wedding', label: '💍 Wedding' },
  { value: 'birthday', label: '🎂 Birthday' },
  { value: 'community', label: '🌿 Community Event' },
];

const THEME_OPTIONS = {
  wedding: ['Classic Ivory & Gold', 'Rustic Boho Garden', 'Modern Minimalist', 'Royal Garden', 'Beach / Destination', 'Other'],
  birthday: ['Pastel & Whimsical', 'Elegant Black & Gold', 'Retro / Vintage', 'Tropical Jungle', 'Superhero / Character', 'Other'],
  community: ['Cultural Heritage', 'Modern & Vibrant', 'Eco / Green', 'Festive & Fun', 'Other'],
};

const FOOD_OPTIONS = {
  wedding: ['Full Vegetarian', 'Non-Vegetarian', 'Jain-Friendly', 'Continental + Indian Fusion', 'Live Counters + Buffet', 'Other'],
  birthday: ['Finger Foods & Snacks', 'Full Buffet', 'Pizza & Pasta', 'Traditional Meal', 'Other'],
  community: ['Food Stalls from Local Vendors', 'Packaged Meal Boxes', 'Pot-luck Style', 'Mixed Stalls + Beverage Counter', 'Other'],
};

const empty = {
  name: '', occasion: '', date: '', location: '',
  guestCount: '', budget: '', theme: '', foodPreferences: '', notes: '',
};

function StepIndicator({ current }) {
  return (
    <nav aria-label="Event creation steps" className="flex items-center gap-1 mb-8">
      {STEPS.map((step, i) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div
                aria-current={active ? 'step' : undefined}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200
                  ${done ? 'bg-sage-500 text-white' : active ? 'bg-sage-500 text-white ring-4 ring-sage-100' : 'bg-ivory-200 text-charcoal-400'}
                `}
              >
                {done ? '✓' : step.id}
              </div>
              <span className={`hidden sm:block text-[10px] font-medium ${active ? 'text-sage-600' : 'text-charcoal-400'}`}>
                {step.title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mt-[-12px] transition-colors ${done ? 'bg-sage-400' : 'bg-ivory-200'}`} aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

function ReviewRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2 border-b border-ivory-100 last:border-0">
      <span className="text-sm text-charcoal-500 w-36 flex-shrink-0">{label}</span>
      <span className="text-sm text-charcoal-900 font-medium">{value}</span>
    </div>
  );
}

export default function EventWizard() {
  const { dispatch, navigate } = useApp();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const themeOptions = [{ value: '', label: 'Select theme…', disabled: true },
    ...(THEME_OPTIONS[form.occasion] || []).map(t => ({ value: t, label: t }))];
  const foodOptions = [{ value: '', label: 'Select preference…', disabled: true },
    ...(FOOD_OPTIONS[form.occasion] || []).map(f => ({ value: f, label: f }))];

  const validate = () => {
    const e = validateEvent(form);
    // Step-specific subset
    if (step === 1) {
      const subset = {};
      if (e.name) subset.name = e.name;
      if (e.occasion) subset.occasion = e.occasion;
      if (e.date) subset.date = e.date;
      setErrors(subset);
      return Object.keys(subset).length === 0;
    }
    if (step === 2) {
      const subset = {};
      if (e.guestCount) subset.guestCount = e.guestCount;
      if (e.budget) subset.budget = e.budget;
      setErrors(subset);
      return Object.keys(subset).length === 0;
    }
    setErrors({});
    return true;
  };

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, 4)); };
  const back = () => { setErrors({}); setStep(s => Math.max(s - 1, 1)); };

  const handleGenerate = () => {
    const allErrors = validateEvent(form);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }
    const id = generateId();
    const tasks = generateTasks(form.occasion, form.date);
    const budgetAllocations = generateBudgetAllocations(parseNumber(form.budget), form.occasion);
    const newEvent = {
      id,
      ...form,
      guestCount: parseNumber(form.guestCount),
      budget: parseNumber(form.budget),
      tasks,
      budget_allocations: budgetAllocations,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_EVENT', payload: newEvent });
    dispatch({ type: 'SET_ACTIVE_EVENT', payload: id });
    navigate('events');
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Plan an Event</h1>
          <p className="text-sm text-charcoal-500 mt-1">Step {step} of {STEPS.length}: {STEPS[step - 1].description}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('dashboard')} ariaLabel="Cancel and go to dashboard">
          <X size={16} aria-hidden="true" /> Cancel
        </Button>
      </div>

      <StepIndicator current={step} />

      <Card>
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-charcoal-900 mb-4">Event Basics</h2>
            <Input
              id="event-name" label="Event Name" required
              value={form.name} onChange={set('name')}
              placeholder="e.g. Priya's 30th Birthday"
              error={errors.name}
            />
            <Select
              id="occasion" label="Occasion Type" required
              value={form.occasion} onChange={set('occasion')}
              options={OCCASION_OPTIONS}
              error={errors.occasion}
            />
            <Input
              id="event-date" label="Event Date" required type="date"
              value={form.date} onChange={set('date')}
              min={todayStr}
              error={errors.date}
              hint="Select your celebration date (today or future)"
            />
            <Input
              id="location" label="Location / Venue"
              value={form.location} onChange={set('location')}
              placeholder="e.g. Grand Ballroom, Mumbai or Home"
            />
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-charcoal-900 mb-4">Guests & Budget</h2>
            <Input
              id="guest-count" label="Number of Guests" required type="number"
              value={form.guestCount} onChange={set('guestCount')}
              placeholder="e.g. 50"
              hint="Approximate total headcount"
              error={errors.guestCount}
            />
            <Input
              id="budget" label="Total Budget (₹)" required type="number"
              value={form.budget} onChange={set('budget')}
              placeholder="e.g. 50000"
              prefix="₹"
              hint="Your total planned spend in Indian Rupees"
              error={errors.budget}
            />
            {form.budget && form.guestCount && parseNumber(form.budget) > 0 && parseNumber(form.guestCount) > 0 && (
              <div className="p-3 bg-sage-50 border border-sage-200 rounded-lg text-sm text-sage-700">
                That's approximately <strong>₹{Math.round(parseNumber(form.budget) / parseNumber(form.guestCount)).toLocaleString('en-IN')}</strong> per guest.
              </div>
            )}
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-charcoal-900 mb-4">Style & Preferences</h2>
            {form.occasion ? (
              <>
                <Select
                  id="theme" label="Preferred Theme"
                  value={form.theme} onChange={set('theme')}
                  options={themeOptions}
                  hint="Choose a style direction for your event"
                />
                <Select
                  id="food" label="Food Preferences"
                  value={form.foodPreferences} onChange={set('foodPreferences')}
                  options={foodOptions}
                  hint="Helps tailor catering suggestions"
                />
              </>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                Please go back and select an occasion type first.
              </div>
            )}
            <Textarea
              id="notes" label="Additional Notes"
              value={form.notes} onChange={set('notes')}
              placeholder="Any special requirements, accessibility needs, or notes…"
              rows={3}
            />
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gold-50 rounded-xl">
                <Sparkles size={22} className="text-gold-600" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-charcoal-900">Review Your Event</h2>
                <p className="text-sm text-charcoal-500">Confirm details before generating your plan</p>
              </div>
            </div>
            <div className="bg-ivory-50 rounded-xl p-4 mb-6">
              <ReviewRow label="Event Name" value={form.name} />
              <ReviewRow label="Occasion" value={form.occasion} />
              <ReviewRow label="Date" value={form.date} />
              <ReviewRow label="Location" value={form.location} />
              <ReviewRow label="Guests" value={form.guestCount ? `${form.guestCount} people` : ''} />
              <ReviewRow label="Budget" value={form.budget ? `₹${parseNumber(form.budget).toLocaleString('en-IN')}` : ''} />
              <ReviewRow label="Theme" value={form.theme} />
              <ReviewRow label="Food" value={form.foodPreferences} />
              <ReviewRow label="Notes" value={form.notes} />
            </div>
            <div className="p-4 bg-sage-50 border border-sage-200 rounded-xl text-sm text-sage-800">
              <p className="font-semibold mb-1">✨ What Gatherly AI will generate:</p>
              <ul className="list-disc list-inside space-y-1 text-sage-700">
                <li>A personalised checklist with deadlines relative to your event date</li>
                <li>A suggested budget breakdown by category</li>
                <li>Tailored advice in the Planning Assistant</li>
              </ul>
            </div>
            {Object.keys(errors).length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                Please fix the errors above before generating.
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-ivory-200">
          <Button variant="secondary" onClick={back} disabled={step === 1}>
            <ChevronLeft size={16} aria-hidden="true" /> Back
          </Button>
          {step < 4 ? (
            <Button variant="primary" onClick={next}>
              Continue <ChevronRight size={16} aria-hidden="true" />
            </Button>
          ) : (
            <Button variant="gold" size="lg" onClick={handleGenerate}>
              <Sparkles size={18} aria-hidden="true" /> Generate My Plan
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
