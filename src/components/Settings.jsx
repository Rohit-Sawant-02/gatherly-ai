import React, { useState, useRef } from 'react';
import { Trash2, Download, Database, RefreshCw, AlertTriangle, CheckCircle, Upload, LogOut, User, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Button, Card, SectionHeader, ConfirmDialog } from './ui/index.jsx';
import { clearAll, exportData, storageAvailable, setItem, KEYS } from '../utils/storage.js';
import { getDemoEvents, getDemoVendors } from '../data/demo.js';

export default function Settings() {
  const { state, dispatch, logout } = useApp();
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 4500);
  };

  const handleExport = () => {
    exportData();
    showSuccess('Data exported successfully!');
  };

  const handleClearAll = () => {
    clearAll();
    dispatch({ type: 'CLEAR_ALL' });
    setConfirmClear(false);
    showSuccess('All data cleared.');
  };

  const handleLoadDemo = () => {
    const demoEvents = getDemoEvents();
    const demoVendors = getDemoVendors(demoEvents.map(e => e.id));
    demoEvents.forEach(e => dispatch({ type: 'ADD_EVENT', payload: e }));
    demoVendors.forEach(v => dispatch({ type: 'ADD_VENDOR', payload: v }));
    dispatch({ type: 'SET_SETTINGS', payload: { demoLoaded: true } });
    setConfirmDemo(false);
    showSuccess('Demo data loaded! (Labelled "SAMPLE DATA")');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        if (!text || typeof text !== 'string') {
          throw new Error('File content is empty or unreadable.');
        }

        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Root JSON must be an object with export metadata.');
        }

        // Validate and sanitize events
        const rawEvents = Array.isArray(parsed.events) ? parsed.events : [];
        const validatedEvents = rawEvents
          .filter(ev => ev && typeof ev === 'object' && typeof ev.name === 'string' && ev.name.trim().length > 0)
          .map(ev => ({
            id: String(ev.id || Date.now()),
            name: String(ev.name).trim().slice(0, 120),
            occasion: ['wedding', 'birthday', 'community'].includes(ev.occasion) ? ev.occasion : 'birthday',
            date: typeof ev.date === 'string' ? ev.date : '',
            location: typeof ev.location === 'string' ? ev.location.slice(0, 150) : '',
            guestCount: Math.max(1, Number(ev.guestCount) || 1),
            budget: Math.max(0, Number(ev.budget) || 0),
            theme: typeof ev.theme === 'string' ? ev.theme.slice(0, 100) : '',
            foodPreferences: typeof ev.foodPreferences === 'string' ? ev.foodPreferences.slice(0, 150) : '',
            notes: typeof ev.notes === 'string' ? ev.notes.slice(0, 500) : '',
            tasks: Array.isArray(ev.tasks)
              ? ev.tasks.map(t => ({
                  id: String(t.id || Math.random()),
                  title: String(t.title || 'Untitled task').slice(0, 120),
                  deadline: typeof t.deadline === 'string' ? t.deadline : null,
                  priority: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
                  completed: Boolean(t.completed),
                  custom: Boolean(t.custom),
                  dependsOn: Array.isArray(t.dependsOn) ? t.dependsOn.map(String) : [],
                }))
              : [],
            budget_allocations: Array.isArray(ev.budget_allocations)
              ? ev.budget_allocations.map(a => ({
                  id: String(a.id || Math.random()),
                  label: String(a.label || 'Category').slice(0, 50),
                  allocated: Math.max(0, Number(a.allocated) || 0),
                  spent: Math.max(0, Number(a.spent) || 0),
                  percentage: Number(a.percentage) || 0,
                }))
              : [],
            priorities: ev.priorities && typeof ev.priorities === 'object' ? ev.priorities : {},
            createdAt: typeof ev.createdAt === 'string' ? ev.createdAt : new Date().toISOString(),
          }));

        // Validate and sanitize vendors
        const rawVendors = Array.isArray(parsed.vendors) ? parsed.vendors : [];
        const validatedVendors = rawVendors
          .filter(v => v && typeof v === 'object' && typeof v.name === 'string' && v.name.trim().length > 0)
          .map(v => ({
            id: String(v.id || Math.random()),
            eventId: String(v.eventId || ''),
            name: String(v.name).trim().slice(0, 100),
            category: String(v.category || 'other'),
            contact: typeof v.contact === 'string' ? v.contact.slice(0, 60) : '',
            price: Math.max(0, Number(v.price) || 0),
            guestCapacity: Number(v.guestCapacity) || 0,
            additionalCharges: Number(v.additionalCharges) || 0,
            servicesIncluded: typeof v.servicesIncluded === 'string' ? v.servicesIncluded.slice(0, 300) : '',
            notes: typeof v.notes === 'string' ? v.notes.slice(0, 500) : '',
            status: ['enquired', 'quoted', 'booked', 'paid', 'cancelled'].includes(v.status) ? v.status : 'enquired',
            _demo: Boolean(v._demo),
          }));

        const savedIdeas = Array.isArray(parsed.savedIdeas) ? parsed.savedIdeas.filter(i => typeof i === 'string') : [];
        const settings = parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : { demoLoaded: false };

        dispatch({
          type: 'LOAD_ALL',
          payload: {
            events: validatedEvents,
            vendors: validatedVendors,
            savedIdeas,
            settings,
            activeEventId: validatedEvents[0]?.id || null,
          },
        });

        setItem(KEYS.EVENTS, validatedEvents);
        setItem(KEYS.VENDORS, validatedVendors);
        setItem(KEYS.SAVED_IDEAS, savedIdeas);
        setItem(KEYS.SETTINGS, settings);

        showSuccess(`Backup successfully validated and imported! Loaded ${validatedEvents.length} event${validatedEvents.length !== 1 ? 's' : ''} and ${validatedVendors.length} vendor${validatedVendors.length !== 1 ? 's' : ''}.`);
      } catch (err) {
        showError(`Failed to import backup: ${err.message || 'invalid or corrupted JSON file.'}`);
      }
    };
    reader.onerror = () => {
      showError('Failed to read the selected file.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const storageOk = storageAvailable();
  const eventCount = state.events.length;
  const vendorCount = state.vendors.length;
  const ideaCount = state.savedIdeas.length;

  return (
    <div>
      <SectionHeader title="Settings & Data Management" description="Manage your local event data" />

      {successMsg && (
        <div role="status" className="flex items-center gap-2 p-3 bg-sage-50 border border-sage-200 rounded-xl text-sm text-sage-700 mb-6">
          <CheckCircle size={16} aria-hidden="true" /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div role="alert" className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-6">
          <AlertTriangle size={16} aria-hidden="true" /> {errorMsg}
        </div>
      )}

      {!storageOk && (
        <div role="alert" className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-6">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
          Browser storage is unavailable. Your data will not be saved between sessions.
        </div>
      )}

      {/* Data summary */}
      <Card className="mb-6">
        <h2 className="text-base font-semibold text-charcoal-900 mb-4">Stored Data Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Events', value: eventCount, icon: '📅' },
            { label: 'Vendors', value: vendorCount, icon: '👥' },
            { label: 'Saved Ideas', value: ideaCount, icon: '💡' },
          ].map(s => (
            <div key={s.label} className="text-center p-3 bg-ivory-50 rounded-xl border border-ivory-200">
              <p className="text-2xl mb-1" aria-hidden="true">{s.icon}</p>
              <p className="text-xl font-bold text-charcoal-900">{s.value}</p>
              <p className="text-xs text-charcoal-400">{s.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Account & Session Management */}
      <Card className="mb-6 border-sage-200 bg-gradient-to-br from-white to-ivory-50/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sage-100 rounded-xl text-sage-700">
              <User size={22} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-charcoal-900">
                  {state.user?.name || 'Demo Evaluator'}
                </h2>
                <span className="text-[10px] bg-sage-100 text-sage-800 font-semibold px-2 py-0.5 rounded-full">
                  Demo Session
                </span>
              </div>
              <p className="text-xs text-charcoal-500 font-mono mt-0.5">
                {state.user?.email || 'demo@gatherly.app'}
              </p>
              <p className="text-[11px] text-charcoal-400 mt-1 flex items-center gap-1">
                <Shield size={12} className="text-sage-600" aria-hidden="true" />
                Session persisted in browser localStorage · Logging out preserves all event data
              </p>
            </div>
          </div>
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmLogout(true)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <LogOut size={14} aria-hidden="true" />
              Log Out of Demo
            </Button>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 bg-sage-50 rounded-xl">
              <Download size={20} className="text-sage-600" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-charcoal-900">Export Backup</h3>
              <p className="text-xs text-charcoal-400 mt-0.5">Download all your event data as a JSON file.</p>
            </div>
          </div>
          <Button variant="primary" fullWidth onClick={handleExport} disabled={eventCount === 0}>
            Export as JSON
          </Button>
        </Card>

        <Card>
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 bg-sage-50 rounded-xl">
              <Upload size={20} className="text-sage-600" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-charcoal-900">Import Backup</h3>
              <p className="text-xs text-charcoal-400 mt-0.5">Restore previously exported Gatherly data.</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload JSON backup file"
          />
          <Button variant="outline" fullWidth onClick={() => fileInputRef.current?.click()}>
            Import JSON File
          </Button>
        </Card>

        <Card>
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 bg-gold-50 rounded-xl">
              <Database size={20} className="text-gold-600" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-charcoal-900">Load Demo Data</h3>
              <p className="text-xs text-charcoal-400 mt-0.5">Add sample events and vendors labelled as sample data.</p>
            </div>
          </div>
          <Button variant="secondary" fullWidth onClick={() => setConfirmDemo(true)}>
            Load Sample Data
          </Button>
        </Card>

        <Card className="sm:col-span-3">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 bg-red-50 rounded-xl">
              <Trash2 size={20} className="text-red-500" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-charcoal-900">Clear All Data</h3>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Permanently delete all events, vendors, and saved ideas. This cannot be undone.
              </p>
            </div>
          </div>
          <Button variant="danger" onClick={() => setConfirmClear(true)}>
            Clear All Data
          </Button>
        </Card>
      </div>

      {/* Privacy notice */}
      <Card className="bg-charcoal-50 border-charcoal-200">
        <h2 className="text-sm font-semibold text-charcoal-700 mb-2">Privacy & Security Transparency Notice</h2>
        <ul className="text-xs text-charcoal-500 space-y-1 list-disc list-inside">
          <li>All event data is stored exclusively in your browser's localStorage.</li>
          <li>No data is transmitted to external servers, remote databases, or third-party APIs.</li>
          <li>Demo login provides simulated client-side authentication for hackathon evaluation and does not require a backend.</li>
          <li>Logging out preserves your events, tasks, budgets, and vendors in localStorage.</li>
          <li>Gatherly AI does not use a live generative AI model or cloud API. All planning recommendations, budget formulas, and assistant answers use deterministic local rules.</li>
        </ul>
      </Card>

      <ConfirmDialog
        isOpen={confirmLogout}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          logout();
        }}
        title="Log Out of Demo"
        message="Logging out returns you to the demo login screen. All your saved events, budgets, tasks, and vendors will remain safely preserved in this browser."
        confirmLabel="Log Out"
        danger={false}
      />

      <ConfirmDialog
        isOpen={confirmClear}
        onCancel={() => setConfirmClear(false)}
        onConfirm={handleClearAll}
        title="Clear All Data"
        message={`This will permanently delete all ${eventCount} events, ${vendorCount} vendors, and ${ideaCount} saved ideas. This action cannot be undone.`}
        confirmLabel="Yes, Clear Everything"
        danger
      />

      <ConfirmDialog
        isOpen={confirmDemo}
        onCancel={() => setConfirmDemo(false)}
        onConfirm={handleLoadDemo}
        title="Load Sample Data"
        message="This will add 2 sample events and 3 sample vendors to your account. They'll be labelled SAMPLE DATA. Your existing data will not be overwritten."
        confirmLabel="Load Demo Data"
        danger={false}
      />
    </div>
  );
}
