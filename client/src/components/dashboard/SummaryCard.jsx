import React from 'react'

const TONE_CONFIG = {
  slate: {
    border: 'border-slate-200/80 hover:border-slate-300',
    iconBg: 'bg-indigo-50 text-indigo-600',
    badgeBg: 'bg-slate-100 text-slate-700',
    glow: 'group-hover:shadow-indigo-500/10',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  green: {
    border: 'border-emerald-200/80 hover:border-emerald-300',
    iconBg: 'bg-emerald-50 text-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-700',
    glow: 'group-hover:shadow-emerald-500/10',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
      </svg>
    )
  },
  red: {
    border: 'border-rose-200/80 hover:border-rose-300',
    iconBg: 'bg-rose-50 text-rose-600',
    badgeBg: 'bg-rose-50 text-rose-700',
    glow: 'group-hover:shadow-rose-500/10',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
      </svg>
    )
  },
  blue: {
    border: 'border-blue-200/80 hover:border-blue-300',
    iconBg: 'bg-blue-50 text-blue-600',
    badgeBg: 'bg-blue-50 text-blue-700',
    glow: 'group-hover:shadow-blue-500/10',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  }
}

function SummaryCard({ label, value, tone = 'slate' }) {
  const config = TONE_CONFIG[tone] || TONE_CONFIG.slate

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${config.border} ${config.glow}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${config.iconBg}`}>
          {config.icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
      </div>
    </div>
  )
}

export default SummaryCard
