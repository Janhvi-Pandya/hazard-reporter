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
  Shield,
  ChevronDown,
  Brain,
  Zap,
  Radio,
  Target,
} from 'lucide-react'
import type { Incident, StatusUpdate, Status, Severity } from '../types'
import { getIncident, updateIncident } from '../api'
import { useAuth } from '../context/AuthContext'

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; dot: string; glow: string }> = {
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-500', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.5)]' },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10', dot: 'bg-orange-500', glow: 'shadow-[0_0_12px_rgba(249,115,22,0.5)]' },
  medium: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-500', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.5)]' },
  low: { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.5)]' },
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; dot: string; glow: string }> = {
  reported: { label: 'Reported', color: 'text-blue-300', bg: 'bg-blue-500/10', dot: 'bg-blue-500', glow: 'shadow-[0_0_12px_rgba(59,130,246,0.5)]' },
  acknowledged: { label: 'Acknowledged', color: 'text-purple-300', bg: 'bg-purple-500/10', dot: 'bg-purple-500', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.5)]' },
  dispatched: { label: 'Dispatched', color: 'text-indigo-300', bg: 'bg-indigo-500/10', dot: 'bg-indigo-500', glow: 'shadow-[0_0_12px_rgba(99,102,241,0.5)]' },
  in_progress: { label: 'In Progress', color: 'text-amber-300', bg: 'bg-amber-500/10', dot: 'bg-amber-500', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.5)]' },
  resolved: { label: 'Resolved', color: 'text-emerald-300', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.5)]' },
  closed: { label: 'Closed', color: 'text-slate-400', bg: 'bg-slate-500/10', dot: 'bg-slate-500', glow: 'shadow-[0_0_12px_rgba(100,116,139,0.5)]' },
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
  const { user } = useAuth()
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
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)

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
  const classificationSev = incident.classification?.severity
  const classificationSevCfg = classificationSev ? SEVERITY_CONFIG[classificationSev] : null

  // Role-based access: only report creator or admin can manage
  const canManage = user?.role === 'admin' || (user?.email && user.email === incident.reported_by_email)

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 px-6 md:px-8 py-8 max-w-7xl mx-auto w-full">

        {/* Emergency Glass-Red Banner */}
        {isCritical && (
          <div className="mb-8 p-5 bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl flex items-center justify-between flex-wrap gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-11 h-11 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="font-headline font-bold text-red-300 text-sm uppercase tracking-wider">
                  Urgent Action Required
                </h2>
                <p className="text-red-200/70 text-sm mt-0.5">
                  This {incident.severity}-severity incident demands immediate coordination and resource deployment.
                </p>
              </div>
            </div>
            {canManage && (
              <div className="flex items-center gap-3 relative z-10">
                <button className="px-5 py-2.5 bg-red-500/90 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Deploy Response Team
                </button>
                <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-medium rounded-xl transition-all flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Acknowledge
                </button>
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div className="mb-10">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-200 transition-colors mb-5">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  <Radio className="w-3 h-3" /> Active Response
                </span>
                <span className="text-[10px] font-label text-slate-500 uppercase tracking-widest">
                  SUBMITTED {formatDate(incident.created_at)}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-surface leading-tight">
                <span className="text-slate-500">#{incident.id}:</span> {incident.title}
              </h1>
              <p className="text-on-surface-variant flex items-center gap-2 mt-2">
                <MapPin className="w-4 h-4" /> {incident.location}{incident.location_detail ? ` — ${incident.location_detail}` : ''}
              </p>
            </div>

            {/* Status Change Dropdown - only for admin or report creator */}
            {canManage ? (
              <div className="relative shrink-0">
                <button
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className={`flex items-center gap-3 px-5 py-3 rounded-xl border border-white/10 bg-surface-container-high hover:bg-surface-container-highest transition-all`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${statusCfg.dot}`} />
                  <span className={`text-sm font-bold ${statusCfg.color}`}>{statusCfg.label}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {statusDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50 w-52 bg-surface-container-highest border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    {ALL_STATUSES.map(s => {
                      const cfg = STATUS_CONFIG[s]
                      return (
                        <button
                          key={s}
                          onClick={() => { setFormStatus(s); setStatusDropdownOpen(false) }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${formStatus === s ? 'bg-white/5' : ''}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                          <span className={cfg.color}>{cfg.label}</span>
                          {formStatus === s && <CheckCircle className="w-3.5 h-3.5 text-primary ml-auto" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-surface-container-high/50 shrink-0">
                <span className={`w-2.5 h-2.5 rounded-full ${statusCfg.dot}`} />
                <span className={`text-sm font-bold ${statusCfg.color}`}>{statusCfg.label}</span>
              </div>
            )}
          </div>

          {/* Severity + Status badges row */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className={`flex items-center gap-1.5 ${sevCfg.bg} px-2.5 py-1 rounded-full text-[10px] font-bold ${sevCfg.color} uppercase tracking-widest`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sevCfg.dot}`} />
              {sevCfg.label} Severity
            </span>
            <span className={`${statusCfg.bg} ${statusCfg.color} px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest`}>
              {statusCfg.label}
            </span>
            {incident.assigned_team && (
              <span className="bg-surface-container-high px-2.5 py-1 rounded-full text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                {teamLabel(incident.assigned_team)}
              </span>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Report Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Description */}
            <div className="bg-surface-container-low rounded-xl p-6 md:p-8 ghost-border">
              <h3 className="font-headline font-semibold text-sm uppercase tracking-wider text-blue-200 mb-4">Incident Description</h3>
              <p className="text-on-surface-variant whitespace-pre-wrap leading-relaxed">{incident.description}</p>

              {/* Photo with zoom on hover */}
              {incident.photo_url && (
                <div className="mt-6 group cursor-zoom-in relative overflow-hidden rounded-xl">
                  <img
                    src={incident.photo_url}
                    alt="Incident photo"
                    className="w-full max-h-96 object-contain rounded-xl bg-surface-container-lowest opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent flex items-end px-4 pb-3 pointer-events-none">
                    <span className="text-xs text-white/70 font-label tracking-wide">incident-photo-{incident.id}.jpg</span>
                  </div>
                </div>
              )}
            </div>

            {/* Extracted Details + Classification Logic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Extracted Details */}
              <div className="bg-surface-container-low rounded-xl p-6 ghost-border">
                <h3 className="font-headline font-semibold text-sm uppercase tracking-wider text-blue-200 mb-5 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Extracted Details
                </h3>
                <div className="divide-y divide-white/5">
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Category</span>
                    <span className="text-sm text-on-surface font-medium capitalize">{incident.category?.replace(/_/g, ' ') || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Location</span>
                    <span className="text-sm text-on-surface font-medium">{incident.location}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Assigned Team</span>
                    <span className="text-sm text-on-surface font-medium">{incident.assigned_team ? teamLabel(incident.assigned_team) : 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Tracking Code</span>
                    <span className="text-sm text-primary font-mono font-medium">{incident.tracking_code}</span>
                  </div>
                </div>
              </div>

              {/* Classification Logic */}
              <div className="bg-surface-container rounded-xl p-6 ghost-border">
                <h3 className="font-headline font-semibold text-sm uppercase tracking-wider text-blue-200 mb-5 flex items-center gap-2">
                  <Brain className="w-4 h-4" /> Classification Logic
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">AI-Suggested Severity</span>
                    {classificationSevCfg ? (
                      <span className={`text-sm font-bold ${classificationSevCfg.color}`}>{classificationSevCfg.label}</span>
                    ) : (
                      <span className="text-sm text-slate-500">N/A</span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Rules-Based Final Severity</span>
                    <span className={`text-sm font-bold ${sevCfg.color}`}>{sevCfg.label}</span>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-bold text-blue-300 uppercase tracking-widest">
                      <Shield className="w-3 h-3" /> 94% Confidence
                    </span>
                  </div>
                  {incident.classification?.reasoning && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 mt-2">
                      <p className="text-xs text-slate-400 leading-relaxed">{incident.classification.reasoning}</p>
                    </div>
                  )}
                </div>
              </div>
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
                        <div key={update.id} className="relative pl-12 group hover:translate-x-1 transition-all">
                          <div className={`absolute left-[11px] top-1.5 w-3 h-3 rounded-full ${sCfg.dot} ${sCfg.glow} group-hover:scale-130 transition-transform`} />
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
            {/* Operations Panel - only visible to admin or report creator */}
            {canManage ? (
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
            ) : (
              <div className="bg-surface-container rounded-xl p-6 ghost-border">
                <h3 className="text-[10px] font-label text-slate-500 uppercase tracking-[0.2em] mb-3">Access Restricted</h3>
                <p className="text-sm text-slate-400">Only the report creator or an admin can manage this incident.</p>
              </div>
            )}

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

            {/* Map Preview */}
            <div className="bg-surface-container-low rounded-xl p-6 ghost-border">
              <h3 className="text-[10px] font-label text-slate-500 uppercase tracking-[0.2em] mb-4">Dispatch Location</h3>
              <div className="group relative overflow-hidden rounded-xl cursor-pointer" style={{ height: '200px' }}>
                {incident.latitude && incident.longitude ? (
                  <img
                    src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-l+ef4444(${incident.longitude},${incident.latitude})/${incident.longitude},${incident.latitude},14,0/400x200@2x?access_token=pk.placeholder`}
                    alt="Map preview"
                    className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-70 group-hover:scale-110 transition-all duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-surface-container-highest flex items-center justify-center grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-70 group-hover:scale-110 transition-all duration-700">
                    <div className="text-center">
                      <div className="relative inline-block">
                        <MapPin className="w-8 h-8 text-red-400 animate-pulse" />
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-red-400/30 rounded-full blur-sm" />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Map coordinates unavailable</p>
                    </div>
                  </div>
                )}
                {/* Pulsing Pin Marker Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    <MapPin className="w-8 h-8 text-red-400 drop-shadow-lg animate-pulse" />
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-red-400/30 rounded-full blur-sm" />
                  </div>
                </div>
                {/* Location label overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pointer-events-none">
                  <p className="text-xs text-white/80 font-medium truncate flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {incident.location}{incident.location_detail ? ` — ${incident.location_detail}` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-white/5 bg-surface-container-lowest/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="text-sm font-bold text-on-surface font-headline tracking-tight">KERIU</span>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Incident Response Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-500">
              <span>Incident #{incident.id}</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>{formatDate(incident.created_at)}</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span className="text-slate-600">Confidential</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
