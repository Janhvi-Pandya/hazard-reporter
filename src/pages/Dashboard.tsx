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

function categoryLabel(c: string) {
  return c.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function teamLabel(t: string) {
  return t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

type SortOption = 'newest' | 'oldest' | 'severity'
const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 }

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

  function clearFilters() {
    setStatusFilter('')
    setSeverityFilter('')
    setCategoryFilter('')
    setSearchQuery('')
  }

  return (
    <div className="px-6 md:px-8 py-8 max-w-7xl mx-auto space-y-10">
      {/* Summary Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading && !stats ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="liquid-glass p-8 rounded-xl ghost-border animate-pulse">
              <div className="h-3 w-24 bg-surface-container-highest rounded mb-4" />
              <div className="h-10 w-20 bg-surface-container-highest rounded" />
            </div>
          ))
        ) : stats ? (
          <>
            <div className="liquid-glass p-8 rounded-xl border-l-4 border-primary relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 blur-3xl rounded-full transition-transform group-hover:scale-150" />
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 font-label">Total Reports</p>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">{stats.total}</span>
              </div>
            </div>
            <div className="liquid-glass p-8 rounded-xl border-l-4 border-on-tertiary-container relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-on-tertiary-container/10 blur-3xl rounded-full transition-transform group-hover:scale-150" />
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 font-label">Critical / High</p>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">{criticalHighActive}</span>
                <span className="text-on-tertiary-container text-xs font-semibold mb-1">Active</span>
              </div>
            </div>
            <div className="liquid-glass p-8 rounded-xl border-l-4 border-blue-400 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full transition-transform group-hover:scale-150" />
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 font-label">Avg Resolution</p>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">
                  {stats.avg_resolution_time_hours != null ? stats.avg_resolution_time_hours.toFixed(1) : 'N/A'}
                </span>
                {stats.avg_resolution_time_hours != null && <span className="text-slate-400 text-xs font-semibold mb-1">Hours</span>}
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

      {/* Filters */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1 font-label">Status</span>
          <button onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${!statusFilter ? 'bg-primary/20 text-primary border-primary/30' : 'border-outline-variant/20 text-slate-400 hover:bg-surface-container-high'}`}>
            All
          </button>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${statusFilter === s ? 'bg-primary/20 text-primary border-primary/30' : 'border-outline-variant/20 text-slate-400 hover:bg-surface-container-high'}`}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1 font-label">Severity</span>
          <button onClick={() => setSeverityFilter('')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${!severityFilter ? 'bg-primary/20 text-primary border-primary/30' : 'border-outline-variant/20 text-slate-400 hover:bg-surface-container-high'}`}>
            All
          </button>
          {SEVERITIES.map(s => {
            const badge = SEVERITY_BADGE[s]
            return (
              <button key={s} onClick={() => setSeverityFilter(severityFilter === s ? '' : s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${severityFilter === s ? `${badge.bg} ${badge.text} border-current` : 'border-outline-variant/20 text-slate-400 hover:bg-surface-container-high'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search incidents..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-full bg-surface-container-highest/50 border-none text-on-surface focus:ring-1 focus:ring-primary/50 placeholder:text-slate-600 outline-none" />
          </div>
          <div className="relative">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-xs rounded-full bg-surface-container-high border-none text-on-surface-variant cursor-pointer focus:ring-1 focus:ring-primary/50 outline-none">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)}
              className="appearance-none pl-9 pr-8 py-2 text-xs rounded-full bg-surface-container-high border-none text-on-surface-variant cursor-pointer focus:ring-1 focus:ring-primary/50 outline-none">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="severity">Severity (High→Low)</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-on-primary bg-primary rounded-full">{activeFilterCount}</span>
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 transition-colors">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Incident Queue */}
      <section>
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
                <Link key={incident.id} to={`/incidents/${incident.id}`}
                  className="liquid-glass p-6 rounded-xl hover:scale-[1.005] transition-all duration-300 group cursor-pointer border border-white/5 block">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex gap-4 sm:gap-6 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-xl ${sev.iconBg} flex items-center justify-center shrink-0`}>
                        <span className={`text-lg font-bold ${sev.text}`}>
                          {incident.severity.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className={`text-[10px] ${sev.bg} ${sev.text} px-2 py-0.5 rounded uppercase font-bold tracking-widest`}>
                            {incident.severity}
                          </span>
                          <span className={`text-[10px] ${STATUS_BADGE[incident.status]} px-2 py-0.5 rounded uppercase font-bold tracking-widest`}>
                            {STATUS_LABELS[incident.status]}
                          </span>
                          <span className="text-xs text-slate-500 font-label">ID: {incident.id}</span>
                        </div>
                        <h3 className="font-bold text-blue-100 mb-1 truncate">{incident.title}</h3>
                        <p className="text-sm text-slate-400 line-clamp-1">
                          {incident.location} {incident.assigned_team ? `• ${teamLabel(incident.assigned_team)}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs px-5 py-2 rounded-full border border-primary/20 transition-all group-hover:scale-105 inline-block">
                        View
                      </span>
                      <p className="text-[10px] text-slate-500 mt-2">{relativeTime(incident.created_at)}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
