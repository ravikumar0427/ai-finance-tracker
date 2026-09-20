import React from 'react'
import { useSelector } from 'react-redux'
import Logo from '../common/Logo'

function Navbar({ onToggleSidebar }) {
  const { user } = useSelector((state) => state.auth)

  const getInitials = (name = '') => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Left Section: Mobile Hamburger Toggle + Mobile Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/50"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="md:hidden">
            <Logo size="sm" />
          </div>
        </div>

        {/* Right Section: User Profile Badge */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-800 leading-tight">
                  {user.name}
                </span>
                <span className="text-xs text-slate-400 font-normal leading-tight">
                  {user.email}
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-blue-100 select-none">
                {getInitials(user.name)}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar