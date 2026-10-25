import React, { useState, useEffect } from 'react';
import { Heart, HeartOff, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Button, Card, Badge, EmptyState, SectionHeader, Tag } from './ui/index.jsx';
import { IDEAS, IDEA_CATEGORIES, filterIdeas } from '../data/ideas.js';

const OCCASION_OPTIONS = [
  { value: 'wedding', label: '💍 Wedding' },
  { value: 'birthday', label: '🎂 Birthday' },
  { value: 'community', label: '🌿 Community' },
];

const CAT_ICONS = {
  themes: '🎨',
  decorations: '✨',
  food: '🍽',
  entertainment: '🎵',
  invitations: '💌',
  budget: '💡',
};

function IdeaCard({ idea, isSaved, onToggle }) {
  return (
    <Card className="group hover:border-sage-300 transition-all duration-150 flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg" aria-hidden="true">{CAT_ICONS[idea.category] || '📌'}</span>
            <Badge variant="default" className="text-xs">
              {IDEA_CATEGORIES.find(c => c.id === idea.category)?.label || idea.category}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold text-charcoal-900">{idea.title}</h3>
        </div>
        <button
          onClick={onToggle}
          aria-label={isSaved ? `Unsave "${idea.title}"` : `Save "${idea.title}"`}
          aria-pressed={isSaved}
          className={`flex-shrink-0 p-2 rounded-lg transition-all duration-150
            ${isSaved ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-charcoal-300 hover:text-red-400 hover:bg-red-50'}
          `}
        >
          {isSaved ? <Heart size={16} fill="currentColor" aria-hidden="true" /> : <Heart size={16} aria-hidden="true" />}
        </button>
      </div>
      <p className="text-sm text-charcoal-600 leading-relaxed flex-1">{idea.description}</p>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {idea.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
      </div>
    </Card>
  );
}

export default function Inspiration() {
  const { state, dispatch, navigate, activeEvent } = useApp();

  const event = activeEvent;
  const defaultOccasion = event?.occasion || 'birthday';

  const [occasion, setOccasion] = useState(defaultOccasion);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    if (event?.occasion) {
      setOccasion(event.occasion);
    }
  }, [event?.occasion, event?.id]);

  const ideas = filterIdeas({
    occasion,
    category,
    budget: event?.budget || 50000,
    guestCount: event?.guestCount || 50,
  });

  const isSaved = (id) => state.savedIdeas.includes(`${id}:${event?.id || 'global'}`);

  const handleToggle = (idea) => {
    dispatch({
      type: 'TOGGLE_IDEA',
      payload: { ideaId: idea.id, eventId: event?.id || 'global' },
    });
  };

  const savedCount = state.savedIdeas.filter(k => k.endsWith(`:${event?.id || 'global'}`)).length;

  return (
    <div>
      <SectionHeader
        title="Inspiration & Ideas"
        description={event ? `Tailored for ${event.name}` : 'Browse curated ideas for your event'}
        actions={
          state.events.length > 1 ? (
            <select
              value={event?.id || ''}
              onChange={(e) => dispatch({ type: 'SET_ACTIVE_EVENT', payload: e.target.value })}
              className="text-xs border border-ivory-300 rounded-lg px-2.5 py-1.5 bg-white text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-sage-400"
              aria-label="Switch active event for inspiration"
            >
              {state.events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          ) : null
        }
      />

      {!event && (
        <div className="p-3 bg-gold-50 border border-gold-200 rounded-xl text-sm text-gold-800 mb-6 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span aria-hidden="true">💡</span>
            <span>Select or create an event to see budget-tailored ideas. Showing general suggestions.</span>
          </div>
          {state.events.length === 0 && (
            <Button size="sm" variant="secondary" onClick={() => navigate('plan')}>
              Create Event
            </Button>
          )}
        </div>
      )}

      {/* Occasion tabs */}
      <div className="flex gap-2 mb-4 flex-wrap" role="tablist" aria-label="Select occasion">
        {OCCASION_OPTIONS.map(opt => (
          <button
            key={opt.value}
            role="tab"
            aria-selected={occasion === opt.value}
            onClick={() => setOccasion(opt.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border
              ${occasion === opt.value
                ? 'bg-sage-500 text-white border-sage-500'
                : 'bg-white text-charcoal-600 border-ivory-300 hover:border-sage-300'}
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 flex-wrap" role="group" aria-label="Filter by category">
        <button
          onClick={() => setCategory('all')}
          aria-pressed={category === 'all'}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
            ${category === 'all' ? 'bg-charcoal-800 text-white border-charcoal-800' : 'bg-white text-charcoal-600 border-ivory-300 hover:border-charcoal-400'}`}
        >
          All
        </button>
        {IDEA_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            aria-pressed={category === cat.id}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
              ${category === cat.id ? 'bg-charcoal-800 text-white border-charcoal-800' : 'bg-white text-charcoal-600 border-ivory-300 hover:border-charcoal-400'}`}
          >
            {CAT_ICONS[cat.id]} {cat.label}
          </button>
        ))}
      </div>

      {savedCount > 0 && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-center gap-2">
          <Heart size={12} fill="currentColor" aria-hidden="true" />
          {savedCount} idea{savedCount !== 1 ? 's' : ''} saved for this event
        </div>
      )}

      {ideas.length === 0 ? (
        <Card>
          <EmptyState
            icon="🔍"
            title="No ideas match this selection"
            description="Try a different occasion or category filter."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {ideas.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              isSaved={isSaved(idea.id)}
              onToggle={() => handleToggle(idea)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
