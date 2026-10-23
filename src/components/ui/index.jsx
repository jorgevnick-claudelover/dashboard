// Primitivas de UI sobrias, al estilo shadcn/ui (sin dependencias extra).
const cx = (...parts) => parts.filter(Boolean).join(' ')

const BUTTON_STYLES = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-900',
  outline: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 focus-visible:outline-slate-500',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-500',
  danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50 focus-visible:outline-red-600',
}

export function Button({ variant = 'outline', size = 'md', className, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm',
        BUTTON_STYLES[variant],
        className,
      )}
    />
  )
}

export function Card({ className, ...props }) {
  return <section {...props} className={cx('rounded-lg border border-slate-200 bg-white shadow-sm', className)} />
}

const BADGE_STYLES = {
  neutral: 'bg-slate-100 text-slate-700',
  warn: 'bg-amber-100 text-amber-900',
  danger: 'bg-red-100 text-red-800',
}
export function Badge({ tone = 'neutral', className, ...props }) {
  return (
    <span {...props} className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', BADGE_STYLES[tone], className)} />
  )
}

export function Alert({ tone = 'warn', className, children }) {
  const styles = {
    warn: 'border-amber-300 bg-amber-50 text-amber-950',
    danger: 'border-red-300 bg-red-50 text-red-900',
    info: 'border-slate-300 bg-slate-50 text-slate-800',
  }
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cx('rounded-md border px-4 py-3 text-sm', styles[tone], className)}>
      {children}
    </div>
  )
}

const FIELD = 'h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900'
export function Select({ className, ...props }) {
  return <select {...props} className={cx(FIELD, className)} />
}
export function Input({ className, ...props }) {
  return <input {...props} className={cx(FIELD, className)} />
}
