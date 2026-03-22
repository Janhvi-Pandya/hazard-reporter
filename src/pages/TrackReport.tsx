import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  Loader2,
  AlertCircle,
  MapPin,
  Calendar,
  Clock,
  Shield,
  Tag,
  Users,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { trackReport } from '../api'
import type { Incident, Severity, Status, StatusUpdate } from '../types'

interface Stage { key: string; label: string }

const STAGES: Stage[] = [
  { key: 'reported', label: 'Reported' },
  { key: 'acknowledged', label: 'Acknowledged' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
]

function stageIndex(status: Status): number {
  const map: Record<Status, number> = {
    reported: 0, acknowledged: 1, dispatched: 2, in_progress: 3, resolved: 4, closed: 5,
  }
  return map[status] ?? 0
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const severityConfig: Record<Severity, { bg: string; text: string; label: string; dot: string }> = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Critical', dot: 'bg-red-500' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'High', dot: 'bg-orange-500' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Medium', dot: 'bg-amber-500' },
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Low', dot: 'bg-emerald-500' },
}

function formatCategory(cat: string): string {
  return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function teamLabel(t: string): string {
  return t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function ProgressPipeline({ status }: { status: Status }) {
  const current = stageIndex(status)

  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden sm:flex items-center">
        {STAGES.map((stage, i) => {
          const isPast = i < current
          const isCurrent = i === current
          return (
            <div key={stage.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                  isPast ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isCurrent ? 'bg-primary border-primary text-on-primary ring-4 ring-primary/20'
                    : 'bg-surface-container-highest border-outline-variant/30 text-slate-500'
                }`}>
                  {isPast ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-3 h-3" fill={isCurrent ? 'currentColor' : 'none'} />}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${
                  isPast ? 'text-emerald-400' : isCurrent ? 'text-primary font-semibold' : 'text-slate-500'
                }`}>{stage.label}</span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mt-[-1.25rem] ${
                  i < current ? 'bg-emerald-500' : i === current ? 'bg-primary/40' : 'bg-outline-variant/20'
                }`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile */}
      <div className="sm:hidden space-y-3">
        {STAGES.map((stage, i) => {
          const isPast = i < current
          const isCurrent = i === current
          return (
            <div key={stage.key} className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full border-2 shrink-0 ${
                isPast ? 'bg-emerald-500 border-emerald-500 text-white'
                  : isCurrent ? 'bg-primary border-primary text-on-primary ring-4 ring-primary/20'
                  : 'bg-surface-container-highest border-outline-variant/30 text-slate-500'
              }`}>
                {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-2.5 h-2.5" fill={isCurrent ? 'currentColor' : 'none'} />}
              </div>
              <span className={`text-sm ${isPast ? 'text-emerald-400' : isCurrent ? 'text-primary font-semibold' : 'text-slate-500'}`}>
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div>
        <p className="text-[10px] font-label font-bold text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="mt-0.5 text-sm text-on-surface">{value}</p>
      </div>
    </div>
  )
}

export default function TrackReport() {
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState('')
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const search = useCallback(async (trackingCode: string) => {
    const trimmed = trackingCode.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    setIncident(null)
    setSearched(true)
    try {
      const result = await trackReport(trimmed)
      setIncident(result)
    } catch {
      setError('No report found with that tracking code. Please check your code and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const urlCode = searchParams.get('code')
    if (urlCode) {
      setCode(urlCode)
      search(urlCode)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    search(code)
  }

  const sev = incident ? severityConfig[incident.severity] : null

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-on-surface font-headline">Track Your Report</h1>
        <p className="mt-3 text-on-surface-variant text-lg">
          Enter the tracking code you received when you submitted your report.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-10">
        <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
          placeholder="Enter tracking code or incident ID (e.g., TRK-X8Y2Z1A3 or HZ-23EA54)"
          className="flex-1 rounded-xl bg-surface-container-highest/50 border border-outline-variant/20 px-5 py-3.5 text-base text-on-surface placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/30 transition-all" />
        <button type="submit" disabled={loading || !code.trim()}
          className="inline-flex items-center gap-2 rounded-xl cta-gradient px-6 py-3.5 text-sm font-bold text-on-primary shadow-lg shadow-primary/10 hover:brightness-110 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          <span className="hidden sm:inline">Search</span>
        </button>
      </form>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-on-surface-variant">Looking up your report...</p>
        </div>
      )}

      {!loading && error && searched && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-400">Report not found</p>
            <p className="mt-1 text-sm text-red-400/80">{error}</p>
          </div>
        </div>
      )}

      {!loading && incident && (
        <div className="rounded-[2rem] liquid-glass ghost-border shadow-2xl overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="px-6 py-5 border-b border-outline-variant/10 bg-surface-container-high/30">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-label font-bold text-slate-500 uppercase tracking-widest">Incident {incident.id}</p>
                <h2 className="mt-1 text-xl font-bold text-on-surface font-headline">{incident.title}</h2>
              </div>
              {sev && (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${sev.bg} ${sev.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                  {sev.label} Severity
                </span>
              )}
            </div>
          </div>

          {/* Progress Pipeline */}
          <div className="px-6 py-6 border-b border-outline-variant/10">
            <p className="text-[10px] font-label font-bold text-slate-500 uppercase tracking-widest mb-4">Status Pipeline</p>
            <ProgressPipeline status={incident.status} />
          </div>

          {/* Description */}
          {incident.description && (
            <div className="px-6 py-5 border-b border-outline-variant/10">
              <p className="text-[10px] font-label font-bold text-slate-500 uppercase tracking-widest mb-3">Description</p>
              <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{incident.description}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 border-b border-outline-variant/10">
            <DetailItem icon={<Tag className="w-4 h-4" />} label="Category" value={formatCategory(incident.category)} />
            <DetailItem icon={<MapPin className="w-4 h-4" />} label="Location"
              value={[incident.location, incident.location_detail].filter(Boolean).join(' — ')} />
            <DetailItem icon={<Users className="w-4 h-4" />} label="Assigned Team"
              value={incident.assigned_team ? teamLabel(incident.assigned_team) : 'Pending assignment'} />
            <DetailItem icon={<Calendar className="w-4 h-4" />} label="Reported" value={formatDate(incident.created_at)} />
            <DetailItem icon={<Clock className="w-4 h-4" />} label="Last Updated" value={formatDate(incident.updated_at)} />
            {incident.tracking_code && (
              <DetailItem icon={<Shield className="w-4 h-4" />} label="Tracking Code" value={incident.tracking_code} />
            )}
          </div>

          {/* Status Timeline */}
          {incident.status_updates && (incident.status_updates as StatusUpdate[]).length > 0 && (
            <div className="px-6 py-5">
              <p className="text-[10px] font-label font-bold text-slate-500 uppercase tracking-widest mb-4">Status Timeline</p>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-outline-variant/20" />
                <div className="space-y-6">
                  {[...(incident.status_updates as StatusUpdate[])].reverse().map((update, idx) => {
                    const statusKey = (update.new_status || 'reported') as Status
                    const isPast = idx > 0
                    return (
                      <div key={idx} className="relative pl-9">
                        <div className={`absolute left-[7px] top-1.5 w-2.5 h-2.5 rounded-full ${
                          idx === 0 ? 'bg-primary ring-4 ring-primary/20' : 'bg-emerald-500'
                        }`} />
                        <div className="flex justify-between flex-wrap gap-2">
                          <div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                              idx === 0 ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {statusKey.replace(/_/g, ' ')}
                            </span>
                            {update.note && <p className="text-sm text-on-surface-variant mt-1.5">{update.note}</p>}
                          </div>
                          <span className="text-xs text-slate-500">{formatDate(update.created_at)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
