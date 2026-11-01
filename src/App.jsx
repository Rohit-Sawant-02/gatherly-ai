import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import LoginPage from './components/LoginPage.jsx';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import EventWizard from './components/EventWizard.jsx';
import MyEvents from './components/MyEvents.jsx';
import BudgetPlanner from './components/BudgetPlanner.jsx';
import Checklist from './components/Checklist.jsx';
import VendorManager from './components/VendorManager.jsx';
import Inspiration from './components/Inspiration.jsx';
import Settings from './components/Settings.jsx';
import Assistant from './components/Assistant.jsx';
import { Bot, X } from 'lucide-react';

function AppContent() {
  const { state } = useApp();
  const [assistantOpen, setAssistantOpen] = useState(false);

  // If user is not authenticated, show the demo login screen
  if (!state.isAuthenticated) {
    return <LoginPage />;
  }

  const sections = {
    dashboard: Dashboard,
    plan: EventWizard,
    events: MyEvents,
    budget: BudgetPlanner,
    checklist: Checklist,
    vendors: VendorManager,
    inspiration: Inspiration,
    settings: Settings,
  };

  const ActiveSection = sections[state.activeSection] || Dashboard;

  return (
    <div className="flex h-screen overflow-hidden bg-ivory-50">
      {/* Skip to content link */}
      <a href="#main-content" className="skip-to-content">Skip to main content</a>

      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-16 md:pt-6"
        >
          <ActiveSection />
        </main>
      </div>

      {/* Floating assistant button */}
      <button
        onClick={() => setAssistantOpen(o => !o)}
        aria-label={assistantOpen ? 'Close planning assistant' : 'Open planning assistant'}
        aria-expanded={assistantOpen}
        className={`fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full shadow-elevated flex items-center justify-center transition-all duration-200
          ${assistantOpen ? 'bg-charcoal-800 hover:bg-charcoal-900' : 'bg-sage-500 hover:bg-sage-600'}
        `}
      >
        {assistantOpen ? (
          <X size={22} className="text-white" aria-hidden="true" />
        ) : (
          <Bot size={22} className="text-white" aria-hidden="true" />
        )}
      </button>

      {/* Assistant panel */}
      {assistantOpen && (
        <div
          className="fixed bottom-24 right-6 z-20 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-elevated border border-ivory-200 bg-white flex flex-col overflow-hidden"
          style={{ height: '520px' }}
          aria-label="Planning assistant panel"
        >
          <Assistant onClose={() => setAssistantOpen(false)} />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
