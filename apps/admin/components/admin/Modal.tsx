'use client';
import { useEffect, type ReactNode } from 'react';
import { IconClose } from './Icon';

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxWidth = size === 'sm' ? 420 : size === 'lg' ? 880 : 600;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface, #fff)',
          borderRadius: 18,
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '1px solid var(--border, #e5e7eb)',
        }}
      >
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border, #e5e7eb)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text, #111)' }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: 13, color: 'var(--text-muted, #6b7280)', marginTop: 2 }}>
                {subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn"
            style={{ width: 36, height: 36 }}
            aria-label="Yopish"
          >
            <IconClose size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {children}
        </div>

        {footer && (
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border, #e5e7eb)',
            background: 'var(--surface-2, #f9fafb)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-secondary, #374151)',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
      }}>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
      </label>
      {children}
      {hint && (
        <div style={{ fontSize: 11, color: 'var(--text-muted, #6b7280)', marginTop: 4 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid var(--border, #e5e7eb)',
        fontSize: 14,
        outline: 'none',
        background: 'var(--surface, #fff)',
        color: 'var(--text, #111)',
      }}
    />
  );
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  min,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  min?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      placeholder={placeholder}
      min={min}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid var(--border, #e5e7eb)',
        fontSize: 14,
        outline: 'none',
        background: 'var(--surface, #fff)',
        color: 'var(--text, #111)',
      }}
    />
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid var(--border, #e5e7eb)',
        fontSize: 14,
        outline: 'none',
        background: 'var(--surface, #fff)',
        color: 'var(--text, #111)',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
