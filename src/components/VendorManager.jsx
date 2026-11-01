import React, { useState } from 'react';
import {
  Plus, Pencil, Trash2, Phone, DollarSign, CheckCircle, Clock,
  HelpCircle, ArrowUpDown, TrendingDown, Layers, Users, Info, AlertTriangle, FileText
} from 'lucide-react';
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
  name: '',
  category: 'catering',
  contact: '',
  price: '',
  guestCapacity: '',
  additionalCharges: '',
  servicesIncluded: '',
  notes: '',
  status: 'enquired',
  eventId: '',
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
    onSave({
      ...form,
      price: parseNumber(form.price),
      guestCapacity: form.guestCapacity ? parseNumber(form.guestCapacity) : 0,
      additionalCharges: form.additionalCharges ? parseNumber(form.additionalCharges) : 0,
    });
    onClose();
  };

  const eventOptions = [
    { value: '', label: 'No specific event' },
    ...events.map(ev => ({ value: ev.id, label: ev.name })),
  ];
  const catOptions = CATEGORIES.map(c => ({ value: c.value, label: c.label }));
  const statusOptions = STATUS_OPTIONS.map(s => ({ value: s.value, label: s.label }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Vendor Quotation' : 'Add Vendor Quotation'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">⚠ {error}</p>}
        <Input id="v-name" label="Vendor Name" required value={form.name} onChange={set('name')} placeholder="e.g. Royal Feast Catering Co." />
        <div className="grid grid-cols-2 gap-4">
          <Select id="v-cat" label="Category" value={form.category} onChange={set('category')} options={catOptions} />
          <Select id="v-status" label="Booking Status" value={form.status} onChange={set('status')} options={statusOptions} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input id="v-contact" label="Contact Details" value={form.contact} onChange={set('contact')} placeholder="+91 98765 43210 or email" />
          <Input id="v-price" label="Base Quoted Price (₹)" type="number" value={form.price} onChange={set('price')} prefix="₹" placeholder="e.g. 240000" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="v-capacity"
            label="Guest Capacity / Pax Covered"
            type="number"
            value={form.guestCapacity || ''}
            onChange={set('guestCapacity')}
            placeholder="e.g. 200"
            hint="For venue or catering pax limits"
          />
          <Input
            id="v-charges"
            label="Additional Charges / Taxes (₹)"
            type="number"
            value={form.additionalCharges || ''}
            onChange={set('additionalCharges')}
            prefix="₹"
            placeholder="e.g. 15000"
            hint="GST, service charge, overtime, deposit"
          />
        </div>
        <Select id="v-event" label="Associated Event" value={form.eventId} onChange={set('eventId')} options={eventOptions} />
        <Textarea
          id="v-services"
          label="Services & Inclusions Specified in Quote"
          value={form.servicesIncluded || ''}
          onChange={set('servicesIncluded')}
          placeholder="e.g. 4 starters, 3 mains, live chaat counter, dessert buffet, service staff, cutlery"
          rows={2}
          hint="List what is covered in this quoted price"
        />
        <Textarea
          id="v-notes"
          label="Internal Notes"
          value={form.notes}
          onChange={set('notes')}
          placeholder="Terms discussed, tasting dates, cancellation policy..."
          rows={2}
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>Cancel</Button>
          <Button type="submit" variant="primary" fullWidth>{initial ? 'Save Changes' : 'Save Vendor'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function VendorCard({ vendor, onEdit, onDelete }) {
  const StatusIcon = STATUS_ICONS[vendor.status] || HelpCircle;
  const catLabel = CATEGORIES.find(c => c.value === vendor.category)?.label || vendor.category;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const price = parseNumber(vendor.price);
  const addCharges = parseNumber(vendor.additionalCharges);
  const effectivePrice = price + addCharges;
  const capacity = parseNumber(vendor.guestCapacity);
  const perGuest = (capacity > 0 && price > 0) ? Math.round(price / capacity) : null;

  return (
    <>
      <Card className="group hover:border-sage-200 transition-all duration-150 flex flex-col justify-between">
        <div>
          {vendor._demo && (
            <div className="text-[10px] text-charcoal-400 bg-ivory-100 rounded-full px-2 py-0.5 inline-block mb-2 border border-ivory-200">SAMPLE DATA</div>
          )}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-charcoal-900 truncate">{vendor.name}</h3>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
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

          {price > 0 && (
            <div className="mb-2.5 p-2 bg-ivory-50 rounded-lg border border-ivory-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-charcoal-500">Base Quote:</span>
                <span className="font-bold text-charcoal-900">{formatINR(price)}</span>
              </div>
              {addCharges > 0 && (
                <div className="flex items-center justify-between text-[11px] text-charcoal-500 mt-0.5">
                  <span>Additional charges:</span>
                  <span>+{formatINR(addCharges)}</span>
                </div>
              )}
              {addCharges > 0 && (
                <div className="flex items-center justify-between text-xs font-semibold text-sage-800 border-t border-ivory-200 pt-1 mt-1">
                  <span>Effective Total:</span>
                  <span>{formatINR(effectivePrice)}</span>
                </div>
              )}
              {perGuest && (
                <div className="text-[11px] text-sage-700 font-medium mt-1">
                  ~{formatINR(perGuest)} per guest ({capacity} pax)
                </div>
              )}
            </div>
          )}

          {vendor.servicesIncluded && (
            <div className="mb-2">
              <p className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider mb-0.5">Inclusions</p>
              <p className="text-xs text-charcoal-700 line-clamp-2 bg-white/60 p-1.5 rounded border border-ivory-100">
                {vendor.servicesIncluded}
              </p>
            </div>
          )}

          {vendor.missingDetails && vendor.missingDetails.length > 0 && (
            <div className="mb-2 p-2 bg-amber-50/70 border border-amber-200 rounded-lg">
              <p className="text-[10px] font-bold text-amber-800 flex items-center gap-1 mb-0.5">
                <AlertTriangle size={10} /> Clarify before booking:
              </p>
              <ul className="text-[10px] text-amber-900 list-disc list-inside space-y-0.5">
                {vendor.missingDetails.slice(0, 2).map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-ivory-100 pt-2 mt-2">
          {vendor.contact && (
            <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mb-1">
              <Phone size={12} aria-hidden="true" />
              <span className="truncate">{vendor.contact}</span>
            </div>
          )}
          {vendor.notes && (
            <p className="text-[11px] text-charcoal-400 line-clamp-1 italic">{vendor.notes}</p>
          )}
        </div>
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
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${viewMode === 'cards' ? 'bg-sage-500 text-white shadow-subtle' : 'text-charcoal-600 hover:text-charcoal-900'}`}
              >
                Cards View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compare')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 cursor-pointer ${viewMode === 'compare' ? 'bg-sage-500 text-white shadow-subtle' : 'text-charcoal-600 hover:text-charcoal-900'}`}
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

      {/* Disclaimers & Transparency banner */}
      <div className="p-3 bg-ivory-100/80 border border-ivory-200 rounded-xl text-xs text-charcoal-600 mb-5 flex items-start gap-2">
        <Info size={14} className="text-sage-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          <strong>Vendor Comparison Guide:</strong> Quotations and service inclusions are entered manually by you for comparison purposes. Gatherly AI does not verify real-time prices or endorse businesses. Clarify any missing details before paying booking advances.
        </span>
      </div>

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
                      {group.count} quote{group.count !== 1 ? 's' : ''} ({group.pricedCount} priced)
                      {group.totalMissingClarifications > 0 && (
                        <span className="text-amber-700 font-medium ml-2">· {group.totalMissingClarifications} clarification items</span>
                      )}
                    </p>
                  </div>
                  {group.pricedCount > 1 && (
                    <div className="flex items-center gap-4 text-xs flex-wrap">
                      <div>
                        <span className="text-charcoal-400">Lowest Quote: </span>
                        <strong className="text-sage-600">{formatINR(group.minPrice)}</strong>
                      </div>
                      <div>
                        <span className="text-charcoal-400">Highest: </span>
                        <strong className="text-charcoal-700">{formatINR(group.maxPrice)}</strong>
                      </div>
                      {group.minPerGuest && (
                        <div>
                          <span className="text-charcoal-400">Lowest Per-Guest: </span>
                          <strong className="text-sage-700">{formatINR(group.minPerGuest)}</strong>
                        </div>
                      )}
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
                      <tr className="border-b border-ivory-200 text-xs text-charcoal-500 bg-ivory-50/50">
                        <th className="py-2.5 px-3 font-semibold">Vendor Name</th>
                        <th className="py-2.5 px-3 font-semibold">Base Price</th>
                        <th className="py-2.5 px-3 font-semibold">Additional Charges</th>
                        <th className="py-2.5 px-3 font-semibold">Effective Total</th>
                        <th className="py-2.5 px-3 font-semibold">Capacity / Per Guest</th>
                        <th className="py-2.5 px-3 font-semibold">Inclusions & Clarifications</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ivory-100">
                      {group.items.map(v => {
                        const isLowest = group.pricedCount > 1 && v.price === group.minPrice && group.minPrice > 0;
                        const eventName = state.events.find(e => e.id === v.eventId)?.name || 'General';
                        return (
                          <tr key={v.id} className="hover:bg-ivory-50/70 transition-colors">
                            <td className="py-3 px-3 font-medium text-charcoal-900">
                              <div>{v.name}</div>
                              {v._demo && <span className="text-[9px] px-1.5 py-0.2 rounded bg-ivory-200 text-charcoal-500 font-normal">DEMO</span>}
                              <div className="text-[11px] text-charcoal-400 font-normal">{v.contact || 'No contact'}</div>
                            </td>
                            <td className="py-3 px-3 font-semibold text-charcoal-800">
                              {v.price > 0 ? (
                                <div className="flex items-center gap-1">
                                  <span>{formatINR(v.price)}</span>
                                  {isLowest && <Badge variant="green" className="text-[9px]">Lowest</Badge>}
                                </div>
                              ) : (
                                <span className="text-charcoal-400 italic text-xs">Unspecified</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-xs text-charcoal-600">
                              {v.additionalCharges > 0 ? `+${formatINR(v.additionalCharges)}` : 'None / included'}
                            </td>
                            <td className="py-3 px-3 font-bold text-sage-800">
                              {v.effectivePrice > 0 ? formatINR(v.effectivePrice) : '—'}
                            </td>
                            <td className="py-3 px-3 text-xs text-charcoal-700">
                              {v.guestCapacity > 0 ? (
                                <div>
                                  <span>{v.guestCapacity} pax</span>
                                  {v.pricePerGuest && (
                                    <span className="block text-[11px] text-charcoal-500">~{formatINR(v.pricePerGuest)}/head</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-charcoal-400 italic">Not set</span>
                              )}
                            </td>
                            <td className="py-3 px-3 max-w-xs">
                              {v.servicesIncluded ? (
                                <p className="text-xs text-charcoal-700 line-clamp-2">{v.servicesIncluded}</p>
                              ) : (
                                <span className="text-xs text-charcoal-400 italic">No inclusions listed</span>
                              )}
                              {v.missingDetails && v.missingDetails.length > 0 && (
                                <div className="mt-1">
                                  <span className="inline-block text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    Clarify: {v.missingDetails[0]}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <Badge variant={STATUS_COLORS[v.status]}>{v.status}</Badge>
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <button
                                onClick={() => { setEditVendor(v); setModalOpen(true); }}
                                className="text-xs text-sage-600 hover:text-sage-800 font-medium mr-2 cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => dispatch({ type: 'DELETE_VENDOR', payload: v.id })}
                                className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
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
