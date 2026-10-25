import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Phone, DollarSign, CheckCircle, Clock, HelpCircle, ArrowUpDown, TrendingDown, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Button, Card, Badge, EmptyState, SectionHeader, Modal, Input, Select, Textarea, ConfirmDialog } from './ui/index.jsx';
import { formatINR, generateId, filterVendors, parseNumber, compareVendorPrices } from '../utils/helpers.js';

const CATEGORIES = [
  { value: 'venue', label: '🏛 Venue' },
  { value: 'catering', label: '🍽 Catering' },
  { value: 'decorations', label: '🎨 Decorations' },
  { value: 'photography', label: '📷 Photography' },
  { value: 'entertainment', label: '🎵 Entertainment' },
  { value: 'invitations', label: '💌 Invitations' },
  { value: 'transport', label: '🚗 Transport' },
  { value: 'other', label: '📦 Other' },
];

const STATUS_OPTIONS = [
  { value: 'enquired', label: 'Enquired' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'booked', label: 'Booked' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS = {
  enquired: 'default',
  quoted: 'gold',
  booked: 'sage',
  paid: 'green',
  cancelled: 'red',
};

const STATUS_ICONS = {
  enquired: HelpCircle,
  quoted: Clock,
  booked: CheckCircle,
  paid: CheckCircle,
  cancelled: HelpCircle,
};

const emptyVendor = {
  name: '', category: 'catering', contact: '', price: '',
  notes: '', status: 'enquired', eventId: '',
};

function VendorModal({ isOpen, onClose, onSave, initial, events }) {
  const [form, setForm] = useState(initial || { ...emptyVendor });
  React.useEffect(() => { setForm(initial || { ...emptyVendor }); }, [initial]);
  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }));
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Vendor name is required.'); return; }
    setError('');
    onSave({ ...form, price: parseNumber(form.price) });
    onClose();
  };

  const eventOptions = [
    { value: '', label: 'No specific event' },
    ...events.map(ev => ({ value: ev.id, label: ev.name })),
  ];
  const catOptions = CATEGORIES.map(c => ({ value: c.value, label: c.label }));
  const statusOptions = STATUS_OPTIONS.map(s => ({ value: s.value, label: s.label }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Vendor' : 'Add Vendor'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">⚠ {error}</p>}
        <Input id="v-name" label="Vendor Name" required value={form.name} onChange={set('name')} placeholder="e.g. Mehta Catering Co." />
        <div className="grid grid-cols-2 gap-4">
          <Select id="v-cat" label="Category" value={form.category} onChange={set('category')} options={catOptions} />
          <Select id="v-status" label="Booking Status" value={form.status} onChange={set('status')} options={statusOptions} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input id="v-contact" label="Contact" value={form.contact} onChange={set('contact')} placeholder="+91 98765 43210" />
          <Input id="v-price" label="Quoted Price (₹)" type="number" value={form.price} onChange={set('price')} prefix="₹" placeholder="e.g. 25000" />
        </div>
        <Select id="v-event" label="Associated Event" value={form.eventId} onChange={set('eventId')} options={eventOptions} />
        <Textarea id="v-notes" label="Notes" value={form.notes} onChange={set('notes')} placeholder="Quoted for 100 pax, includes setup..." rows={2} />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>Cancel</Button>
          <Button type="submit" variant="primary" fullWidth>{initial ? 'Save Changes' : 'Add Vendor'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function VendorCard({ vendor, onEdit, onDelete }) {
  const StatusIcon = STATUS_ICONS[vendor.status] || HelpCircle;
  const catLabel = CATEGORIES.find(c => c.value === vendor.category)?.label || vendor.category;
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <Card className="group hover:border-sage-200 transition-all duration-150">
        {vendor._demo && (
          <div className="text-[10px] text-charcoal-400 bg-ivory-100 rounded-full px-2 py-0.5 inline-block mb-2 border border-ivory-200">SAMPLE DATA</div>
        )}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-charcoal-900 truncate">{vendor.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="default">{catLabel}</Badge>
              <Badge variant={STATUS_COLORS[vendor.status]}>
                <StatusIcon size={10} className="mr-0.5" aria-hidden="true" />
                {vendor.status}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(vendor)} aria-label={`Edit ${vendor.name}`} className="p-1.5 rounded text-charcoal-400 hover:text-charcoal-700 hover:bg-ivory-100">
              <Pencil size={13} />
            </button>
            <button onClick={() => setConfirmDelete(true)} aria-label={`Delete ${vendor.name}`} className="p-1.5 rounded text-charcoal-400 hover:text-red-600 hover:bg-red-50">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {vendor.price > 0 && (
          <div className="flex items-center gap-1.5 text-sm font-semibold text-charcoal-900 mb-2">
            <DollarSign size={14} className="text-sage-500" aria-hidden="true" />
            {formatINR(vendor.price)}
            <span className="text-xs text-charcoal-400 font-normal">(estimate)</span>
          </div>
        )}
        {vendor.contact && (
          <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mb-2">
            <Phone size={12} aria-hidden="true" />
            {vendor.contact}
          </div>
        )}
        {vendor.notes && (
          <p className="text-xs text-charcoal-400 border-t border-ivory-100 pt-2 mt-2 line-clamp-2">{vendor.notes}</p>
        )}
      </Card>

      <ConfirmDialog
        isOpen={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => { setConfirmDelete(false); onDelete(vendor.id); }}
        title="Delete Vendor"
        message={`Delete "${vendor.name}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </>
  );
}

export default function VendorManager() {
  const { state, dispatch } = useApp();
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEvent, setFilterEvent] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'compare'

  const filtered = filterVendors(state.vendors, {
    category: filterCat,
    status: filterStatus,
    eventId: filterEvent === 'all' ? undefined : filterEvent,
  });

  const handleSave = (form) => {
    if (editVendor) {
      dispatch({ type: 'UPDATE_VENDOR', payload: { id: editVendor.id, ...form } });
    } else {
      dispatch({ type: 'ADD_VENDOR', payload: { id: generateId(), ...form, _demo: false } });
    }
    setEditVendor(null);
  };

  const totalQuoted = filtered.reduce((s, v) => s + (Number(v.price) || 0), 0);
  const comparisons = compareVendorPrices(filtered);

  const catFilterOpts = [{ value: 'all', label: 'All Categories' }, ...CATEGORIES.map(c => ({ value: c.value, label: c.label }))];
  const statusFilterOpts = [{ value: 'all', label: 'All Statuses' }, ...STATUS_OPTIONS.map(s => ({ value: s.value, label: s.label }))];
  const eventFilterOpts = [{ value: 'all', label: 'All Events' }, ...state.events.map(e => ({ value: e.id, label: e.name }))];

  return (
    <div>
      <SectionHeader
        title="Vendor Manager"
        description={`${state.vendors.length} vendor${state.vendors.length !== 1 ? 's' : ''} · ${formatINR(totalQuoted)} total quoted`}
        actions={
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-ivory-300 p-0.5 bg-white">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'cards' ? 'bg-sage-500 text-white shadow-subtle' : 'text-charcoal-600 hover:text-charcoal-900'}`}
              >
                Cards View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compare')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${viewMode === 'compare' ? 'bg-sage-500 text-white shadow-subtle' : 'text-charcoal-600 hover:text-charcoal-900'}`}
              >
                <ArrowUpDown size={12} aria-hidden="true" />
                Compare Quotes
              </button>
            </div>
            <Button variant="primary" size="sm" onClick={() => { setEditVendor(null); setModalOpen(true); }}>
              <Plus size={16} aria-hidden="true" /> Add Vendor
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          aria-label="Filter by category"
          className="text-sm border border-ivory-300 rounded-lg px-3 py-1.5 bg-white text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-sage-400">
          {catFilterOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          aria-label="Filter by status"
          className="text-sm border border-ivory-300 rounded-lg px-3 py-1.5 bg-white text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-sage-400">
          {statusFilterOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)}
          aria-label="Filter by event"
          className="text-sm border border-ivory-300 rounded-lg px-3 py-1.5 bg-white text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-sage-400">
          {eventFilterOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {state.vendors.length === 0 ? (
        <Card>
          <EmptyState
            icon="👥"
            title="No vendors yet"
            description="Add caterers, photographers, decorators, and other vendors to track quotes, compare pricing, and manage bookings."
            action={<Button variant="primary" onClick={() => { setEditVendor(null); setModalOpen(true); }}>Add Your First Vendor</Button>}
          />
          <div className="mt-6 pt-6 border-t border-ivory-200">
            <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-3 text-center">Available Categories</p>
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIES.map(c => (
                <span key={c.value} className="text-xs px-2.5 py-1 rounded-full bg-ivory-100 text-charcoal-600 border border-ivory-200">
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon="🔍" title="No vendors match this filter" description="Try selecting a different category, status, or event filter." />
        </Card>
      ) : viewMode === 'compare' ? (
        <div className="space-y-6">
          {comparisons.map(group => {
            const catLabel = CATEGORIES.find(c => c.value === group.category)?.label || group.category;
            return (
              <Card key={group.category} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ivory-200 pb-3">
                  <div>
                    <h3 className="text-base font-semibold text-charcoal-900">{catLabel}</h3>
                    <p className="text-xs text-charcoal-400">
                      {group.count} vendor{group.count !== 1 ? 's' : ''} ({group.pricedCount} with quotes)
                    </p>
                  </div>
                  {group.pricedCount > 1 && (
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-charcoal-400">Lowest: </span>
                        <strong className="text-sage-600">{formatINR(group.minPrice)}</strong>
                      </div>
                      <div>
                        <span className="text-charcoal-400">Highest: </span>
                        <strong className="text-charcoal-700">{formatINR(group.maxPrice)}</strong>
                      </div>
                      {group.savings > 0 && (
                        <div className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <TrendingDown size={12} aria-hidden="true" />
                          Save up to {formatINR(group.savings)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-ivory-200 text-xs text-charcoal-400">
                        <th className="pb-2 font-medium">Vendor</th>
                        <th className="pb-2 font-medium">Quoted Price</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Event</th>
                        <th className="pb-2 font-medium">Contact</th>
                        <th className="pb-2 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ivory-100">
                      {group.items.map(v => {
                        const isLowest = group.pricedCount > 1 && parseNumber(v.price) === group.minPrice && group.minPrice > 0;
                        const eventName = state.events.find(e => e.id === v.eventId)?.name || 'General';
                        return (
                          <tr key={v.id} className="hover:bg-ivory-50/60 transition-colors">
                            <td className="py-2.5 font-medium text-charcoal-900 flex items-center gap-2">
                              {v.name}
                              {v._demo && <span className="text-[9px] px-1.5 py-0.2 rounded bg-ivory-200 text-charcoal-500 font-normal">DEMO</span>}
                            </td>
                            <td className="py-2.5">
                              {v.price > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-charcoal-900">{formatINR(v.price)}</span>
                                  {isLowest && (
                                    <Badge variant="green" className="text-[10px]">Lowest</Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-charcoal-400 italic text-xs">No quote yet</span>
                              )}
                            </td>
                            <td className="py-2.5">
                              <Badge variant={STATUS_COLORS[v.status]}>{v.status}</Badge>
                            </td>
                            <td className="py-2.5 text-xs text-charcoal-600">{eventName}</td>
                            <td className="py-2.5 text-xs text-charcoal-500">{v.contact || '—'}</td>
                            <td className="py-2.5 text-right">
                              <button
                                onClick={() => { setEditVendor(v); setModalOpen(true); }}
                                className="text-xs text-sage-600 hover:text-sage-800 font-medium mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => dispatch({ type: 'DELETE_VENDOR', payload: v.id })}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(v => (
            <VendorCard key={v.id} vendor={v}
              onEdit={(v) => { setEditVendor(v); setModalOpen(true); }}
              onDelete={(id) => dispatch({ type: 'DELETE_VENDOR', payload: id })}
            />
          ))}
        </div>
      )}

      <VendorModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditVendor(null); }}
        onSave={handleSave}
        initial={editVendor}
        events={state.events}
      />
    </div>
  );
}
