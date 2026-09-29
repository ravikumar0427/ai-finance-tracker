import React from 'react'
import { useSelector } from 'react-redux'
import Logo from '../common/Logo'

function Navbar({ onToggleSidebar }) {
  const { user } = useSelector((state) => state.auth)

  const getInitials = (name = '') => {
    return (
      name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U'
    )
  }

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md shadow-xs">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left Section: Mobile Hamburger Toggle + Mobile Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="md:hidden">
            <Logo size="sm" />
          </div>

          <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1 text-xs font-medium text-slate-600">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{todayStr}</span>
          </div>
        </div>

        {/* Right Section: User Profile Badge */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-3 rounded-full border border-slate-200/80 bg-slate-50/50 py-1 pl-3 pr-1.5 transition-all hover:bg-slate-100/60">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 leading-tight">{user.name}</span>
                <span className="text-[10px] text-slate-400 font-medium leading-tight">{user.email}</span>
              </div>
              <div className="relative flex h-8 w-8 select-none items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm ring-2 ring-white">
                {getInitials(user.name)}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar