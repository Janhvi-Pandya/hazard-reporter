import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Mail,
  Phone,
  Save,
} from 'lucide-react'
import type { Incident, StatusUpdate, Status, Severity } from '../types'
import { getIncident, updateIncident } from '../api'

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-500' },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10', dot: 'bg-orange-500' },
  medium: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-500' },
  low: { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; dot: string }> = {
  reported: { label: 'Reported', color: 'text-blue-300', bg: 'bg-blue-500/10', dot: 'bg-blue-500' },
  acknowledged: { label: 'Acknowledged', color: 'text-purple-300', bg: 'bg-purple-500/10', dot: 'bg-purple-500' },
  dispatched: { label: 'Dispatched', color: 'text-indigo-300', bg: 'bg-indigo-500/10', dot: 'bg-indigo-500' },
  in_progress: { label: 'In Progress', color: 'text-amber-300', bg: 'bg-amber-500/10', dot: 'bg-amber-500' },
  resolved: { label: 'Resolved', color: 'text-emerald-300', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
  closed: { label: 'Closed', color: 'text-slate-400', bg: 'bg-slate-500/10', dot: 'bg-slate-500' },
}

const ALL_STATUSES: Status[] = ['reported', 'acknowledged', 'dispatched', 'in_progress', 'resolved', 'closed']
const ALL_SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low']

const TEAMS = [
  'electrical_maintenance', 'structural_engineering', 'fire_safety_team', 'hazmat_response',
  'accessibility_services', 'plumbing_maintenance', 'facilities_lighting', 'environmental_health',
  'campus_security', 'general_maintenance',
]

function teamLabel(t: string) {
  return t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formStatus, setFormStatus] = useState<Status>('reported')
  const [formTeam, setFormTeam] = useState('')
  const [formAssignedTo, setFormAssignedTo] = useState('')
  const [formSeverity, setFormSeverity] = useState<Severity>('medium')
  const [formNote, setFormNote] = useState('')
  const [updating, setUpdating] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    getIncident(id)
      .then((data) => {
        const { status_updates, ...inc } = data
        setIncident(inc as Incident)
        setStatusUpdates(status_updates || [])
        setFormStatus(inc.status)
        setFormTeam(inc.assigned_team || '')
        setFormAssignedTo(inc.assigned_to || '')
        setFormSeverity(inc.severity)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleUpdate() {
    if (!id || !incident) return
    setUpdating(true)
    setFeedback(null)
    try {
      const payload: Record<string, unknown> = {
        status: formStatus, severity: formSeverity,
        assigned_team: formTeam, assigned_to: formAssignedTo, note: formNote,
      }
      const data = await updateIncident(id, payload)
      const { status_updates, ...inc } = data
      setIncident(inc as Incident)
      setStatusUpdates(status_updates || [])
      setFormStatus(inc.status)
      setFormTeam(inc.assigned_team || '')
      setFormAssignedTo(inc.assigned_to || '')
      setFormSeverity(inc.severity)
      setFormNote('')
      setFeedback({ type: 'success', message: 'Incident updated successfully.' })
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update incident.' })
    } finally {
      setUpdating(false)
    }
  }

  const selectClasses = "w-full bg-surface-container-highest border-none rounded-xl px-3 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none"
  const inputClasses = "w-full bg-surface-container-highest border-none rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-slate-600 focus:ring-1 focus:ring-primary/40 outline-none"

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !incident) {
    return (
      <div className="px-8 py-16 text-center max-w-7xl mx-auto">
        <AlertTriangle className="w-12 h-12 text-on-tertiary-container mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-on-surface font-headline mb-2">Failed to load incident</h2>
        <p className="text-on-surface-variant mb-6">{error || 'Incident not found.'}</p>
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-primary hover:text-primary-fixed font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    )
  }

  const sevCfg = SEVERITY_CONFIG[incident.severity]
  const statusCfg = STATUS_CONFIG[incident.status] || STATUS_CONFIG.reported
  const isCritical = incident.severity === 'critical' || incident.severity === 'high'

  return (
    <div className="px-6 md:px-8 py-8 max-w-7xl mx-auto">
      {/* Escalation Banner (for critical/high) */}
      {isCritical && (
        <div className="mb-8 p-4 bg-on-tertiary-container/10 ghost-border rounded-xl flex items-center justify-between flex-wrap gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-on-tertiary-container/5 to-transparent" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-on-tertiary-container/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-on-tertiary-container" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-on-tertiary-container uppercase tracking-tight">
                {incident.severity === 'critical' ? 'Critical Severity' : 'High Priority'}
              </h2>
              <p className="text-on-surface-variant text-sm">This incident requires immediate attention.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-10">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-200 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-label uppercase tracking-widest text-on-surface-variant">{incident.id}</span>
          <span className={`flex items-center gap-1.5 ${sevCfg.bg} px-2.5 py-1 rounded-full text-[10px] font-bold ${sevCfg.color} uppercase tracking-widest`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sevCfg.dot}`} />
            {sevCfg.label} Severity
          </span>
          <span className={`${statusCfg.bg} ${statusCfg.color} px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest`}>
            {statusCfg.label}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-surface leading-tight">{incident.title}</h1>
        <p className="text-on-surface-variant flex items-center gap-2 mt-2">
          <MapPin className="w-4 h-4" /> {incident.location}{incident.location_detail ? ` — ${incident.location_detail}` : ''}
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Report Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Description */}
          <div className="bg-surface-container-low rounded-xl p-6 md:p-8 ghost-border">
            <h3 className="font-headline font-semibold text-sm uppercase tracking-wider text-blue-200 mb-4">Incident Description</h3>
            <p className="text-on-surface-variant whitespace-pre-wrap leading-relaxed">{incident.description}</p>
            {incident.photo_url && (
              <div className="mt-6">
                <img src={incident.photo_url} alt="Incident photo" className="w-full max-h-96 object-contain rounded-xl border border-outline-variant/10 bg-surface-container-lowest" />
              </div>
            )}
          </div>

          {/* Reporter Info */}
          <div className="bg-surface-container-low rounded-xl p-6 md:p-8 ghost-border">
            <h3 className="font-headline font-semibold text-sm uppercase tracking-wider text-blue-200 mb-6">Reporter Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-on-surface">{incident.reported_by_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <a href={`mailto:${incident.reported_by_email}`} className="text-primary hover:text-primary-fixed hover:underline">
                  {incident.reported_by_email}
                </a>
              </div>
              {incident.reported_by_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`tel:${incident.reported_by_phone}`} className="text-primary hover:text-primary-fixed hover:underline">
                    {incident.reported_by_phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-surface-container-low rounded-xl p-6 md:p-8 ghost-border">
            <h3 className="font-headline font-semibold text-sm uppercase tracking-wider text-blue-200 mb-8">Incident Lifecycle Timeline</h3>
            {statusUpdates.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No status updates yet.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-outline-variant/20" />
                <div className="space-y-10">
                  {[...statusUpdates].reverse().map((update) => {
                    const statusKey = (update.new_status || 'reported') as Status
                    const sCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.reported
                    return (
                      <div key={update.id} className="relative pl-12">
                        <div className={`absolute left-[11px] top-1.5 w-3 h-3 rounded-full ${sCfg.dot} shadow-[0_0_12px_rgba(173,198,255,0.3)]`} />
                        <div className="flex justify-between flex-wrap gap-2">
                          <div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${sCfg.bg} ${sCfg.color}`}>
                              {sCfg.label}
                            </span>
                            {update.note && <p className="text-sm text-on-surface-variant mt-2">{update.note}</p>}
                            {update.updated_by && (
                              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                <User className="w-3 h-3" /> {update.updated_by}
                              </p>
                            )}
                          </div>
                          <span className="text-xs font-label text-slate-500">{formatDate(update.created_at)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Admin Controls */}
        <div className="lg:col-span-4 space-y-8">
          {/* Operations Panel */}
          <div className="bg-surface-container rounded-xl p-6 md:p-8 ghost-border">
            <h3 className="text-[10px] font-label text-slate-500 uppercase tracking-[0.2em] mb-6">Operations Panel</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-2">Status</label>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as Status)} className={selectClasses}>
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-2">Assigned Team</label>
                <select value={formTeam} onChange={(e) => setFormTeam(e.target.value)} className={selectClasses}>
                  <option value="">-- Select Team --</option>
                  {TEAMS.map(t => <option key={t} value={t}>{teamLabel(t)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-2">Assigned To</label>
                <input type="text" value={formAssignedTo} onChange={(e) => setFormAssignedTo(e.target.value)}
                  placeholder="Person's name" className={inputClasses} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-2">Severity Override</label>
                <select value={formSeverity} onChange={(e) => setFormSeverity(e.target.value as Severity)} className={selectClasses}>
                  {ALL_SEVERITIES.map(s => <option key={s} value={s}>{SEVERITY_CONFIG[s].label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-2">Admin Notes</label>
                <textarea value={formNote} onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Document decisions or dispatch orders..."
                  rows={3} className={`${inputClasses} resize-none`} />
              </div>
              <button onClick={handleUpdate} disabled={updating}
                className="w-full bg-surface-bright text-on-surface font-bold py-3 rounded-xl border border-outline-variant/20 hover:border-primary/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {updating ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : <><Save className="w-4 h-4" /> Log Entry & Update</>}
              </button>
              {feedback && (
                <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
                  feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {feedback.message}
                </div>
              )}
            </div>
          </div>

          {/* Meta Info */}
          <div className="bg-surface-container-low rounded-xl p-6 ghost-border">
            <h3 className="text-[10px] font-label text-slate-500 uppercase tracking-[0.2em] mb-4">Meta Information</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-500 text-xs">Created at</dt>
                <dd className="text-on-surface font-medium">{formatDate(incident.created_at)}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Last updated</dt>
                <dd className="text-on-surface font-medium">{formatDate(incident.updated_at)}</dd>
              </div>
              {incident.resolved_at && (
                <div>
                  <dt className="text-slate-500 text-xs">Resolved at</dt>
                  <dd className="text-on-surface font-medium">{formatDate(incident.resolved_at)}</dd>
                </div>
              )}
              <div>
                <dt className="text-slate-500 text-xs">Tracking Code</dt>
                <dd className="text-primary font-mono font-medium">{incident.tracking_code}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
