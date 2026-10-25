import React, { useState } from 'react';
import {
  LayoutDashboard, Calendar, List, DollarSign, CheckSquare,
  Users, Lightbulb, Settings, ChevronLeft, ChevronRight,
  Sparkles, Menu, X
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'plan',        label: 'Plan an Event',  icon: Sparkles },
  { id: 'events',      label: 'My Events',       icon: Calendar },
  { id: 'budget',      label: 'Budget Planner',  icon: DollarSign },
  { id: 'checklist',   label: 'Timeline & Tasks',icon: CheckSquare },
  { id: 'vendors',     label: 'Vendors',          icon: Users },
  { id: 'inspiration', label: 'Inspiration',     icon: Lightbulb },
  { id: 'settings',    label: 'Settings',         icon: Settings },
];

export default function Sidebar() {
  const { state, navigate, activeEvent } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on Escape key
  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const handleNav = (id) => {
    navigate(id);
    setMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-ivory-200 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-sage-500 flex items-center justify-center shadow-subtle">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            <circle cx="12" cy="8" r="2" className="fill-gold-400"/>
          </svg>
        </div>
        {!collapsed && (
          <div>
            <span className="text-base font-bold text-charcoal-900 tracking-tight">Gatherly AI</span>
            <p className="text-[10px] text-charcoal-400 leading-none mt-0.5">Event Planner</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto py-3 px-2">
        <ul role="list" className="space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = state.activeSection === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNav(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${isActive
                      ? 'bg-sage-500 text-white shadow-subtle'
                      : 'text-charcoal-600 hover:bg-ivory-100 hover:text-charcoal-900'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                >
                  <Icon size={18} aria-hidden="true" className="flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Active event indicator */}
      {!collapsed && activeEvent && (
        <button
          onClick={() => handleNav('events')}
          title="View active event in My Events"
          className="mx-2 mb-3 px-3 py-2.5 bg-gold-50 hover:bg-gold-100 border border-gold-200 rounded-lg text-left transition-colors"
        >
          <p className="text-[10px] text-gold-700 font-semibold uppercase tracking-wide mb-0.5">Active Event</p>
          <p className="text-xs text-charcoal-800 font-semibold truncate">
            {activeEvent.name}
          </p>
          <p className="text-[10px] text-charcoal-500 capitalize">{activeEvent.occasion}</p>
        </button>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="flex items-center justify-center gap-2 mx-2 mb-3 py-2 px-3 rounded-lg text-xs text-charcoal-500 hover:bg-ivory-100 transition-colors border border-ivory-200"
      >
        {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Collapse</span></>}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        aria-label="Sidebar navigation"
        className={`hidden md:flex flex-col bg-white border-r border-ivory-200 transition-all duration-200 flex-shrink-0
          ${collapsed ? 'w-16' : 'w-56'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-ivory-200 px-4 py-3 flex items-center justify-between shadow-subtle">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sage-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-charcoal-900">Gatherly AI</span>
        </div>
        <button
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileOpen}
          className="p-2 rounded-lg hover:bg-ivory-100 text-charcoal-600 transition-colors"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-50 bg-charcoal-900/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="md:hidden fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-elevated flex flex-col">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
