import React, { useState, useRef } from 'react';
import { Trash2, Download, Database, RefreshCw, AlertTriangle, CheckCircle, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Button, Card, SectionHeader, ConfirmDialog } from './ui/index.jsx';
import { clearAll, exportData, storageAvailable, setItem, KEYS } from '../utils/storage.js';
import { getDemoEvents, getDemoVendors } from '../data/demo.js';

export default function Settings() {
  const { state, dispatch } = useApp();
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(false);
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
        const parsed = JSON.parse(event.target.result);
        if (!parsed || (typeof parsed !== 'object')) {
          throw new Error('Invalid JSON structure');
        }

        const events = Array.isArray(parsed.events) ? parsed.events : [];
        const vendors = Array.isArray(parsed.vendors) ? parsed.vendors : [];
        const savedIdeas = Array.isArray(parsed.savedIdeas) ? parsed.savedIdeas : [];
        const settings = parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : { demoLoaded: false };

        dispatch({
          type: 'LOAD_ALL',
          payload: { events, vendors, savedIdeas, settings, activeEventId: events[0]?.id || null },
        });

        setItem(KEYS.EVENTS, events);
        setItem(KEYS.VENDORS, vendors);
        setItem(KEYS.SAVED_IDEAS, savedIdeas);
        setItem(KEYS.SETTINGS, settings);

        showSuccess(`Backup imported! ${events.length} event${events.length !== 1 ? 's' : ''} and ${vendors.length} vendor${vendors.length !== 1 ? 's' : ''} loaded.`);
      } catch (err) {
        showError('Failed to import backup: invalid or corrupted JSON file.');
      }
    };
    reader.onerror = () => {
      showError('Failed to read the selected file.');
    };
    reader.readAsText(file);
    // Reset file input
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
        <h2 className="text-sm font-semibold text-charcoal-700 mb-2">Privacy Notice</h2>
        <ul className="text-xs text-charcoal-500 space-y-1 list-disc list-inside">
          <li>All data is stored only in your browser's localStorage.</li>
          <li>No data is sent to any server, API, or third-party service.</li>
          <li>Clearing browser data will erase all Gatherly data.</li>
          <li>Gatherly AI does not use a live AI model or external API.</li>
          <li>The planning assistant works offline using local rule-based logic.</li>
        </ul>
      </Card>

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
