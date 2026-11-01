/**
 * Local rule-based planning assistant for Gatherly AI.
 *
 * TRANSPARENCY & ACCURACY NOTICE:
 * This assistant executes entirely in-browser using deterministic client-side logic,
 * event state inspection, dependency graphs, and structured decision rules.
 * It is NOT a live generative AI model and does NOT call external AI APIs.
 * All budget ratios, timelines, and trade-off recommendations are illustrative
 * planning estimates based on Indian event standards.
 */

import {
  formatINR,
  daysUntil,
  urgencyLevel,
  parseNumber,
  BUDGET_CATEGORIES,
  DEFAULT_PRIORITIES,
  generateContextualBudgetAllocations,
  detectBudgetConflicts,
  generateTradeOffSuggestions,
} from './helpers.js';
import { getTaskDependencyStatus } from './tasks.js';

// ─── Intent Detection ────────────────────────────────────────────────────────

const OUT_OF_SCOPE = [
  'stock', 'stocks', 'bitcoin', 'crypto', 'poem', 'poetry', 'weather', 'movie', 'song', 'joke', 'coding', 'politics', 'medical', 'legal advice'
];

const INTENTS = [
  { key: 'plan',        patterns: ['generate plan', 'generate my plan', 'my plan', 'roadmap', 'refresh suggestion', 'recalculate', 'summary', 'overview', 'master plan'] },
  { key: 'tradeoff',    patterns: ['tradeoff', 'trade-off', 'cut expense', 'cut expenses', 'cut cost', 'cut costs', 'save money', 'reduce cost', 'lower budget', 'tight budget', 'reduce spend', 'cut budget', 'where to cut', 'where should i cut', 'cut'] },
  { key: 'dependency',  patterns: ['dependency', 'dependencies', 'first step', 'what first', 'what next', 'order of task', 'sequence', 'prerequisite', 'prerequisites', 'before'] },
  { key: 'guest_impact',patterns: ['guest count', 'more guests', 'increase guest', 'increase guests', 'guest increase', 'per person', 'per head', 'per plate', 'headcount', 'attendance'] },
  { key: 'budget',      patterns: ['budget', 'budgets', 'split budget', 'how to split', 'spend', 'spending', 'money', 'allocation', 'allocations', 'rupee', '₹', 'expensive', 'cost', 'costs'] },
  { key: 'food',        patterns: ['food', 'catering', 'caterer', 'menu', 'eat', 'drink', 'cake', 'snack', 'snacks', 'meal', 'cuisine', 'buffet', 'diet'] },
  { key: 'venue',       patterns: ['venue', 'location', 'hall', 'garden', 'banquet', 'ballroom', 'capacity'] },
  { key: 'decoration',  patterns: ['decor', 'decoration', 'decorations', 'theme', 'flower', 'flowers', 'balloon', 'balloons', 'setup', 'stage', 'props'] },
  { key: 'photo',       patterns: ['photo', 'photography', 'videographer', 'photographer', 'album', 'shoot', 'camera'] },
  { key: 'urgent',      patterns: ['urgent', 'asap', 'hurry', 'deadline', 'overdue', 'critical'] },
  { key: 'checklist',   patterns: ['task', 'tasks', 'checklist', 'todo', 'to-do', 'progress', 'status', 'milestone'] },
  { key: 'vendor',      patterns: ['vendor', 'vendors', 'supplier', 'suppliers', 'quote', 'quotes', 'quotation', 'quotations', 'compare quote', 'hire'] },
  { key: 'ideas',       patterns: ['idea', 'ideas', 'inspiration', 'creative', 'theme idea'] },
  { key: 'greeting',    patterns: ['hello', 'hi', 'hey', 'help', 'start', 'what can you do', 'who are you'] },
];

function detectIntent(input) {
  const lower = String(input || '').toLowerCase().trim();
  if (!lower) return 'general';

  // Early-exit for queries completely outside event planning scope
  if (OUT_OF_SCOPE.some(term => new RegExp(`\\b${term}\\b`, 'i').test(lower))) {
    return 'general';
  }

  for (const intent of INTENTS) {
    for (const pattern of intent.patterns) {
      if (pattern.includes(' ') || pattern.includes('-') || pattern.includes('₹')) {
        if (lower.includes(pattern)) return intent.key;
      } else {
        const regex = new RegExp(`\\b${pattern}\\b`, 'i');
        if (regex.test(lower)) return intent.key;
      }
    }
  }
  return 'general';
}

const OCCASION_LABEL = {
  wedding: 'wedding',
  birthday: 'birthday celebration',
  community: 'community event',
};

// ─── Intent Responders ───────────────────────────────────────────────────────

function greetingResponse(event) {
  if (!event) {
    return {
      message: `👋 Hi! I'm the **Gatherly Assistant** — your context-aware event planning guide.\n\nI use local rules and your event details to provide tailored planning recommendations, milestone tracking, and budget trade-offs. No external AI API is used.\n\nTo get started, create an event or ask:\n- *"How should I plan my budget?"*\n- *"What tasks should I do first?"*\n- *"Where can I cut expenses without sacrificing quality?"*`,
      suggestions: ['How do I create an event?', 'What can you help with?', 'Give me budget tips'],
    };
  }

  const days = daysUntil(event.date);
  const urgency = urgencyLevel(days);
  const label = OCCASION_LABEL[event.occasion] || event.occasion;
  const budget = parseNumber(event.budget);
  const guests = parseNumber(event.guestCount) || 1;
  const perGuest = Math.round(budget / guests);

  const dayLine = days === null ? '' : days === 0 ? ' \u2014 **Event Day!**' : days < 0 ? ` \u2014 it was ${Math.abs(days)} days ago` : ` \u2014 **${days} days remaining**`;
  let urgencyMsg = '';
  if (urgency === 'critical') urgencyMsg = '\n\n⚠️ **Urgent timeline:** Your celebration is in less than 4 days. Focus strictly on final day-of coordination.';
  else if (urgency === 'high') urgencyMsg = '\n\n📋 **Approaching milestone:** Less than 2 weeks to go. Ensure all vendor bookings and final guest headcounts are locked.';

  return {
    message: `👋 Hello! I'm actively assisting with **${event.name}** — your ${label} for **${guests} guests** with a budget of **${formatINR(budget)}** (~${formatINR(perGuest)}/guest)${dayLine}.${urgencyMsg}\n\nWhat would you like to plan right now?`,
    suggestions: ['What should I do first?', 'How should I split my budget?', 'Where can I cut costs?', 'Food planning tips'],
  };
}

function budgetResponse(event, tasks = []) {
  if (!event) return fallbackResponse();
  const budget = parseNumber(event.budget);
  const guests = Math.max(1, parseNumber(event.guestCount));
  const occasion = event.occasion || 'wedding';
  const perPerson = Math.round(budget / guests);

  let allocations = event.budget_allocations;
  if (!allocations || allocations.length === 0) {
    allocations = generateContextualBudgetAllocations(budget, occasion, guests, event.priorities || {});
  }

  const lines = allocations.map(a => {
    const amt = parseNumber(a.allocated);
    const pct = a.percentage || (budget > 0 ? Math.round((amt / budget) * 100) : 0);
    const perHeadNote = a.id === 'catering' ? ` (~${formatINR(Math.round(amt / guests))}/plate)` : '';
    return `- **${a.label}**: ${formatINR(amt)} (${pct}%)${perHeadNote}`;
  });

  const conflicts = detectBudgetConflicts(budget, allocations, guests, occasion);
  let conflictAlert = '';
  if (conflicts.length > 0 && conflicts[0].type !== 'under_allocated') {
    conflictAlert = `\n\n⚠️ **Budget Notice:** ${conflicts[0].message}`;
  }

  const occLabel = OCCASION_LABEL[occasion] || occasion;

  return {
    message: `💰 **Contextual Budget Breakdown for your ${occLabel} (${event.name} — ${formatINR(budget)} total for ${guests} guests):**\n\n${lines.join('\n')}\n\n- **Overall Spend**: ~**${formatINR(perPerson)} per guest**\n- **Catering Benchmark**: ${formatINR(Math.round((allocations.find(a => a.id === 'catering')?.allocated || 0) / guests))}/guest${conflictAlert}\n\n*Estimates are illustrative planning figures based on your priorities and Indian event norms. Adjust them anytime in the Budget Planner.*`,
    suggestions: ['Where can I cut costs?', 'What tasks should I do first?', 'Food planning tips', 'Vendor comparison tips'],
  };
}

function tradeOffResponse(event, tasks = []) {
  if (!event) return fallbackResponse();
  const allocations = event.budget_allocations || [];
  const tradeOffs = generateTradeOffSuggestions(event, allocations);
  const priorities = event.priorities || DEFAULT_PRIORITIES[event.occasion] || {};

  const highPriorities = BUDGET_CATEGORIES
    .filter(c => (priorities[c.id] || 'medium') === 'high')
    .map(c => c.label);

  if (tradeOffs.length === 0) {
    return {
      message: `⚖️ **Trade-Off Analysis:**\n\nYour current allocations for **${event.name}** are well-balanced within your ${formatINR(event.budget)} budget. High priority items (${highPriorities.join(', ')}) are protected.\n\nIf you need to free up funds, consider negotiating vendor packaging discounts in the Vendor Manager.`,
      suggestions: ['How should I split my budget?', 'What should I do first?'],
    };
  }

  const tradeOffLines = tradeOffs.map(to =>
    `- **${to.categoryLabel}** (Save ~${formatINR(to.saving)}):\n  ${to.rationale}\n  *Trade-off impact: ${to.tradeoff}*`
  ).join('\n\n');

  return {
    message: `⚖️ **Smart Priority-Based Trade-Off Suggestions:**\n\nTo keep your budget balanced without compromising your top priorities (**${highPriorities.slice(0, 3).join(' & ')}**), here are structured areas to optimize:\n\n${tradeOffLines}\n\n💡 *Unlike equal across-the-board cuts, priority trade-offs protect what matters most to your event experience. You can apply these in the Budget Planner.*`,
    suggestions: ['How should I split my budget?', 'Food planning tips', 'What should I do first?'],
  };
}

function dependencyResponse(event, tasks = []) {
  if (!event) return fallbackResponse();
  const allTasks = tasks || event.tasks || [];
  const days = daysUntil(event.date);

  const pending = allTasks.filter(t => !t.completed);
  const readyTasks = pending.filter(t => !getTaskDependencyStatus(t, allTasks).isBlocked);
  const blockedTasks = pending.filter(t => getTaskDependencyStatus(t, allTasks).isBlocked);

  const readyLines = readyTasks.slice(0, 3).map(t => `- 🟢 **${t.title}** (Priority: ${t.priority.toUpperCase()})`).join('\n');
  const blockedLines = blockedTasks.slice(0, 2).map(t => {
    const status = getTaskDependencyStatus(t, allTasks);
    return `- 🔒 **${t.title}** (Waiting for: *${status.pendingPrerequisites[0]}*)`;
  }).join('\n');

  return {
    message: `🔗 **Dependency & Milestone Sequence for ${event.name}:**\n\nEvent planning follows strict sequential dependencies:\n1. **Venue & Date Lock**: Essential first step. Caterers, decorators, and photographers cannot confirm bookings without confirmed venue logistics.\n2. **Guest List Finalization**: Must precede printing formal invitations and finalizing per-head catering counts.\n3. **Vendor Confirmations**: Proceed once venue, catering, and decor specifications align.\n\n**Ready to Action Right Now:**\n${readyLines || '- All pending tasks currently waiting on prerequisites.'}\n\n${blockedTasks.length > 0 ? `**Dependent Tasks Waiting on Prerequisites:**\n${blockedLines}` : 'No blocked tasks!'}\n\n*Track and unlock tasks in Timeline & Tasks.*`,
    suggestions: ['What should I do first?', 'How should I split my budget?', 'Where can I cut costs?'],
  };
}

function guestImpactResponse(event, tasks = []) {
  if (!event) return fallbackResponse();
  const budget = parseNumber(event.budget);
  const guests = parseNumber(event.guestCount) || 1;
  const plateRate = event.occasion === 'wedding' ? 1200 : event.occasion === 'birthday' ? 500 : 250;
  const currentCatering = guests * plateRate;
  const add50Cost = 50 * plateRate;

  return {
    message: `👥 **Guest Count & Capacity Ripple Effect:**\n\n- **Current Count**: ${guests} guests\n- **Total Budget**: ${formatINR(budget)} (~${formatINR(Math.round(budget / guests))}/guest)\n- **Estimated Catering**: ~${formatINR(currentCatering)} at ~${formatINR(plateRate)}/plate\n\n**Connected Decisions When Guest Count Changes:**\n- **+50 Guests**: Adds approx **${formatINR(add50Cost)}** in food and drinks alone, plus additional tables, invitations, and seating.\n- **Venue Capacity**: Ensure your booked venue supports ${guests + 50} pax with parking and fire clearance.\n- **Trade-Off**: If headcount increases, either expand the total budget or reduce decor/entertainment allocations.\n\n*Update your guest count in My Events to trigger automatic recalculations.*`,
    suggestions: ['Where can I cut costs?', 'How should I split my budget?', 'Food planning tips'],
  };
}

function generatePlanResponse(event, tasks = []) {
  if (!event) {
    return {
      message: `✨ **Event Plan Generator**\n\nPlease select or create an event to generate a personalized planning roadmap with budget splits, urgent deadlines, and style tips.`,
      suggestions: ['How do I create an event?', 'What can you help with?'],
    };
  }
  const days = daysUntil(event.date);
  const pending = (tasks || []).filter(t => !t.completed);
  const total = tasks?.length || 0;
  const done = total - pending.length;
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

  const alloc = event.budget_allocations || [];
  const topCategories = [...alloc].sort((a, b) => (b.allocated || 0) - (a.allocated || 0)).slice(0, 3);
  const catLines = topCategories.map(c => `- **${c.label}**: ${formatINR(c.allocated)}`).join('\n');

  // Next unblocked urgent tasks
  const unblockedPending = pending.filter(t => !getTaskDependencyStatus(t, tasks).isBlocked);
  const nextTasks = unblockedPending.slice(0, 3);
  const nextStepLines = nextTasks.length > 0
    ? nextTasks.map(t => `- 🟢 ${t.title} (${t.priority.toUpperCase()})`).join('\n')
    : '- All immediate high-priority milestones are completed or blocked by prerequisites!';

  const themeNote = event.theme ? `\n- **Theme Direction**: ${event.theme}` : '';
  const foodNote = event.foodPreferences ? `\n- **Menu Preference**: ${event.foodPreferences}` : '';
  const guests = event.guestCount || 100;

  return {
    message: `📋 **Tailored Plan Overview for ${event.name}:**\n\n- **Occasion**: ${OCCASION_LABEL[event.occasion] || event.occasion}\n- **Headcount**: ${guests} guests (~${formatINR(Math.round(parseNumber(event.budget) / guests))}/guest)\n- **Timeline**: ${days !== null ? (days >= 0 ? `${days} days remaining` : `${Math.abs(days)} days ago`) : 'Date unset'}\n- **Checklist Progress**: ${done}/${total} tasks finished (${progressPct}% complete)\n- **Planned Budget**: ${formatINR(event.budget)}${themeNote}${foodNote}\n\n**Top Budget Allocations:**\n${catLines || '- No allocations recorded yet.'}\n\n**Next Unblocked Tasks to Complete:**\n${nextStepLines}\n\n💡 *Calculated deterministically using connected event data and task dependencies.*`,
    suggestions: ['How should I split my budget?', 'Where can I cut costs?', 'What should I do first?', 'Food planning tips'],
  };
}

function decorationResponse(event) {
  if (!event) return fallbackResponse();
  const themeIntro = event.theme ? `✨ **Selected Theme:** *${event.theme}*\n\n` : '';
  const themes = {
    wedding: [
      'Classic Ivory and Gold with brass urlis, warm fairy lights, and floral garlands',
      'Rustic Bohemian with pampas grass, macrame arches, and wooden barrels',
      'Modern Minimalist with geometric structures, sheer white drapes, and monoline lighting',
      'Royal Garden with rose arches, candle lanterns, and velvet accents',
    ],
    birthday: [
      'Pastel balloon garland arch with custom neon name signage',
      'Tropical Jungle safari with faux monstera leaves and wooden accents',
      'Retro 90s vintage with cassette props, vinyl records, and disco lighting',
      'Elegant Gold and Black with ambient tea lights and minimalist centerpieces',
    ],
    community: [
      'Traditional cultural rangoli with marigold floral backdrops and fabric canopies',
      'Eco-friendly sustainable decor using potted plants that attendees can adopt',
      'Modern community festival with branded banners and color-coordinated stages',
    ],
  };
  const list = (themes[event.occasion] || themes.birthday).map(t => `- ${t}`).join('\n');
  return {
    message: `${themeIntro}🎨 **Decoration Ideas for your ${OCCASION_LABEL[event.occasion] || 'event'}:**\n\n${list}\n\n💡 **Cost-Saving Tip:** Focus budget on a single focal photo backdrop rather than dispersing decor sparsely throughout a large space.`,
    suggestions: ['Where can I cut costs?', 'Food planning tips', 'Venue suggestions'],
  };
}

function foodResponse(event) {
  if (!event) return fallbackResponse();
  const foodIntro = event.foodPreferences ? `🥗 **Dietary Direction:** *${event.foodPreferences}*\n\n` : '';
  const budget = parseNumber(event.budget);
  const guests = parseNumber(event.guestCount) || 50;
  const foodBudget = { wedding: 0.30, birthday: 0.35, community: 0.30 }[event.occasion] || 0.35;
  const perPersonFood = Math.round((budget * foodBudget) / guests);

  const menus = {
    wedding: `- 4 live appetiser counters (Chaat, Dim Sum, Tikkas)\n- Main buffet with 3 vegetarian curries, dal makhani, assorted rotis, biryani\n- Dedicated dessert counter with hot jalebi-rabri, ice creams, and gulab jamun\n- Welcome mocktail & sherbet bar`,
    birthday: `- Interactive live pasta or taco station\n- Finger food platters: sliders, loaded nachos, and cheese poppers\n- Signature custom theme birthday cake\n- Dessert shooters and mocktails`,
    community: `- Efficient buffet or pre-packed hygienic thali boxes\n- Regional favorites (biryani, pav bhaji, or poori bhaji)\n- Masala chai and seasonal juice corner`,
  };

  return {
    message: `${foodIntro}🍽️ **Catering & Menu Planning for ${guests} guests:**\n\n- **Target Catering Spend**: ~**${formatINR(Math.round(budget * foodBudget))}**\n- **Estimated Rate**: ~**${formatINR(perPersonFood)} per plate**\n\n**Recommended Menu Structure:**\n${menus[event.occasion] || menus.birthday}\n\n💡 **Planning Rule:** Confirm tasting sessions 6–8 weeks before the event. Submit final RSVPs to the caterer 7 days prior to prevent food wastage or surprise surcharges.`,
    suggestions: ['How should I split my budget?', 'Where can I cut costs?', 'Vendor booking tips'],
  };
}

function venueResponse(event) {
  if (!event) return fallbackResponse();
  const guests = event.guestCount || 100;
  const venues = {
    wedding: [
      `Banquet Hall (ensure verified capacity for ${guests}+ guests with dining hall)`,
      'Lawn / Farmhouse with weather contingencies (monsoon/summer water cooling)',
      'Hotel Ballroom with integrated rooms for family stay and green rooms',
    ],
    birthday: [
      'Residential clubhouse or terrace garden',
      'Private party lounge / cafe with sound system',
      'Community hall or lawn',
    ],
    community: [
      'Public auditorium or school ground (check civic noise permits)',
      'Community center sports complex',
    ],
  };
  const list = (venues[event.occasion] || venues.birthday).map(v => `- ${v}`).join('\n');
  return {
    message: `📍 **Venue Guidance for ${guests} guests:**\n\n${list}\n\n💡 **Essential Venue Checks:**\n- Verify floating vs seating capacity for ${guests} people\n- Inquire about generator backup and electrical load limits\n- Confirm whether outside catering and decorators are permitted without penalty royalty fees`,
    suggestions: ['What should I do first?', 'Decoration ideas', 'Food planning tips'],
  };
}

function urgentResponse(event, tasks) {
  if (!event) return fallbackResponse();
  const days = daysUntil(event.date);
  const pending = (tasks || []).filter(t => !t.completed);

  if (days === null || days < 0) {
    return {
      message: `📅 This event date has passed. You can duplicate this event in **My Events** to reuse its task list and budget structure for your next celebration.`,
      suggestions: ['Plan New Event', 'View My Events'],
    };
  }

  const overdue = pending.filter(t => t.deadline && daysUntil(t.deadline) < 0);
  const critical = pending.filter(t => t.deadline && daysUntil(t.deadline) >= 0 && daysUntil(t.deadline) <= 3);

  let statusHeader = `📋 **Urgent Action Items (${days} days to ${event.name}):**`;
  if (overdue.length > 0) {
    statusHeader = `⚠️ **Attention Required:** You have **${overdue.length} overdue task${overdue.length !== 1 ? 's' : ''}** needing immediate resolution.`;
  }

  const topItems = pending
    .sort((a, b) => {
      const da = daysUntil(a.deadline) ?? 999;
      const db = daysUntil(b.deadline) ?? 999;
      return da - db;
    })
    .slice(0, 4)
    .map(t => `- **${t.title}** (Due: ${t.deadline ? daysUntilLabel(daysUntil(t.deadline)) : 'No deadline'})`);

  return {
    message: `${statusHeader}\n\n${topItems.join('\n') || 'All current milestones are completed! 🎉'}\n\n*${pending.length} total pending tasks remaining.*`,
    suggestions: ['What should I do first?', 'Where can I cut costs?', 'How should I split my budget?'],
  };
}

function vendorResponse(event) {
  return {
    message: `🏢 **Vendor Sourcing & Quotation Strategy:**\n\n- **Never accept verbal quotes**: Always request written itemized quotes with taxes (GST), overtime charges, and security deposits.\n- **Venue & Caterer**: Book first — they command 55–65% of your total budget.\n- **Photographer**: Review complete wedding galleries rather than curated highlight reels.\n- **Compare Inclusions**: In the **Vendor Manager**, use "Compare Quotes" to check price per guest and identify missing inclusions.\n\n💡 *Gatherly AI does not verify vendor availability or endorse businesses. All quotes are managed by you.*`,
    suggestions: ['Where can I cut costs?', 'How should I split my budget?', 'Food planning tips'],
  };
}

function ideasResponse(event) {
  if (!event) return fallbackResponse();
  const ideas = {
    wedding: [
      '🌸 Digital RSVP with QR code on save-the-date cards to eliminate manual headcount follow-ups',
      '📸 Live polaroid guestbook station where attendees stick instant photos with personal notes',
      '🎵 Collaborative Spotify reception playlist shared with attendees',
      '🌿 Seed-paper or potted succulent return favors that guests can grow at home',
    ],
    birthday: [
      '🎂 Customized photo-reveal cake or mini dessert towers',
      '📷 Disposable camera on each table for spontaneous retro photos',
      '🎮 Interactive trivia contest about the birthday person',
      '🎁 Themed snack bags with handwritten thank-you notes',
    ],
    community: [
      '🎤 Community open mic and cultural performance spotlight',
      '🏆 Local artisan raffle or quiz with proceeds donated to a neighborhood cause',
      '🤝 Dedicated volunteer appreciation photo wall',
    ],
  };
  const list = (ideas[event.occasion] || ideas.birthday).map(i => `- ${i}`).join('\n');
  return {
    message: `✨ **Creative Ideas for your ${OCCASION_LABEL[event.occasion] || 'event'}:**\n\n${list}\n\nExplore more curated themes in the **Inspiration** section.`,
    suggestions: ['Decoration ideas', 'Food planning tips', 'Where can I cut costs?'],
  };
}

function fallbackResponse() {
  return {
    message: `🤔 I specialize in deterministic event planning logic for your occasion, budget, timeline, and vendors. Here are topics I can help with:\n\n- **Budget & Trade-offs**: *"How should I split my budget?"* or *"Where can I cut costs?"*\n- **Timeline & Dependencies**: *"What tasks should I do first?"* or *"What is overdue?"*\n- **Headcount Impact**: *"What happens if guest count increases?"*\n- **Food & Decor**: *"Give me catering tips"* or *"Suggest decoration ideas"*\n\nTry selecting one of the suggested prompts below:`,
    suggestions: [
      'What should I do first?',
      'How should I split my budget?',
      'Where can I cut costs?',
      'Food planning tips',
    ],
  };
}

// ─── Main Dispatcher ─────────────────────────────────────────────────────────

export function getAssistantResponse(input, event = null, tasks = []) {
  const intent = detectIntent(input);
  switch (intent) {
    case 'plan':         return generatePlanResponse(event, tasks);
    case 'tradeoff':     return tradeOffResponse(event, tasks);
    case 'dependency':   return dependencyResponse(event, tasks);
    case 'guest_impact': return guestImpactResponse(event, tasks);
    case 'greeting':     return greetingResponse(event);
    case 'budget':       return budgetResponse(event, tasks);
    case 'decoration':   return decorationResponse(event);
    case 'food':         return foodResponse(event);
    case 'venue':        return venueResponse(event);
    case 'photo':        return tradeOffResponse(event, tasks);
    case 'urgent':
    case 'checklist':    return urgentResponse(event, tasks);
    case 'vendor':       return vendorResponse(event);
    case 'ideas':        return ideasResponse(event);
    default:             return fallbackResponse();
  }
}

export function getWelcomeMessage(event) {
  return greetingResponse(event);
}

export const SUGGESTED_PROMPTS = [
  'Generate My Plan',
  'What should I do first?',
  'How should I split my budget?',
  'Where can I cut costs?',
  'Food planning tips',
  'Give me decoration ideas',
  'What happens if guest count increases?',
  'Vendor booking tips',
];
