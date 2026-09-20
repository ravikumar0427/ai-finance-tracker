import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

function Layout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const toggleMobileSidebar = () => {
    setIsMobileOpen((prev) => !prev)
  }

  const closeMobileSidebar = () => {
    setIsMobileOpen(false)
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar with Desktop and Mobile Drawer Modes */}
      <Sidebar isOpen={isMobileOpen} onClose={closeMobileSidebar} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Responsive Navbar with Hamburger Toggle */}
        <Navbar onToggleSidebar={toggleMobileSidebar} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout