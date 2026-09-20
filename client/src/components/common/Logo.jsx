import React from 'react'

export function Logo({ size = 'md', showText = true, isDark = false }) {
  const sizeMap = {
    sm: { icon: 'w-6 h-6', text: 'text-lg', sub: 'text-[10px]' },
    md: { icon: 'w-8 h-8', text: 'text-xl', sub: 'text-xs' },
    lg: { icon: 'w-10 h-10', text: 'text-2xl', sub: 'text-sm' }
  }

  const s = sizeMap[size] || sizeMap.md

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className={`${s.icon} rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-md shadow-blue-500/20 text-white flex-shrink-0`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4/6 h-4/6"
        >
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-black tracking-tight ${s.text} ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Fin<span className="text-secondary font-extrabold">Track</span>
          </span>
          <span className={`${s.sub} font-medium tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-400'} mt-0.5`}>
            AI Finance
          </span>
        </div>
      )}
    </div>
  )
}

export default Logo
