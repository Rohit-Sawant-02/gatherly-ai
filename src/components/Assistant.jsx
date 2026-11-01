import React, { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, Bot, Info, X, Sparkles, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getWelcomeMessage, SUGGESTED_PROMPTS } from '../utils/assistant.js';
import { askGatherlyAI } from '../utils/aiClient.js';

function renderFormattedText(text) {
  const parts = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

function parseMarkdown(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2" />;
    if (trimmed.startsWith('### ')) {
      return (
        <h4 key={i} className="font-bold text-charcoal-900 text-xs uppercase tracking-wider mt-2 mb-1">
          {renderFormattedText(trimmed.slice(4))}
        </h4>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h3 key={i} className="font-bold text-charcoal-900 text-sm mt-2 mb-1">
          {renderFormattedText(trimmed.slice(3))}
        </h3>
      );
    }
    if (trimmed.startsWith('# ')) {
      return (
        <h2 key={i} className="font-bold text-charcoal-900 text-base mt-2 mb-1">
          {renderFormattedText(trimmed.slice(2))}
        </h2>
      );
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <li key={i} className="ml-4 list-disc text-xs sm:text-sm text-charcoal-700 my-0.5">
          {renderFormattedText(trimmed.slice(2))}
        </li>
      );
    }
    return <p key={i} className="text-xs sm:text-sm text-charcoal-800">{renderFormattedText(line)}</p>;
  });
}

function AssistantMessage({ message, source, model, notice }) {
  return (
    <div className="flex gap-2.5 items-start">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-sage-100 flex items-center justify-center mt-0.5 border border-sage-200">
        <Bot size={14} className="text-sage-600" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-ivory-50 border border-ivory-200 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-charcoal-800 leading-relaxed space-y-1 shadow-2xs">
          {parseMarkdown(message)}
        </div>
        <div className="flex items-center gap-2 mt-1 px-1">
          {source === 'gemini' ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-sage-700 bg-sage-50 px-2 py-0.5 rounded-full border border-sage-200 font-medium">
              <Sparkles size={10} className="text-sage-600" aria-hidden="true" />
              <span>{model || 'Gemini 3.8 Flash'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] text-charcoal-500 bg-ivory-100 px-2 py-0.5 rounded-full border border-ivory-200">
              <span>{model || 'Smart Planner'}</span>
            </span>
          )}
          {notice && (
            <span className="text-[10px] text-amber-700 flex items-center gap-1">
              <AlertCircle size={10} aria-hidden="true" />
              <span className="truncate max-w-[200px]" title={notice}>{notice}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function UserMessage({ message }) {
  return (
    <div className="flex justify-end">
      <div className="bg-sage-500 text-white rounded-2xl rounded-tr-none px-4 py-2.5 text-sm max-w-xs shadow-2xs">
        {message}
      </div>
    </div>
  );
}

export default function Assistant({ onClose }) {
  const { activeEvent, state } = useApp();
  const [messages, setMessages] = useState(() => {
    const welcome = getWelcomeMessage(activeEvent);
    return [{
      type: 'assistant',
      text: welcome.message,
      suggestions: welcome.suggestions,
      source: 'gemini',
      model: 'Gatherly AI',
    }];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Close on Escape key for accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Reset conversation when active event changes
  useEffect(() => {
    const welcome = getWelcomeMessage(activeEvent);
    setMessages([{
      type: 'assistant',
      text: welcome.message,
      suggestions: welcome.suggestions,
      source: 'gemini',
      model: 'Gatherly AI',
    }]);
  }, [activeEvent?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    const query = String(text || '').trim();
    if (!query) return;

    const userMsg = { type: 'user', text: query };
    const historySnapshot = messages.slice(-6);

    setMessages(m => [...m, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const tasks = activeEvent?.tasks || [];
      const vendors = state.vendors || [];
      const aiResponse = await askGatherlyAI(query, activeEvent, tasks, vendors, historySnapshot);

      setMessages(m => [
        ...m,
        {
          type: 'assistant',
          text: aiResponse.text,
          suggestions: aiResponse.suggestions || [],
          source: aiResponse.source,
          model: aiResponse.model,
          notice: aiResponse.notice,
        },
      ]);
    } catch {
      setMessages(m => [
        ...m,
        {
          type: 'assistant',
          text: 'I ran into a temporary issue. Please ask again or check your network connection.',
          suggestions: ['How should I allocate my budget?', 'What should I do first?'],
          source: 'local',
          model: 'Smart Planner',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleReset = () => {
    const welcome = getWelcomeMessage(activeEvent);
    setMessages([{
      type: 'assistant',
      text: welcome.message,
      suggestions: welcome.suggestions,
      source: 'gemini',
      model: 'Gatherly AI',
    }]);
    setInput('');
    inputRef.current?.focus();
  };

  const lastSuggestions = messages.filter(m => m.type === 'assistant' && m.suggestions).slice(-1)[0]?.suggestions || SUGGESTED_PROMPTS.slice(0, 4);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ivory-200 bg-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sage-500 text-white flex items-center justify-center shadow-2xs">
            <Bot size={16} aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-charcoal-900">Gatherly AI Assistant</h2>
              <span className="text-[10px] bg-sage-100 text-sage-800 font-semibold px-1.5 py-0.2 rounded border border-sage-200">
                Gemini
              </span>
            </div>
            <p className="text-[10px] text-charcoal-500">
              Context-Aware Event Intelligence · Estimates only
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => sendMessage('Generate My Plan')}
            className="text-xs px-2.5 py-1 rounded-lg bg-sage-50 text-sage-700 hover:bg-sage-100 font-medium border border-sage-200 transition-colors flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-sage-500 cursor-pointer"
            title="Generate structured plan based on active event"
          >
            <Sparkles size={12} className="text-gold-500" aria-hidden="true" />
            <span className="hidden sm:inline">Generate</span> Plan
          </button>
          <button
            type="button"
            onClick={handleReset}
            aria-label="Refresh suggestions and clear conversation"
            title="Refresh suggestions & reset conversation"
            className="p-1.5 rounded-lg text-charcoal-500 hover:text-charcoal-800 hover:bg-ivory-100 transition-colors focus-visible:ring-2 focus-visible:ring-sage-500 cursor-pointer"
          >
            <RefreshCw size={14} aria-hidden="true" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close planning assistant"
              title="Close assistant"
              className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-ivory-100 transition-colors focus-visible:ring-2 focus-visible:ring-sage-500 cursor-pointer"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Context info banner */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-1.5 bg-ivory-100/90 border-b border-ivory-200 text-[11px] text-charcoal-600">
        <div className="flex items-center gap-1.5 truncate">
          <Info size={12} className="flex-shrink-0 text-sage-600" aria-hidden="true" />
          <span className="truncate">
            {activeEvent
              ? `Grounding in: "${activeEvent.name}" (₹${Number(activeEvent.budget || 0).toLocaleString('en-IN')})`
              : 'Select an event in the sidebar to enable full context grounding'}
          </span>
        </div>
        <span className="text-[10px] text-charcoal-400 flex-shrink-0">Secure API</span>
      </div>

      {/* Messages Scroll Area */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Conversation with planning assistant"
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg, i) =>
          msg.type === 'user' ? (
            <UserMessage key={i} message={msg.text} />
          ) : (
            <AssistantMessage
              key={i}
              message={msg.text}
              source={msg.source}
              model={msg.model}
              notice={msg.notice}
            />
          )
        )}
        {isTyping && (
          <div className="flex gap-2.5 items-center">
            <div className="w-7 h-7 rounded-full bg-sage-100 flex items-center justify-center border border-sage-200">
              <Bot size={14} className="text-sage-600" aria-hidden="true" />
            </div>
            <div className="bg-ivory-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1" aria-label="Gemini assistant is thinking…">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-sage-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
            <span className="text-xs text-charcoal-400">Gemini thinking…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Contextual Suggestion Pills */}
      {lastSuggestions.length > 0 && (
        <div className="px-4 py-2 border-t border-ivory-100 flex gap-2 overflow-x-auto scrollbar-none bg-white">
          {lastSuggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => sendMessage(s)}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-ivory-100 text-charcoal-700 border border-ivory-200 hover:bg-sage-50 hover:border-sage-300 hover:text-sage-800 transition-all focus-visible:ring-2 focus-visible:ring-sage-500 cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3.5 border-t border-ivory-200 bg-white rounded-b-2xl">
        <div className="flex gap-2">
          <label htmlFor="assistant-input" className="sr-only">Ask the planning assistant</label>
          <input
            ref={inputRef}
            id="assistant-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={activeEvent ? `Ask about ${activeEvent.name} budget, trade-offs…` : 'Ask about budget, timelines, vendors…'}
            className="flex-1 rounded-xl border border-ivory-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-sage-400 bg-ivory-50 text-charcoal-900"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            aria-label="Send message to assistant"
            className="px-4 py-2.5 bg-sage-500 text-white rounded-xl hover:bg-sage-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-sage-600 cursor-pointer flex items-center justify-center"
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}
