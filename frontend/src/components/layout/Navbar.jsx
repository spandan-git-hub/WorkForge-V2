import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Sparkles, User, LogOut, Menu, ChevronDown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'


export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setDropdownOpen(false)
    logout()
    navigate('/login')
  }

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Skills', path: '/skills' },
    { name: 'AI Insights', path: '/ai-insights' },
    { name: 'Events', path: '/events' },
  ]

  // Avatar initials or avatar image
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'U'

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/70 bg-surface/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-card transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                WorkForge
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-primary-dark">
                Career AI
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop navigation links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-white bg-surface-card shadow-sm border border-border/80'
                    : 'text-text-muted hover:text-text hover:bg-surface-hover/60'
                }`}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>

        {/* Right: User Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-surface-card border border-transparent hover:border-border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-expanded={dropdownOpen}
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover border border-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-primary/40 flex items-center justify-center text-xs font-semibold text-indigo-300">
                {initials}
              </div>
            )}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-text truncate max-w-[120px]">
                {user?.name || 'Developer'}
              </span>
              <span className="text-[11px] text-text-muted truncate max-w-[120px]">
                {user?.target_role || 'Software Engineer'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-card border border-border shadow-card py-1.5 z-40 animate-scale-in">
              <div className="px-3.5 py-2.5 border-b border-border/60">
                <p className="text-xs font-semibold text-text truncate">{user?.name}</p>
                <p className="text-[11px] text-text-muted truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
                >
                  <User className="w-4 h-4 text-primary" />
                  <span>My Profile</span>
                </Link>
              </div>

              <div className="border-t border-border/60 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
