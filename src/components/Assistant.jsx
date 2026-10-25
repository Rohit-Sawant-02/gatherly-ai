import React, { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, Bot, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Button, Card } from './ui/index.jsx';
import { getAssistantResponse, getWelcomeMessage, SUGGESTED_PROMPTS } from '../utils/assistant.js';

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
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2" />;
    if (trimmed.startsWith('- ')) {
      return (
        <li key={i} className="ml-4 list-disc">
          {renderFormattedText(trimmed.slice(2))}
        </li>
      );
    }
    return <p key={i}>{renderFormattedText(line)}</p>;
  });
}

function AssistantMessage({ message }) {
  return (
    <div className="flex gap-2.5 items-start">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-sage-100 flex items-center justify-center mt-0.5">
        <Bot size={14} className="text-sage-600" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-ivory-50 border border-ivory-200 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-charcoal-800 leading-relaxed space-y-1">
          {parseMarkdown(message)}
        </div>
      </div>
    </div>
  );
}

function UserMessage({ message }) {
  return (
    <div className="flex justify-end">
      <div className="bg-sage-500 text-white rounded-2xl rounded-tr-none px-4 py-2.5 text-sm max-w-xs">
        {message}
      </div>
    </div>
  );
}

export default function Assistant({ onClose }) {
  const { activeEvent, state } = useApp();
  const [messages, setMessages] = useState(() => {
    const welcome = getWelcomeMessage(activeEvent);
    return [{ type: 'assistant', text: welcome.message, suggestions: welcome.suggestions }];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Reset conversation when active event changes
  useEffect(() => {
    const welcome = getWelcomeMessage(activeEvent);
    setMessages([{ type: 'assistant', text: welcome.message, suggestions: welcome.suggestions }]);
  }, [activeEvent?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text) => {
    if (!text.trim()) return;
    const userMsg = { type: 'user', text: text.trim() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate brief "thinking" delay for realism
    setTimeout(() => {
      const tasks = activeEvent?.tasks || [];
      const response = getAssistantResponse(text, activeEvent, tasks);
      setMessages(m => [...m, { type: 'assistant', text: response.message, suggestions: response.suggestions }]);
      setIsTyping(false);
    }, 400);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleReset = () => {
    const welcome = getWelcomeMessage(activeEvent);
    setMessages([{ type: 'assistant', text: welcome.message, suggestions: welcome.suggestions }]);
    setInput('');
    inputRef.current?.focus();
  };

  const lastSuggestions = messages.filter(m => m.type === 'assistant' && m.suggestions).slice(-1)[0]?.suggestions || SUGGESTED_PROMPTS.slice(0, 4);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ivory-200 bg-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center">
            <Bot size={16} className="text-sage-600" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-charcoal-900">Gatherly Assistant</h2>
            <p className="text-[10px] text-charcoal-400">Rule-based · No AI API · Always private</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => sendMessage('Generate My Plan')}
            className="text-xs px-2.5 py-1 rounded-lg bg-sage-50 text-sage-700 hover:bg-sage-100 font-medium border border-sage-200 transition-colors flex items-center gap-1"
            title="Generate structured plan based on active event"
          >
            <span>✨</span>
            <span className="hidden sm:inline">Generate</span> Plan
          </button>
          <button
            onClick={handleReset}
            aria-label="Refresh Suggestions"
            title="Refresh suggestions & reset conversation"
            className="p-1.5 rounded-lg text-charcoal-500 hover:text-charcoal-800 hover:bg-ivory-100 transition-colors"
          >
            <RefreshCw size={14} aria-hidden="true" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close assistant"
              title="Close assistant"
              className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-ivory-100 transition-colors"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-center gap-2 px-4 py-1.5 bg-gold-50 border-b border-gold-100 text-[11px] text-gold-700">
        <Info size={12} className="flex-shrink-0" aria-hidden="true" />
        <span>Suggestions generated from local deterministic rules & templates — offline & private.</span>
      </div>

      {/* Messages */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg, i) =>
          msg.type === 'user'
            ? <UserMessage key={i} message={msg.text} />
            : <AssistantMessage key={i} message={msg.text} />
        )}
        {isTyping && (
          <div className="flex gap-2.5 items-center">
            <div className="w-7 h-7 rounded-full bg-sage-100 flex items-center justify-center">
              <Bot size={14} className="text-sage-600" aria-hidden="true" />
            </div>
            <div className="bg-ivory-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1" aria-label="Thinking…">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-charcoal-300 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} aria-hidden="true" />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      {lastSuggestions.length > 0 && (
        <div className="px-4 py-2 border-t border-ivory-100 flex gap-2 overflow-x-auto scrollbar-none">
          {lastSuggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => sendMessage(s)}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-ivory-100 text-charcoal-700 border border-ivory-200 hover:bg-sage-50 hover:border-sage-200 hover:text-sage-700 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-ivory-200 bg-white rounded-b-xl">
        <div className="flex gap-2">
          <label htmlFor="assistant-input" className="sr-only">Ask the planning assistant</label>
          <input
            ref={inputRef}
            id="assistant-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about budget, decorations, food…"
            className="flex-1 rounded-xl border border-ivory-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-sage-400 bg-ivory-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            aria-label="Send message"
            className="px-4 py-2.5 bg-sage-500 text-white rounded-xl hover:bg-sage-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}
