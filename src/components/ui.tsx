import { useId } from 'react';

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  uppercase,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  uppercase?: boolean;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </label>
      <input
        id={id}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border bg-white/70 px-3.5 py-2.5 text-[0.95rem] text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-navy focus:bg-white focus:ring-4 focus:ring-navy/10 ${
          error ? 'border-crimson/60 ring-4 ring-crimson/10' : 'border-line'
        } ${uppercase ? 'font-mono tracking-wide' : ''}`}
      />
      {error ? (
        <span className="text-xs font-medium text-crimson">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-soft/70">{hint}</span>
      ) : null}
    </div>
  );
}

export function MoneyField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </label>
      <div className="group relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-soft/60">
          ₹
        </span>
        <input
          id={id}
          inputMode="numeric"
          value={value ? value.toLocaleString('en-IN') : ''}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/[^0-9]/g, ''));
            onChange(isNaN(n) ? 0 : n);
          }}
          placeholder="0"
          className="w-full rounded-lg border border-line bg-white/70 py-2.5 pl-8 pr-3.5 text-right font-mono text-[0.95rem] tabular-nums text-ink outline-none transition-all placeholder:text-ink-soft/30 focus:border-navy focus:bg-white focus:ring-4 focus:ring-navy/10"
        />
      </div>
      {hint ? <span className="text-xs text-ink-soft/70">{hint}</span> : null}
    </div>
  );
}
