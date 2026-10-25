import React from 'react';

// ─── Button ───────────────────────────────────────────────────────────────────

export function Button({
  children, onClick, variant = 'primary', size = 'md', disabled = false,
  type = 'button', className = '', ariaLabel, fullWidth = false,
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 disabled:opacity-50 disabled:cursor-not-allowed select-none';
  const variants = {
    primary: 'bg-sage-500 text-white hover:bg-sage-600 active:bg-sage-700 shadow-subtle focus-visible:outline-sage-500',
    secondary: 'bg-ivory-100 text-charcoal-700 hover:bg-ivory-200 border border-ivory-300 active:bg-ivory-300',
    ghost: 'text-charcoal-600 hover:bg-ivory-100 hover:text-charcoal-900 active:bg-ivory-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    gold: 'bg-gold-500 text-white hover:bg-gold-600 active:bg-gold-700 shadow-subtle',
    outline: 'border border-sage-400 text-sage-600 hover:bg-sage-50 active:bg-sage-100',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-charcoal-100 text-charcoal-700',
    sage: 'bg-sage-100 text-sage-700',
    gold: 'bg-gold-100 text-gold-700',
    red: 'bg-red-100 text-red-700',
    green: 'bg-green-100 text-green-700',
    orange: 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({ children, className = '', padding = true }) {
  return (
    <div className={`bg-white rounded-xl shadow-card border border-ivory-200 ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function Input({
  id, label, value, onChange, type = 'text', placeholder, required, error,
  hint, prefix, suffix, className = '', min, max, ...props
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-charcoal-700">
          {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      {hint && <p className="text-xs text-charcoal-400">{hint}</p>}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-charcoal-400 text-sm select-none">{prefix}</span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          aria-required={required}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={error ? 'true' : undefined}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-400
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-sage-400
            ${error ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-ivory-300 hover:border-charcoal-300'}
            ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-7' : ''}
          `}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-charcoal-400 text-sm select-none">{suffix}</span>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600 flex items-center gap-1">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

export function Textarea({ id, label, value, onChange, placeholder, rows = 3, error, hint, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label htmlFor={id} className="text-sm font-medium text-charcoal-700">{label}</label>}
      {hint && <p className="text-xs text-charcoal-400">{hint}</p>}
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-400 resize-y
          focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-sage-400
          ${error ? 'border-red-400' : 'border-ivory-300 hover:border-charcoal-300'}
        `}
      />
      {error && <p role="alert" className="text-xs text-red-600">⚠ {error}</p>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────

export function Select({ id, label, value, onChange, options, required, error, hint, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-charcoal-700">
          {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      {hint && <p className="text-xs text-charcoal-400">{hint}</p>}
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        aria-required={required}
        aria-invalid={error ? 'true' : undefined}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-charcoal-900
          focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-sage-400
          ${error ? 'border-red-400' : 'border-ivory-300 hover:border-charcoal-300'}
        `}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p role="alert" className="text-xs text-red-600">⚠ {error}</p>}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-charcoal-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`relative bg-white rounded-2xl shadow-elevated w-full ${sizes[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-ivory-200">
          <h2 id="modal-title" className="text-lg font-semibold text-charcoal-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-ivory-100 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

export function ProgressBar({ value, max = 100, label, showLabel = true, variant = 'sage', className = '' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const colors = {
    sage: 'bg-sage-500',
    gold: 'bg-gold-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
  };
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {(label || showLabel) && (
        <div className="flex justify-between text-xs text-charcoal-500">
          {label && <span>{label}</span>}
          {showLabel && <span>{pct}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
        className="h-2 bg-ivory-200 rounded-full overflow-hidden"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors[variant]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="text-5xl mb-4 select-none" aria-hidden="true">{icon}</div>}
      <h3 className="text-lg font-semibold text-charcoal-700 mb-2">{title}</h3>
      {description && <p className="text-sm text-charcoal-400 max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

export function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message, confirmLabel = 'Confirm', danger = true }) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <p className="text-sm text-charcoal-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

export function SectionHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal-900">{title}</h1>
        {description && <p className="text-sm text-charcoal-500 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

// ─── Tag ──────────────────────────────────────────────────────────────────────

export function Tag({ children, className = '' }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs bg-ivory-100 text-charcoal-500 border border-ivory-200 ${className}`}>
      {children}
    </span>
  );
}
