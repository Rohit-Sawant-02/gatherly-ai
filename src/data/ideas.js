/**
 * Curated inspiration dataset for weddings, birthdays, and community events.
 * Ideas adapt based on occasion, budget tier, and preferences.
 */

export const IDEAS = [
  // ── WEDDING ──────────────────────────────────────────────────────────────
  {
    id: 'w1', occasion: ['wedding'],
    category: 'themes',
    title: 'Classic Ivory & Gold',
    description: 'Timeless elegance with ivory florals, gold candle holders, and draped fabric. Perfect for formal banquet venues.',
    tags: ['elegant', 'formal', 'classic'],
    budgetTier: ['medium', 'premium'],
  },
  {
    id: 'w2', occasion: ['wedding'],
    category: 'themes',
    title: 'Rustic Boho Garden',
    description: 'Macramé backdrops, dried flower centrepieces, fairy lights, and earthy terracotta tones in an outdoor setting.',
    tags: ['rustic', 'outdoor', 'boho'],
    budgetTier: ['budget', 'medium'],
  },
  {
    id: 'w3', occasion: ['wedding'],
    category: 'decorations',
    title: 'Floral Arch Statement Piece',
    description: 'A single dramatic floral arch as the focal point saves budget while maximising visual impact for photos.',
    tags: ['flowers', 'photography', 'focal point'],
    budgetTier: ['budget', 'medium', 'premium'],
  },
  {
    id: 'w4', occasion: ['wedding'],
    category: 'food',
    title: 'Live Chaat Counter',
    description: 'A live street-food station serving pani puri, bhel, and dahi papdi — a beloved crowd favourite at Indian weddings.',
    tags: ['street food', 'interactive', 'crowd pleaser'],
    budgetTier: ['budget', 'medium'],
  },
  {
    id: 'w5', occasion: ['wedding'],
    category: 'food',
    title: 'Dessert Grazing Table',
    description: 'An abundant spread of mithai, macarons, cake slices, and chocolates styled as a beautiful grazing table.',
    tags: ['dessert', 'styling', 'sweet'],
    budgetTier: ['medium', 'premium'],
  },
  {
    id: 'w6', occasion: ['wedding'],
    category: 'entertainment',
    title: 'Curated Photo Booth',
    description: 'Set up a themed photo booth with a digital or Polaroid camera. Guests keep their prints as souvenirs.',
    tags: ['photos', 'souvenirs', 'fun'],
    budgetTier: ['budget', 'medium'],
  },
  {
    id: 'w7', occasion: ['wedding'],
    category: 'invitations',
    title: 'Digital Invite with Event Page',
    description: 'Create a beautiful digital invitation with an RSVP link and event details page — saves on printing costs.',
    tags: ['digital', 'eco-friendly', 'budget-saving'],
    budgetTier: ['budget', 'medium', 'premium'],
  },
  {
    id: 'w8', occasion: ['wedding'],
    category: 'budget',
    title: 'Combine Venue + Catering Package',
    description: 'Many banquet halls offer bundled venue + catering packages at 15–20% less than booking separately.',
    tags: ['cost saving', 'venue', 'catering'],
    budgetTier: ['budget', 'medium'],
  },

  // ── BIRTHDAY ─────────────────────────────────────────────────────────────
  {
    id: 'b1', occasion: ['birthday'],
    category: 'themes',
    title: 'Pastel Cloud Theme',
    description: 'Fluffy white and pastel balloon clouds, rainbow streamers, and candy-coloured table settings.',
    tags: ['kids', 'colourful', 'whimsical'],
    budgetTier: ['budget', 'medium'],
  },
  {
    id: 'b2', occasion: ['birthday'],
    category: 'themes',
    title: 'Elegant Black & Gold',
    description: 'Sophisticated black and gold theme with metallic balloons, gold candle holders, and floral accents — great for milestone birthdays.',
    tags: ['adult', 'elegant', 'milestone'],
    budgetTier: ['medium', 'premium'],
  },
  {
    id: 'b3', occasion: ['birthday'],
    category: 'decorations',
    title: 'Balloon Garland Arch',
    description: 'A DIY balloon garland is one of the most cost-effective ways to create a wow-factor backdrop for photos.',
    tags: ['DIY', 'photos', 'colourful'],
    budgetTier: ['budget', 'medium'],
  },
  {
    id: 'b4', occasion: ['birthday'],
    category: 'food',
    title: 'Custom Character Cake',
    description: 'Order a themed cake featuring the birthday person\'s favourite character, hobby, or milestone. The centrepiece everyone remembers.',
    tags: ['cake', 'centrepiece', 'personalised'],
    budgetTier: ['budget', 'medium', 'premium'],
  },
  {
    id: 'b5', occasion: ['birthday'],
    category: 'food',
    title: 'DIY Taco / Chaat Bar',
    description: 'An interactive food station where guests assemble their own tacos or chaat — fun, social, and budget-friendly.',
    tags: ['interactive', 'street food', 'budget-saving'],
    budgetTier: ['budget', 'medium'],
  },
  {
    id: 'b6', occasion: ['birthday'],
    category: 'entertainment',
    title: 'Karaoke Corner',
    description: 'Set up a karaoke station — just a laptop and microphone works! One of the highest-energy activities for all ages.',
    tags: ['music', 'singing', 'fun'],
    budgetTier: ['budget', 'medium'],
  },
  {
    id: 'b7', occasion: ['birthday'],
    category: 'entertainment',
    title: 'Personalised Trivia Night',
    description: 'Create a quiz about the birthday person\'s life, favourite things, and milestones. Free to organise, priceless as a memory.',
    tags: ['quiz', 'personalised', 'free'],
    budgetTier: ['budget', 'medium', 'premium'],
  },
  {
    id: 'b8', occasion: ['birthday'],
    category: 'invitations',
    title: 'WhatsApp Digital Invite',
    description: 'Design a beautiful digital card (Canva is free) and share via WhatsApp for instant, cost-free invites.',
    tags: ['digital', 'free', 'fast'],
    budgetTier: ['budget', 'medium', 'premium'],
  },
  {
    id: 'b9', occasion: ['birthday'],
    category: 'budget',
    title: 'Host at Home or Park',
    description: 'Home and public park events eliminate venue costs entirely — often saving ₹5,000–₹20,000.',
    tags: ['venue', 'cost saving', 'DIY'],
    budgetTier: ['budget'],
  },

  // ── COMMUNITY ─────────────────────────────────────────────────────────────
  {
    id: 'c1', occasion: ['community'],
    category: 'themes',
    title: 'Cultural Heritage Celebration',
    description: 'Celebrate local traditions with rangoli, folk music, traditional attire, and artisanal food stalls.',
    tags: ['cultural', 'traditional', 'local'],
    budgetTier: ['budget', 'medium', 'premium'],
  },
  {
    id: 'c2', occasion: ['community'],
    category: 'themes',
    title: 'Green & Sustainability Fair',
    description: 'Eco-conscious event with plant stalls, upcycling workshops, and zero-waste catering.',
    tags: ['eco', 'sustainable', 'educational'],
    budgetTier: ['budget', 'medium'],
  },
  {
    id: 'c3', occasion: ['community'],
    category: 'decorations',
    title: 'Community Art Installation',
    description: 'Invite local artists or schoolchildren to contribute to a collaborative art piece displayed at the event.',
    tags: ['art', 'community', 'engagement'],
    budgetTier: ['budget', 'medium'],
  },
  {
    id: 'c4', occasion: ['community'],
    category: 'food',
    title: 'Local Vendor Food Court',
    description: 'Partner with local food vendors to run stalls. This reduces catering cost and supports the community economy.',
    tags: ['local', 'support', 'variety'],
    budgetTier: ['budget', 'medium'],
  },
  {
    id: 'c5', occasion: ['community'],
    category: 'entertainment',
    title: 'Open Mic / Talent Showcase',
    description: 'Invite community members to perform — music, dance, poetry. Highly engaging and costs almost nothing.',
    tags: ['talent', 'community', 'free'],
    budgetTier: ['budget', 'medium', 'premium'],
  },
  {
    id: 'c6', occasion: ['community'],
    category: 'entertainment',
    title: 'Community Raffle or Quiz',
    description: 'Organise a raffle with locally donated prizes or a quiz about the neighbourhood — builds engagement and can raise funds.',
    tags: ['quiz', 'raffle', 'fundraising'],
    budgetTier: ['budget', 'medium'],
  },
  {
    id: 'c7', occasion: ['community'],
    category: 'invitations',
    title: 'Poster + Social Media Campaign',
    description: 'Design posters for noticeboards and a digital version for WhatsApp groups and social media — reaches the whole community.',
    tags: ['social media', 'posters', 'outreach'],
    budgetTier: ['budget', 'medium', 'premium'],
  },
  {
    id: 'c8', occasion: ['community'],
    category: 'budget',
    title: 'Seek Local Sponsorships',
    description: 'Approach local businesses for small sponsorships in exchange for logo placement. Even ₹2,000 contributions add up.',
    tags: ['sponsorship', 'cost saving', 'community'],
    budgetTier: ['budget', 'medium'],
  },
];

export const IDEA_CATEGORIES = [
  { id: 'themes', label: 'Themes & Palettes' },
  { id: 'decorations', label: 'Decorations' },
  { id: 'food', label: 'Food & Refreshments' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'invitations', label: 'Invitations' },
  { id: 'budget', label: 'Budget-Saving Tips' },
];

export function getBudgetTier(budget, guests) {
  const pp = guests > 0 ? budget / guests : budget;
  if (pp < 500) return 'budget';
  if (pp < 2000) return 'medium';
  return 'premium';
}

export function filterIdeas({ occasion, category, budget, guestCount }) {
  const tier = getBudgetTier(Number(budget) || 0, Number(guestCount) || 1);
  return IDEAS.filter(idea => {
    if (occasion && !idea.occasion.includes(occasion)) return false;
    if (category && category !== 'all' && idea.category !== category) return false;
    if (!idea.budgetTier.includes(tier) && !idea.budgetTier.includes('budget')) return false;
    return true;
  });
}
