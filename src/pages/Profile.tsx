import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { UserCircle, Mail, Phone, User, Shield, Loader2, CheckCircle, AlertCircle, FileWarning } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import type { Incident } from '../types'

export default function Profile() {
  const { user, updateProfile } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [reports, setReports] = useState<Incident[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    setFullName(user.full_name)
    setEmail(user.email)
    setPhone(user.phone || '')
  }, [user])

  useEffect(() => {
    if (!user || user.role !== 'reporter') return
    setReportsLoading(true)
    fetch(`/api/incidents?reported_by_email=${encodeURIComponent(user.email)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Incident[]) => setReports(data))
      .catch(() => setReports([]))
      .finally(() => setReportsLoading(false))
  }, [user])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFeedback(null)
    setSaving(true)
    try {
      await updateProfile({ full_name: fullName.trim(), email: email.trim(), phone: phone.trim() })
      setFeedback({ type: 'success', message: 'Profile updated successfully' })
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Update failed' })
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const inputClass =
    'w-full bg-surface-container-highest/40 border border-outline-variant/20 rounded-xl pl-10 pr-4 py-3 text-sm text-on-surface placeholder:text-slate-600 focus:ring-1 focus:ring-primary/50 focus:border-primary/30 transition-all outline-none'

  const severityColor: Record<string, string> = {
    critical: 'text-red-400 bg-red-500/10',
    high: 'text-orange-400 bg-orange-500/10',
    medium: 'text-yellow-400 bg-yellow-500/10',
    low: 'text-green-400 bg-green-500/10',
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
      {/* Header card */}
      <div className="liquid-glass rounded-[2rem] ghost-border p-8">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-surface-container-highest/40 flex items-center justify-center shrink-0">
            <UserCircle className="w-12 h-12 text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-blue-100 font-headline">
              {user.full_name}
            </h1>
            <p className="text-sm text-slate-400 mt-1">@{user.username}</p>
            <span
              className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                user.role === 'admin'
                  ? 'bg-primary/20 text-primary'
                  : 'bg-teal-500/20 text-teal-300'
              }`}
            >
              <Shield className="w-3 h-3" />
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="liquid-glass rounded-[2rem] ghost-border p-8">
        <h2 className="font-label text-[10px] uppercase tracking-widest text-primary font-bold mb-6">
          Edit Profile
        </h2>

        {feedback && (
          <div
            className={`mb-6 rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                : 'bg-red-500/10 border border-red-500/20 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="font-label text-[10px] uppercase tracking-widest text-primary font-bold block mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="font-label text-[10px] uppercase tracking-widest text-primary font-bold block mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="font-label text-[10px] uppercase tracking-widest text-primary font-bold block mb-2">
              Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your phone number"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-gradient-to-br from-primary to-on-primary-fixed-variant rounded-xl text-on-primary font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Update Profile'
            )}
          </button>
        </form>
      </div>

      {/* Submitted reports (reporter role only) */}
      {user.role === 'reporter' && (
        <div className="liquid-glass rounded-[2rem] ghost-border p-8">
          <h2 className="font-label text-[10px] uppercase tracking-widest text-primary font-bold mb-6">
            My Submitted Reports
          </h2>

          {reportsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No reports submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <a
                  key={report.id}
                  href={`/incidents/${report.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-highest/20 border border-outline-variant/10 hover:bg-surface-container-highest/30 transition-colors"
                >
                  <FileWarning className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate font-headline">
                      {report.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {report.tracking_code} &middot; {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        severityColor[report.severity] || 'text-slate-400 bg-slate-500/10'
                      }`}
                    >
                      {report.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase text-blue-300 bg-blue-500/10">
                      {report.status}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
