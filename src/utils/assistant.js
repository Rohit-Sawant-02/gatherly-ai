/**
 * Local rule-based planning assistant.
 * No external AI API is used. Responses are generated from deterministic
 * templates and event context. The feature is intentionally transparent
 * about how it works.
 */

import { formatINR, daysUntil, urgencyLevel, BUDGET_CATEGORIES } from './helpers.js';

// ─── Intent patterns ──────────────────────────────────────────────────────────

const INTENTS = [
  { key: 'plan',        patterns: ['generate plan', 'generate my plan', 'plan', 'roadmap', 'refresh suggestion', 'refresh', 'recalculate', 'summary', 'overview'] },
  { key: 'budget',      patterns: ['budget', 'cost', 'price', 'spend', 'money', 'afford', 'cheap', 'expensive', 'rupee', '₹'] },
  { key: 'decoration',  patterns: ['decor', 'decoration', 'theme', 'colour', 'color', 'flower', 'balloon', 'setup', 'look'] },
  { key: 'food',        patterns: ['food', 'catering', 'menu', 'eat', 'drink', 'cake', 'snack', 'meal', 'cuisine', 'buffet'] },
  { key: 'venue',       patterns: ['venue', 'location', 'place', 'hall', 'garden', 'outdoor', 'indoor', 'banquet'] },
  { key: 'guest',       patterns: ['guest', 'people', 'invite', 'attendance', 'headcount', 'crowd'] },
  { key: 'urgent',      patterns: ['urgent', 'asap', 'soon', 'quick', 'hurry', 'time', 'deadline', 'pending', 'left'] },
  { key: 'checklist',   patterns: ['task', 'checklist', 'todo', 'to-do', 'done', 'complete', 'pending', 'next step'] },
  { key: 'vendor',      patterns: ['vendor', 'supplier', 'book', 'hire', 'caterer', 'photographer', 'dj', 'florist'] },
  { key: 'ideas',       patterns: ['idea', 'suggest', 'recommend', 'inspiration', 'creative', 'unique', 'special'] },
  { key: 'greeting',    patterns: ['hello', 'hi', 'hey', 'help', 'start', 'what can you do', 'how are you'] },
];

function detectIntent(input) {
  const lower = input.toLowerCase();
  for (const intent of INTENTS) {
    if (intent.patterns.some(p => lower.includes(p))) return intent.key;
  }
  return 'general';
}

// ─── Response templates per occasion ─────────────────────────────────────────

const OCCASION_LABEL = { wedding: 'wedding', birthday: 'birthday celebration', community: 'community event' };

function greetingResponse(event) {
  if (!event) {
    return {
      message: `👋 Hi! I'm the **Gatherly Assistant** — your built-in event planning guide.\n\nI use local rules and event data to give you tailored suggestions. No internet connection or AI service is required.\n\nStart by creating an event, then ask me anything like:\n- *"What should I do first?"*\n- *"How should I split my budget?"*\n- *"Give me decoration ideas."*`,
      suggestions: ['What can you help with?', 'How do I create an event?', 'Give me some tips'],
    };
  }
  const days = daysUntil(event.date);
  const urgency = urgencyLevel(days);
  const label = OCCASION_LABEL[event.occasion] || event.occasion;
  const budgetLine = event.budget ? ` with a budget of ${formatINR(event.budget)}` : '';
  const guestLine = event.guestCount ? ` for ${event.guestCount} guests` : '';
  const dayLine = days === null ? '' : days === 0 ? ' \u2014 **Event Day!**' : days < 0 ? ` \u2014 it was ${Math.abs(days)} days ago` : ` \u2014 **${days} days to go**`;

  let urgencyMsg = '';
  if (urgency === 'critical') urgencyMsg = '\n\n⚠️ **Your event is very soon!** Let\'s focus on the most critical tasks.';
  else if (urgency === 'high') urgencyMsg = '\n\n📋 With less than 2 weeks remaining, let\'s prioritise your top tasks.';

  return {
    message: `👋 Hello! I'm helping you plan **${event.name}** — your ${label}${guestLine}${budgetLine}${dayLine}.${urgencyMsg}\n\nWhat would you like to know?`,
    suggestions: getBudgetSuggestions(event).concat(['Decoration ideas', 'Food planning tips', 'What should I do next?']).slice(0, 4),
  };
}

function getBudgetSuggestions(event) {
  const budget = Number(event.budget) || 0;
  const guests = Number(event.guestCount) || 0;
  const perPerson = guests > 0 ? Math.round(budget / guests) : 0;
  if (perPerson < 500) return ['Budget-saving tips'];
  if (perPerson < 2000) return ['Mid-range budget tips'];
  return ['Premium planning tips'];
}

function budgetResponse(event, tasks) {
  if (!event) return fallbackResponse();
  const budget = Number(event.budget) || 0;
  const guests = Number(event.guestCount) || 0;
  const perPerson = guests > 0 ? Math.round(budget / guests) : 0;
  const occasion = event.occasion || 'birthday';

  const alloc = {
    wedding: { venue: 30, catering: 30, decorations: 15, photography: 12, entertainment: 5, invitations: 3, misc: 5 },
    birthday: { venue: 20, catering: 35, decorations: 20, photography: 10, entertainment: 8, invitations: 2, misc: 5 },
    community: { venue: 25, catering: 30, decorations: 15, photography: 8, entertainment: 12, invitations: 5, misc: 5 },
  }[occasion] || {};

  const lines = Object.entries(alloc).map(([cat, pct]) => {
    const amt = Math.round((pct / 100) * budget);
    return `- **${cat.charAt(0).toUpperCase() + cat.slice(1)}**: ${formatINR(amt)} (${pct}%)`;
  });

  let perPersonNote = '';
  if (guests > 0) perPersonNote = `\n\nWith ${guests} guests, that's approximately **${formatINR(perPerson)} per person**.`;

  let tier = '';
  if (perPerson < 500) tier = '\n\n💡 **Tip:** At this budget, focus on DIY decorations, potluck-style food, and free venue options like a home or park.';
  else if (perPerson < 1500) tier = '\n\n💡 **Tip:** A good mid-range approach — prioritise venue and food, and keep photography simple.';
  else tier = '\n\n💡 **Tip:** With a premium budget, you can consider a full-service venue package that bundles catering and decor.';

  return {
    message: `💰 **Suggested budget split for your ${OCCASION_LABEL[occasion] || 'event'} (${formatINR(budget)} total):**\n\n${lines.join('\n')}${perPersonNote}${tier}\n\n*These are illustrative estimates based on typical event ratios — not market quotes. Edit amounts in the Budget Planner.*`,
    suggestions: ['Decoration ideas', 'Food tips', 'How many tasks are left?'],
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
  const urgentTasks = pending.filter(t => t.priority === 'high').slice(0, 3);
  const total = tasks?.length || 0;
  const done = total - pending.length;
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

  const alloc = event.budget_allocations || [];
  const topCategories = [...alloc].sort((a, b) => (b.allocated || 0) - (a.allocated || 0)).slice(0, 3);
  const catLines = topCategories.map(c => `- **${c.label}**: ${formatINR(c.allocated)}`).join('\n');

  const themeNote = event.theme ? `\n- **Theme Style**: ${event.theme}` : '';
  const foodNote = event.foodPreferences ? `\n- **Food Style**: ${event.foodPreferences}` : '';

  const nextStepLines = urgentTasks.length > 0
    ? urgentTasks.map(t => `- 🔴 ${t.title}`).join('\n')
    : '- All high-priority items currently in progress!';

  return {
    message: `📋 **Tailored Plan Overview for ${event.name}:**\n\n- **Occasion**: ${OCCASION_LABEL[event.occasion] || event.occasion}\n- **Timeline**: ${days !== null ? (days >= 0 ? `${days} days remaining` : `${Math.abs(days)} days ago`) : 'Date unset'}\n- **Checklist**: ${done}/${total} tasks finished (${progressPct}% complete)\n- **Planned Budget**: ${formatINR(event.budget)}${themeNote}${foodNote}\n\n**Top Budget Allocations:**\n${catLines || '- No allocations recorded yet.'}\n\n**Urgent Focus Items:**\n${nextStepLines}\n\n💡 *Generated via local deterministic rules based on your latest event details.*`,
    suggestions: ['How should I split my budget?', 'Give me decoration ideas', 'Food planning tips', 'Vendor booking tips'],
  };
}

function decorationResponse(event) {
  if (!event) return fallbackResponse();
  const themeIntro = event.theme ? `✨ **Selected Theme:** *${event.theme}*\n\n` : '';
  const themes = {
    wedding: [
      'Classic white and gold with floral centrepieces',
      'Rustic bohemian with dried flowers and fairy lights',
      'Modern minimalist with geometric arch and white drapes',
      'Garden romantic with rose garlands and candle lanterns',
    ],
    birthday: [
      'Pastel balloon arch with a custom "Happy Birthday" banner',
      'Jungle / safari theme with tropical leaves and animals',
      'Retro 90s theme with cassette tape props and neon signs',
      'Elegant gold and black theme with candle centrepieces',
      'DIY photo booth corner with printed props',
    ],
    community: [
      'Cultural motifs with rangoli, marigold strings, and fabric bunting',
      'Festive banner wall with event logo and sponsor boards',
      'Eco-friendly upcycled decoration using cloth and natural elements',
      'Modern branding with printed standees and colour-coordinated stage',
    ],
  };
  const list = (themes[event.occasion] || themes.birthday).map(t => `- ${t}`).join('\n');
  return {
    message: `${themeIntro}🎨 **Decoration ideas for your ${OCCASION_LABEL[event.occasion] || 'event'}:**\n\n${list}\n\n💡 **Budget note:** If your budget is tight, focus on a single wow-factor element (like a balloon arch or floral wall) rather than decorating everything.`,
    suggestions: ['Food ideas', 'Budget tips', 'Venue suggestions'],
  };
}

function foodResponse(event) {
  if (!event) return fallbackResponse();
  const foodIntro = event.foodPreferences ? `🥗 **Dietary Preference:** *${event.foodPreferences}*\n\n` : '';
  const budget = Number(event.budget) || 0;
  const guests = Number(event.guestCount) || 50;
  const foodBudget = { wedding: 0.30, birthday: 0.35, community: 0.30 }[event.occasion] || 0.35;
  const perPersonFood = Math.round((budget * foodBudget) / guests);

  const menus = {
    wedding: `- Full sit-down meal with starters, mains, desserts\n- Live chaat / street-food counter as a crowd favourite\n- Welcome drinks station (mocktails or traditional sherbets)\n- Wedding cake or mithai tower as centrepiece`,
    birthday: `- Theme-based birthday cake (essential!)\n- Finger foods and snacks for easy mingling\n- Pizza / pasta buffet for younger guests\n- DIY taco / chaat bar for interactive fun`,
    community: `- Food stalls from local vendors for variety\n- Packaged snack boxes for easy distribution\n- Non-alcoholic beverage station\n- Dessert corner with kulfi or ice cream`,
  };

  return {
    message: `${foodIntro}🍽️ **Food planning for ${guests} guests:**\n\nEstimated catering budget: **${formatINR(Math.round(budget * foodBudget))}** (~${formatINR(perPersonFood)}/person)\n\n**Menu ideas:**\n${menus[event.occasion] || menus.birthday}\n\n💡 **Tip:** Book your caterer at least 3–4 weeks in advance. Always confirm final headcount 5–7 days before the event.`,
    suggestions: ['Decoration ideas', 'Vendor tips', 'Budget breakdown'],
  };
}

function venueResponse(event) {
  if (!event) return fallbackResponse();
  const venues = {
    wedding: ['Banquet hall with in-house catering', 'Garden or farmhouse venue', 'Hotel ballroom', 'Heritage or palace venue for premium budgets'],
    birthday: ['Home backyard or terrace', 'Community hall or clubhouse', 'Restaurant private dining', 'Outdoor park with a permit'],
    community: ['Public park or maidan', 'School or college grounds', 'Community centre hall', 'Rooftop venue for smaller gatherings'],
  };
  const list = (venues[event.occasion] || venues.birthday).map(v => `- ${v}`).join('\n');
  return {
    message: `📍 **Venue suggestions for your ${OCCASION_LABEL[event.occasion] || 'event'}:**\n\n${list}\n\n💡 **Key venue checklist:**\n- Confirm capacity for ${event.guestCount || '?'} guests\n- Check parking and accessibility\n- Ask about included furniture, AV, and kitchen access\n- Get the booking confirmation in writing`,
    suggestions: ['Decoration ideas', 'Food planning tips', 'Vendor tips'],
  };
}

function urgentResponse(event, tasks) {
  if (!event) return fallbackResponse();
  const days = daysUntil(event.date);
  const pending = (tasks || []).filter(t => !t.completed);
  const pendingCount = pending.length;

  if (days === null || days < 0) {
    return {
      message: `📅 This event has already passed. You can review what went well or duplicate the event for next time!`,
      suggestions: ['Duplicate event', 'Clear completed tasks'],
    };
  }

  let urgencyText = '';
  if (days === 0) urgencyText = "🚨 **It's event day!** Here's your final checklist:";
  else if (days <= 3) urgencyText = `🚨 **Only ${days} day${days !== 1 ? 's' : ''} to go!** Focus on these urgent items:`;
  else if (days <= 7) urgencyText = `⚠️ **${days} days remaining.** Here are your top priorities:`;
  else urgencyText = `📋 **${days} days to your event.** Here's what to tackle next:`;

  const topTasks = pending
    .sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 };
      return (p[a.priority] ?? 2) - (p[b.priority] ?? 2);
    })
    .slice(0, 5)
    .map(t => `- ${t.title}`)
    .join('\n');

  return {
    message: `${urgencyText}\n\n${topTasks || 'All tasks are complete — great job! 🎉'}\n\n*${pendingCount} task${pendingCount !== 1 ? 's' : ''} remaining.*`,
    suggestions: ['Budget breakdown', 'Vendor tips', 'Decoration ideas'],
  };
}

function vendorResponse(event) {
  return {
    message: `🏢 **Vendor planning tips:**\n\n- **Caterer:** Book 3–4 weeks ahead. Ask for a tasting session.\n- **Photographer:** Book 4–6 weeks ahead; always review portfolios.\n- **Decorator:** Book 2–3 weeks ahead with a confirmed theme.\n- **DJ / Entertainment:** Book at least 2 weeks ahead.\n- **Venue:** Confirm 4–8 weeks ahead with a signed agreement.\n\n💡 **Compare at least 2–3 quotes** for each category and track them in the Vendor Manager.`,
    suggestions: ['Food planning tips', 'Budget tips', 'Decoration ideas'],
  };
}

function ideasResponse(event) {
  if (!event) return fallbackResponse();
  const ideas = {
    wedding: [
      '🌸 Digital RSVP and event website for your guests',
      '📸 Polaroid photo wall as a guestbook alternative',
      '🎵 Curate a collaborative Spotify playlist guests can add to',
      '🌿 Eco-friendly decor: potted plants guests take home',
    ],
    birthday: [
      '🎂 Personalised dessert station with mini cakes',
      '📷 Themed photo booth with custom props',
      '🎮 Interactive games: trivia, karaoke, or dance-off',
      '🎁 DIY favour bags with local sweets or snacks',
    ],
    community: [
      '🎤 Open mic or talent showcase slot',
      '🏆 Community quiz or raffle with local prizes',
      '🤝 Volunteer recognition wall or board',
      '📱 Event hashtag for social sharing',
    ],
  };
  const list = (ideas[event.occasion] || ideas.birthday).map(i => `- ${i}`).join('\n');
  return {
    message: `✨ **Unique ideas for your ${OCCASION_LABEL[event.occasion] || 'event'}:**\n\n${list}\n\nCheck the **Inspiration & Ideas** section for a full curated collection tailored to your event!`,
    suggestions: ['Decoration ideas', 'Food planning tips', 'Budget tips'],
  };
}

function checklistResponse(event, tasks) {
  if (!event || !tasks) return fallbackResponse();
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  const pending = total - done;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const nextTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 };
      return (p[a.priority] ?? 2) - (p[b.priority] ?? 2);
    })
    .slice(0, 3)
    .map(t => `- **${t.priority.toUpperCase()}**: ${t.title}`)
    .join('\n');

  return {
    message: `✅ **Checklist status for ${event.name}:**\n\n📊 **${done} / ${total} tasks complete** (${pct}%)\n\n**Next up:**\n${nextTasks || 'All done!'}\n\nOpen the **Timeline & Checklist** tab to manage and mark tasks.`,
    suggestions: ['Budget tips', 'Vendor tips', 'Decoration ideas'],
  };
}

function fallbackResponse() {
  return {
    message: `🤔 I didn't quite catch that. Here's what I can help with:\n\n- **Budget** — how to split your budget\n- **Decorations** — theme and decor ideas\n- **Food** — menu and catering tips\n- **Venue** — venue suggestions\n- **Urgent tasks** — what to do next\n- **Vendors** — booking tips\n- **Ideas** — unique touches for your event\n\nTry asking something like *"Give me decoration ideas"* or *"How should I plan my budget?"*`,
    suggestions: ['Budget tips', 'Decoration ideas', 'Food planning tips', 'What should I do next?'],
  };
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export function getAssistantResponse(input, event = null, tasks = []) {
  const intent = detectIntent(input);
  switch (intent) {
    case 'plan':       return generatePlanResponse(event, tasks);
    case 'greeting':   return greetingResponse(event);
    case 'budget':     return budgetResponse(event, tasks);
    case 'decoration': return decorationResponse(event);
    case 'food':       return foodResponse(event);
    case 'venue':      return venueResponse(event);
    case 'urgent':
    case 'checklist':  return urgentResponse(event, tasks);
    case 'vendor':     return vendorResponse(event);
    case 'ideas':      return ideasResponse(event);
    default:           return fallbackResponse();
  }
}

export function getWelcomeMessage(event) {
  return greetingResponse(event);
}

export const SUGGESTED_PROMPTS = [
  'Generate My Plan',
  'How should I split my budget?',
  'Give me decoration ideas',
  'Food planning tips',
  'What should I do next?',
  'Vendor booking tips',
  'Unique event ideas',
  'How is my checklist progress?',
];
