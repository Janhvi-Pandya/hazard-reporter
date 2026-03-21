import { useState } from 'react'
import { Routes, Route, NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  AlertTriangle,
  Search,
  Menu,
  X,
  Bell,
  UserCircle,
  HelpCircle,
  FileWarning,
  LogOut,
  LogIn,
  User,
  Map,
  FileText,
  BookOpen,
} from 'lucide-react'
import { useAuth } from './context/AuthContext'
import SubmitReport from './pages/SubmitReport'
import Dashboard from './pages/Dashboard'
import IncidentDetail from './pages/IncidentDetail'
import TrackReport from './pages/TrackReport'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'

const sidebarLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/', label: 'Report Hazard', icon: FileWarning, end: true },
  { to: '/track', label: 'Track Report', icon: Search },
] as const

const topNavLinks = [
  { to: '/dashboard', label: 'Live Map', icon: Map, end: false, query: '?view=map' },
  { to: '/dashboard', label: 'Reports', icon: FileText, end: false, query: '' },
  { to: '/track', label: 'Resources', icon: BookOpen, end: false, query: '' },
] as const

function Sidebar() {
  const location = useLocation()
  const { user } = useAuth()

  const isActive = (to: string, end?: boolean) => {
    if (end) return location.pathname === to
    return location.pathname.startsWith(to)
  }

  return (
    <aside className="hidden md:flex h-screen w-20 hover:w-64 transition-all duration-300 fixed left-0 top-0 z-50 bg-slate-900/80 backdrop-blur-xl flex-col py-6 shadow-2xl shadow-slate-950/50 group border-r border-outline-variant/10 overflow-hidden">
      {/* Logo */}
      <div className="px-6 mb-10 flex items-center gap-4 overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-on-primary-container flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-on-primary" />
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          <p className="text-xl font-bold tracking-tighter text-blue-200 font-headline">Hazard Reporter</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Incident Management</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-2 px-3">
        {sidebarLinks.map(({ to, label, icon: Icon, end }) => {
          const active = isActive(to, end)
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-blue-500/20 text-blue-200 border-l-4 border-blue-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-4 border-transparent'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-semibold text-sm font-headline">
                {label}
              </span>
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="mt-auto space-y-2 px-3 border-t border-slate-800/40 pt-6">
        {/* User Profile */}
        {user && (
          <Link
            to="/profile"
            className="flex items-center gap-4 p-3 rounded-xl text-slate-400 hover:text-blue-200 hover:bg-slate-800/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-primary">
                  {(user.full_name || user.username).charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">
              <p className="text-sm font-semibold text-slate-200 truncate">{user.full_name || user.username}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
            </div>
          </Link>
        )}

        <a href="#" className="flex items-center gap-4 p-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
          <HelpCircle className="w-5 h-5 shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium text-sm">Support</span>
        </a>
      </div>
    </aside>
  )
}

function TopBar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const isActive = (to: string, end?: boolean) => {
    if (end) return location.pathname === to
    return location.pathname.startsWith(to)
  }

  const isTopNavActive = (to: string, query: string) => {
    if (query) {
      return location.pathname === to && location.search === query
    }
    return location.pathname.startsWith(to)
  }

  return (
    <>
      <header className="fixed top-0 w-full md:left-20 md:w-[calc(100%-5rem)] z-40 bg-slate-900/70 backdrop-blur-md flex justify-between items-center px-6 md:px-8 h-16">
        <div className="flex items-center gap-6">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-blue-200 hover:bg-slate-800/50 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="text-lg font-black tracking-widest text-blue-100 uppercase font-headline">Hazard Reporter</span>

          {/* Top navigation links - hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {topNavLinks.map(({ to, label, query }) => {
              const active = isTopNavActive(to, query)
              return (
                <Link
                  key={label}
                  to={`${to}${query}`}
                  className={`px-4 py-1.5 text-sm font-semibold transition-all ${
                    active
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="bg-on-tertiary-container text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all active:scale-95 hidden sm:block"
          >
            Emergency Alert
          </Link>
          <div className="flex items-center gap-3 border-l border-slate-800/50 pl-4">
            <Bell className="w-5 h-5 text-slate-400 cursor-pointer hover:text-blue-200 transition-colors" />
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" className="flex items-center gap-2 hover:text-blue-200 transition-colors">
                  <UserCircle className="w-5 h-5 text-slate-400 hover:text-blue-200" />
                  <span className="text-xs text-slate-400 hidden lg:block">{user.full_name || user.username}</span>
                </Link>
                <button
                  onClick={() => { logout(); navigate('/login') }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-1.5 text-slate-400 hover:text-blue-200 transition-colors">
                <LogIn className="w-5 h-5" />
                <span className="text-xs hidden lg:block">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)}>
          <div className="w-72 h-full bg-slate-900 p-6 space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-on-primary-container flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-on-primary" />
              </div>
              <p className="text-xl font-bold tracking-tighter text-blue-200 font-headline">Hazard Reporter</p>
            </div>
            {sidebarLinks.map(({ to, label, icon: Icon, end }) => {
              const active = isActive(to, end)
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-blue-500/20 text-blue-200 border-l-4 border-blue-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-4 border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold text-sm font-headline">{label}</span>
                </NavLink>
              )
            })}
            <div className="border-t border-slate-800/40 pt-4 mt-4">
              {user ? (
                <>
                  <NavLink to="/profile" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-4 p-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
                    <User className="w-5 h-5" />
                    <span className="font-semibold text-sm font-headline">Profile</span>
                  </NavLink>
                  <button onClick={() => { logout(); navigate('/login'); setMobileOpen(false) }}
                    className="flex items-center gap-4 p-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full">
                    <LogOut className="w-5 h-5" />
                    <span className="font-semibold text-sm font-headline">Sign Out</span>
                  </button>
                </>
              ) : (
                <NavLink to="/login" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-4 p-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
                  <LogIn className="w-5 h-5" />
                  <span className="font-semibold text-sm font-headline">Sign In</span>
                </NavLink>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar />
      <TopBar />
      <main className="md:ml-20 pt-16 min-h-screen">
        <Routes>
          <Route path="/" element={<SubmitReport />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/incidents/:id" element={<IncidentDetail />} />
          <Route path="/track" element={<TrackReport />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  )
}
