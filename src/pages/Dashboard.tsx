import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  X,
  ChevronDown,
  ArrowUpDown,
  Loader2,
  Map,
  Brain,
  MapPin,
  Users,
  AlertTriangle,
  BarChart3,
  Send,
  FileText,
  Sparkles,
} from 'lucide-react'
import { getIncidents, getIncidentStats } from '../api'
import type { IncidentFilters } from '../api'
import type { Incident, IncidentStats, Status, Severity, Category } from '../types'
import AIInsights from '../components/AIInsights'
import IncidentMap from '../components/IncidentMap'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

const STATUSES: Status[] = ['reported', 'acknowledged', 'dispatched', 'in_progress', 'resolved', 'closed']
const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low']
const CATEGORIES: Category[] = [
  'electrical', 'structural', 'fire_safety', 'chemical', 'accessibility',
  'water_damage', 'lighting', 'environmental', 'security', 'other',
]

const STATUS_LABELS: Record<Status, string> = {
  reported: 'Reported', acknowledged: 'Acknowledged', dispatched: 'Dispatched',
  in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
}

const SEVERITY_BADGE: Record<Severity, { bg: string; text: string; iconBg: string }> = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', iconBg: 'bg-red-500/20' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', iconBg: 'bg-orange-500/20' },
  medium: { bg: 'bg-blue-500/10', text: 'text-blue-400', iconBg: 'bg-blue-500/20' },
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', iconBg: 'bg-emerald-500/20' },
}

const STATUS_BADGE: Record<Status, string> = {
  reported: 'bg-blue-500/10 text-blue-300',
  acknowledged: 'bg-purple-500/10 text-purple-300',
  dispatched: 'bg-indigo-500/10 text-indigo-300',
  in_progress: 'bg-amber-500/10 text-amber-300',
  resolved: 'bg-emerald-500/10 text-emerald-300',
  closed: 'bg-slate-500/10 text-slate-400',
}

const SEVERITY_BORDER: Record<Severity, string> = {
  critical: 'border-l-4 border-red-500',
  high: 'border-l-4 border-orange-500',
  medium: 'border-l-4 border-amber-400',
  low: 'border-l-4 border-emerald-500',
}

const SEVERITY_BAR_COLOR: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  low: 'bg-emerald-500',
}

function categoryLabel(c: string) {
  return c.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function teamLabel(t: string) {
  return t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

type SortOption = 'newest' | 'oldest' | 'severity'
const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 }

/* Glass hover card shared classes */
const GLASS_CARD_HOVER = 'transition-all duration-[400ms] cubic-bezier-[0.165,0.84,0.44,1] hover:translate-y-[-2px] hover:bg-opacity-60 hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4)]'

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [stats, setStats] = useState<IncidentStats | null>(null)
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState<string>('')
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')

  const [showMap, setShowMap] = useState(false)
  const [showAI, setShowAI] = useState(true)

  const activeFilterCount = [statusFilter, severityFilter, categoryFilter, searchQuery].filter(Boolean).length

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const filters: IncidentFilters = {}
      if (statusFilter) filters.status = statusFilter
      if (severityFilter) filters.severity = severityFilter
      if (categoryFilter) filters.category = categoryFilter
      if (searchQuery) filters.search = searchQuery
      const [incidentData, statsData] = await Promise.all([getIncidents(filters), getIncidentStats()])
      setIncidents(incidentData)
      setStats(statsData)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, severityFilter, categoryFilter, searchQuery])

  useEffect(() => { fetchData() }, [fetchData])

  const criticalHighActive = useMemo(() => {
    if (!stats) return 0
    return (stats.by_severity.critical ?? 0) + (stats.by_severity.high ?? 0)
  }, [stats])

  const sortedIncidents = useMemo(() => {
    const sorted = [...incidents]
    switch (sort) {
      case 'newest': sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break
      case 'oldest': sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break
      case 'severity': sorted.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]); break
    }
    return sorted
  }, [incidents, sort])

  /* Severity counts for sidebar */
  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 }
    incidents.forEach(inc => { counts[inc.severity] = (counts[inc.severity] || 0) + 1 })
    return counts
  }, [incidents])

  /* Status counts for sidebar */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    incidents.forEach(inc => { counts[inc.status] = (counts[inc.status] || 0) + 1 })
    return counts
  }, [incidents])

  function clearFilters() {
    setStatusFilter('')
    setSeverityFilter('')
    setCategoryFilter('')
    setSearchQuery('')
  }

  /* Severity trend max for bar chart */
  const severityMax = useMemo(() => {
    if (!stats) return 1
    return Math.max(...Object.values(stats.by_severity), 1)
  }, [stats])

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-6 md:px-8 py-8 max-w-7xl mx-auto space-y-10 flex-1 w-full">
        {/* Summary Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading && !stats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="liquid-glass p-8 rounded-xl ghost-border animate-pulse">
                <div className="h-3 w-24 bg-surface-container-highest rounded mb-4" />
                <div className="h-10 w-20 bg-surface-container-highest rounded" />
              </div>
            ))
          ) : stats ? (
            <>
              <div className={`liquid-glass p-8 rounded-xl border-l-4 border-primary relative overflow-hidden group ${GLASS_CARD_HOVER}`}>
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 blur-3xl rounded-full transition-transform group-hover:scale-150" />
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 font-label">Total Reports</p>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">{stats.total}</span>
                </div>
              </div>
              <div className={`liquid-glass p-8 rounded-xl border-l-4 border-on-tertiary-container relative overflow-hidden group ${GLASS_CARD_HOVER}`}>
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-on-tertiary-container/10 blur-3xl rounded-full transition-transform group-hover:scale-150" />
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 font-label">Critical / High</p>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">{criticalHighActive}</span>
                  <span className="text-on-tertiary-container text-xs font-semibold mb-1">Active</span>
                </div>
              </div>
              <div className={`liquid-glass p-8 rounded-xl border-l-4 border-blue-400 relative overflow-hidden group ${GLASS_CARD_HOVER}`}>
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full transition-transform group-hover:scale-150" />
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 font-label">Avg Resolution</p>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">
                    {stats.avg_resolution_time_hours != null ? stats.avg_resolution_time_hours.toFixed(1) : 'N/A'}
                  </span>
                  {stats.avg_resolution_time_hours != null && <span className="text-slate-400 text-xs font-semibold mb-1">Hours</span>}
                </div>
              </div>

              {/* 4th Metric Card: Severity Trend */}
              <div className={`liquid-glass p-8 rounded-xl border-l-4 border-amber-400 relative overflow-hidden group ${GLASS_CARD_HOVER}`}>
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-400/10 blur-3xl rounded-full transition-transform group-hover:scale-150" />
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 font-label">Severity Trend</p>
                <div className="flex items-end gap-2 h-12 mt-2">
                  {SEVERITIES.map(sev => {
                    const count = stats.by_severity[sev] ?? 0
                    const pct = Math.max((count / severityMax) * 100, 8)
                    return (
                      <div key={sev} className="flex flex-col items-center gap-1 flex-1 group/bar">
                        <div className="w-full flex flex-col items-center justify-end h-10">
                          <div
                            className={`w-full max-w-[24px] rounded-t ${SEVERITY_BAR_COLOR[sev]} transition-all duration-500 ease-out group-hover/bar:scale-y-110 group-hover/bar:brightness-125 cursor-pointer`}
                            style={{ height: `${pct}%`, minHeight: '4px' }}
                            title={`${sev}: ${count}`}
                          />
                        </div>
                        <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wide">{sev.charAt(0)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : null}
        </section>

        {/* Toggle Buttons */}
        <div className="flex gap-3">
          <button onClick={() => setShowAI(!showAI)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${showAI ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface-container-high text-slate-400 border border-outline-variant/20 hover:bg-surface-container-highest'}`}>
            <Brain className="w-4 h-4" /> AI Analysis
          </button>
          <button onClick={() => setShowMap(!showMap)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${showMap ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface-container-high text-slate-400 border border-outline-variant/20 hover:bg-surface-container-highest'}`}>
            <Map className="w-4 h-4" /> Incident Map
          </button>
        </div>

        {/* AI Insights Panel */}
        {showAI && !loading && incidents.length > 0 && (
          <AIInsights incidents={incidents} />
        )}

        {/* Incident Map */}
        {showMap && !loading && (
          <div className="liquid-glass rounded-[2rem] ghost-border p-6">
            <h3 className="font-label text-[10px] uppercase tracking-widest text-primary font-bold mb-4">Incident Location Map</h3>
            <IncidentMap incidents={incidents} />
          </div>
        )}

        {/* Main Content: Left Sidebar + Incident List */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Filter Sidebar */}
          <aside className="lg:w-72 shrink-0 lg:sticky lg:top-24 lg:self-start space-y-6">
            {/* Search & Category/Sort */}
            <div className="liquid-glass rounded-2xl ghost-border p-5 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search incidents..."
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-full bg-surface-container-highest/50 border-none text-on-surface focus:ring-1 focus:ring-primary/50 placeholder:text-slate-600 outline-none" />
              </div>
              <div className="relative">
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs rounded-full bg-surface-container-high border-none text-on-surface-variant cursor-pointer focus:ring-1 focus:ring-primary/50 outline-none">
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)}
                  className="w-full appearance-none pl-9 pr-8 py-2 text-xs rounded-full bg-surface-container-high border-none text-on-surface-variant cursor-pointer focus:ring-1 focus:ring-primary/50 outline-none">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="severity">Severity (High-Low)</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 transition-colors w-full justify-center py-1">
                  <X className="w-3.5 h-3.5" /> Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                </button>
              )}
            </div>

            {/* Status Filters */}
            <div className="liquid-glass rounded-2xl ghost-border p-5 space-y-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-label">Status</p>
              <button onClick={() => setStatusFilter('')}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${!statusFilter ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:bg-surface-container-high'}`}>
                All Statuses
              </button>
              {STATUSES.map(s => (
                <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${statusFilter === s ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:bg-surface-container-high'}`}>
                  <span>{STATUS_LABELS[s]}</span>
                  <span className="text-[10px] text-slate-600">{statusCounts[s] ?? 0}</span>
                </button>
              ))}
            </div>

            {/* Severity Filters */}
            <div className="liquid-glass rounded-2xl ghost-border p-5 space-y-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-label">Severity</p>
              <button onClick={() => setSeverityFilter('')}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${!severityFilter ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:bg-surface-container-high'}`}>
                All Severities
              </button>
              {SEVERITIES.map(s => {
                const badge = SEVERITY_BADGE[s]
                return (
                  <button key={s} onClick={() => setSeverityFilter(severityFilter === s ? '' : s)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${severityFilter === s ? `${badge.bg} ${badge.text}` : 'text-slate-400 hover:bg-surface-container-high'}`}>
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${SEVERITY_BAR_COLOR[s]}`} />
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </span>
                    <span className="text-[10px] text-slate-600">{severityCounts[s] ?? 0}</span>
                  </button>
                )
              })}
            </div>

            {/* Operational Insight AI Card */}
            <div className="liquid-glass rounded-2xl ghost-border p-5 space-y-3 border border-primary/10">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest font-label">Operational Insight</p>
              </div>
              {stats && incidents.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {criticalHighActive > 0
                      ? `${criticalHighActive} critical/high severity incidents require immediate attention. `
                      : 'No critical incidents currently active. '}
                    {stats.recent_24h > 0
                      ? `${stats.recent_24h} new reports in the last 24 hours.`
                      : 'No new reports in the last 24 hours.'}
                  </p>
                  {stats.avg_resolution_time_hours != null && (
                    <p className="text-[10px] text-slate-500">
                      Avg resolution: {stats.avg_resolution_time_hours.toFixed(1)}h
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Loading insights...</p>
              )}
            </div>
          </aside>

          {/* Right: Incident Queue */}
          <section className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-headline tracking-tight text-blue-100">Active Incident Queue</h2>
              <span className="text-xs text-slate-500">{sortedIncidents.length} incidents</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sortedIncidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-on-surface font-headline">No incidents found</h3>
                <p className="text-sm text-on-surface-variant mt-1 max-w-sm">
                  {activeFilterCount > 0 ? 'Try adjusting your filters.' : 'No incidents have been reported yet.'}
                </p>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="mt-4 px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-xl hover:bg-primary/10 transition-colors">
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedIncidents.map(incident => {
                  const sev = SEVERITY_BADGE[incident.severity]
                  return (
                    <div
                      key={incident.id}
                      className={`liquid-glass p-6 rounded-xl group cursor-pointer border border-white/5 ${SEVERITY_BORDER[incident.severity]} transition-all duration-[400ms] ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:translate-y-[-2px] hover:bg-opacity-60 hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4)] hover:border-white/10`}
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex gap-4 sm:gap-6 flex-1 min-w-0">
                          {/* Icon box with hover scale + rotate */}
                          <div className={`w-14 h-14 rounded-2xl ${sev.iconBg} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                            <AlertTriangle className={`w-6 h-6 ${sev.text}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                              <span className={`text-[10px] ${sev.bg} ${sev.text} px-2 py-0.5 rounded uppercase font-bold tracking-widest`}>
                                {incident.severity}
                              </span>
                              <span className={`text-[10px] ${STATUS_BADGE[incident.status]} px-2 py-0.5 rounded uppercase font-bold tracking-widest`}>
                                {STATUS_LABELS[incident.status]}
                              </span>
                              <span className="text-xs text-slate-500 font-label">ID: {incident.id}</span>
                              <span className="text-[10px] text-slate-500 ml-auto">{relativeTime(incident.created_at)}</span>
                            </div>
                            <h3 className="font-bold text-blue-100 mb-1 truncate">{incident.title}</h3>
                            {/* Description truncated to 2 lines */}
                            <p className="text-sm text-slate-400 line-clamp-2 mb-2">{incident.description}</p>
                            {/* Location & Team metadata row */}
                            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" />
                                {incident.location}
                              </span>
                              {incident.assigned_team && (
                                <span className="flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5" />
                                  {teamLabel(incident.assigned_team)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Action buttons */}
                        <div className="flex flex-col gap-2 shrink-0 items-end">
                          <Link
                            to={`/incidents/${incident.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-primary/20 hover:bg-primary/30 text-primary font-bold text-xs px-5 py-2 rounded-full border border-primary/20 transition-all group-hover:scale-105 inline-flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" /> Dispatch
                          </Link>
                          <Link
                            to={`/incidents/${incident.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-surface-container-high hover:bg-surface-container-highest text-slate-400 hover:text-slate-200 font-medium text-xs px-5 py-2 rounded-full border border-outline-variant/20 transition-all inline-flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" /> Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-surface-container/80 backdrop-blur-sm border-t border-outline-variant/10 mt-16">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} Keriu Incident Management. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Privacy Policy</a>
              <a href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Terms</a>
              <a href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">System Status</a>
              <a href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
