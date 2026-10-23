import { Card } from './ui/index.jsx'

export default function KpiCard({ label, value, hint, children, className = '' }) {
  return (
    <Card className={`print-card p-5 print:p-3 ${className}`}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 print:text-[9px]">{label}</h3>
      <p className="num mt-2 text-3xl font-semibold tracking-tight text-slate-900 print:mt-1 print:text-[22px]">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500 print:text-[10px]">{hint}</p>}
      {children && <div className="mt-3 border-t border-slate-100 pt-2 print:mt-2 print:pt-1.5">{children}</div>}
    </Card>
  )
}
