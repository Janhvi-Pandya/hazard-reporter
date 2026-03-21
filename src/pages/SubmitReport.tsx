import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Zap,
  Building2,
  Flame,
  FlaskConical,
  Accessibility,
  Droplets,
  Lightbulb,
  TreePine,
  Shield,
  HelpCircle,
  Camera,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  AlertOctagon,
  AlertCircle,
  Timer,
  CalendarClock,
  Send,
  ArrowRight,
  RotateCcw,
} from 'lucide-react'
import type { Category, Urgency, Incident } from '../types'
import { submitReport } from '../api'
import LocationPicker from '../components/LocationPicker'

const CATEGORIES: { value: Category; label: string; icon: React.ReactNode }[] = [
  { value: 'electrical', label: 'Electrical', icon: <Zap className="w-4 h-4" /> },
  { value: 'structural', label: 'Structural', icon: <Building2 className="w-4 h-4" /> },
  { value: 'fire_safety', label: 'Fire Safety', icon: <Flame className="w-4 h-4" /> },
  { value: 'chemical', label: 'Chemical / Hazmat', icon: <FlaskConical className="w-4 h-4" /> },
  { value: 'accessibility', label: 'Accessibility', icon: <Accessibility className="w-4 h-4" /> },
  { value: 'water_damage', label: 'Water Damage', icon: <Droplets className="w-4 h-4" /> },
  { value: 'lighting', label: 'Lighting', icon: <Lightbulb className="w-4 h-4" /> },
  { value: 'environmental', label: 'Environmental', icon: <TreePine className="w-4 h-4" /> },
  { value: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
  { value: 'other', label: 'Other', icon: <HelpCircle className="w-4 h-4" /> },
]

const URGENCY_OPTIONS: {
  value: Urgency
  label: string
  description: string
  activeColor: string
  icon: React.ReactNode
}[] = [
  {
    value: 'emergency',
    label: 'Emergency',
    description: 'Immediate danger to life or property',
    activeColor: 'bg-red-500/10 border-red-500/30 text-red-400',
    icon: <AlertOctagon className="w-5 h-5 text-red-400" />,
  },
  {
    value: 'urgent',
    label: 'Urgent',
    description: 'Needs attention within hours',
    activeColor: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    icon: <AlertCircle className="w-5 h-5 text-orange-400" />,
  },
  {
    value: 'soon',
    label: 'Soon',
    description: 'Should be addressed within a day or two',
    activeColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    icon: <Timer className="w-5 h-5 text-amber-400" />,
  },
  {
    value: 'when_possible',
    label: 'When Possible',
    description: 'Non-urgent, fix when resources allow',
    activeColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    icon: <CalendarClock className="w-5 h-5 text-emerald-400" />,
  },
]

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  low: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
}

function teamLabel(team: string): string {
  return team.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

interface FormErrors {
  category?: string
  title?: string
  description?: string
  urgency?: string
  location?: string
  reported_by_name?: string
  reported_by_email?: string
}

export default function SubmitReport() {
  const navigate = useNavigate()

  const [category, setCategory] = useState<Category | ''>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState<Urgency | ''>('')
  const [location, setLocation] = useState('')
  const [locationDetail, setLocationDetail] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [reporterName, setReporterName] = useState('')
  const [reporterEmail, setReporterEmail] = useState('')
  const [reporterPhone, setReporterPhone] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)

  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState<Incident | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!category) newErrors.category = 'Please select a category.'
    if (!title.trim()) newErrors.title = 'Please provide a title.'
    else if (title.trim().length < 5) newErrors.title = 'Title must be at least 5 characters.'
    if (!description.trim()) newErrors.description = 'Please describe the hazard.'
    else if (description.trim().length < 15)
      newErrors.description = 'Please provide a more detailed description (at least 15 characters).'
    if (!urgency) newErrors.urgency = 'Please select an urgency level.'
    if (!location.trim()) newErrors.location = 'Please provide the building or location.'
    if (!reporterName.trim()) newErrors.reported_by_name = 'Please enter your name.'
    if (!reporterEmail.trim()) newErrors.reported_by_email = 'Please enter your email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail))
      newErrors.reported_by_email = 'Please enter a valid email address.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePhotoSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    setPhoto(file)
    const reader = new FileReader()
    reader.onload = (e) => setPhotoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handlePhotoSelect(file)
    },
    [handlePhotoSelect],
  )

  const removePhoto = () => {
    setPhoto(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('category', category)
      formData.append('urgency', urgency)
      formData.append('location', location.trim())
      formData.append('location_detail', locationDetail.trim())
      formData.append('reported_by_name', reporterName.trim())
      formData.append('reported_by_email', reporterEmail.trim())
      formData.append('reported_by_phone', reporterPhone.trim())
      if (latitude !== null) formData.append('latitude', latitude.toString())
      if (longitude !== null) formData.append('longitude', longitude.toString())
      if (photo) formData.append('photo', photo)
      const incident = await submitReport(formData)
      setResult(incident)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setCategory('')
    setTitle('')
    setDescription('')
    setUrgency('')
    setLocation('')
    setLocationDetail('')
    setPhoto(null)
    setPhotoPreview(null)
    setReporterName('')
    setReporterEmail('')
    setReporterPhone('')
    setLatitude(null)
    setLongitude(null)
    setErrors({})
    setSubmitError('')
    setResult(null)
  }

  const inputClasses = (hasError?: string) =>
    `w-full bg-surface-container-highest/40 border rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-slate-600 focus:ring-1 focus:ring-primary/50 focus:border-primary/30 transition-all outline-none ${
      hasError ? 'border-red-500/40' : 'border-outline-variant/20'
    }`

  if (result) {
    const reasoning = result.classification?.reasoning
    return (
      <div className="max-w-xl mx-auto px-6 py-16 sm:py-24">
        <div className="liquid-glass rounded-[2rem] ghost-border p-8 text-center animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-on-surface font-headline mb-2">Report Submitted Successfully</h2>
          <p className="text-on-surface-variant mb-8">Your hazard report has been received and is being processed.</p>
          <div className="bg-surface-container-lowest rounded-xl ghost-border p-6 text-left space-y-4 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant">Incident ID</span>
              <span className="font-mono font-semibold text-primary">{result.id}</span>
            </div>
            <div className="border-t border-outline-variant/10" />
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant">Tracking Code</span>
              <span className="font-mono font-semibold text-primary">{result.tracking_code}</span>
            </div>
            <div className="border-t border-outline-variant/10" />
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant">Severity</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${SEVERITY_COLORS[result.severity] || 'bg-slate-500/10 text-slate-400'}`}>
                {result.severity}
              </span>
            </div>
            <div className="border-t border-outline-variant/10" />
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant">Assigned Team</span>
              <span className="font-medium text-on-surface">{teamLabel(result.assigned_team)}</span>
            </div>
            {reasoning && (
              <>
                <div className="border-t border-outline-variant/10" />
                <div>
                  <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant block mb-1">Classification Reasoning</span>
                  <p className="text-sm text-on-surface-variant">{reasoning}</p>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(`/track?code=${result.tracking_code}`)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 cta-gradient text-on-primary font-bold rounded-xl hover:brightness-110 transition-all"
            >
              Track Your Report
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={resetForm}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-container hover:bg-surface-container-high ghost-border text-on-surface font-semibold rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Submit Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 md:px-8 py-8 max-w-7xl mx-auto">
      {/* Emergency Banner */}
      <div className="mb-8 p-3 bg-on-tertiary-container/10 ghost-border rounded-xl flex items-center justify-center gap-3">
        <AlertTriangle className="w-4 h-4 text-on-tertiary-container" />
        <span className="font-label text-[10px] uppercase tracking-[0.2em] font-bold text-on-tertiary-container">
          Life-Threatening Emergency? Dial 911 immediately. This portal is for operational hazard reporting only.
        </span>
      </div>

      {/* Page Header */}
      <div className="mb-10">
        <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-surface tracking-tight mb-2">Initialize Incident Report</h2>
        <p className="text-on-surface-variant font-body">Provide details about the hazard. Our system will classify and route it automatically.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} noValidate className="liquid-glass p-6 md:p-8 rounded-[2rem] ghost-border shadow-2xl space-y-8">
            {/* Section 1: What happened */}
            <div className="space-y-5">
              <label className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">Nature of Incident</label>

              <div>
                <label htmlFor="category" className="block text-xs font-semibold text-on-surface-variant mb-2">Category *</label>
                <select
                  id="category" value={category}
                  onChange={(e) => { setCategory(e.target.value as Category); if (errors.category) setErrors(p => ({ ...p, category: undefined })) }}
                  className={inputClasses(errors.category)}
                >
                  <option value="">Select a category...</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                {category && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                    {CATEGORIES.find(c => c.value === category)?.icon}
                    {CATEGORIES.find(c => c.value === category)?.label}
                  </div>
                )}
                {errors.category && <p className="mt-1.5 text-xs text-red-400">{errors.category}</p>}
              </div>

              <div>
                <label htmlFor="title" className="block text-xs font-semibold text-on-surface-variant mb-2">Title *</label>
                <input
                  id="title" type="text" value={title}
                  onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors(p => ({ ...p, title: undefined })) }}
                  placeholder="e.g., Broken wheelchair ramp at Science Building"
                  className={inputClasses(errors.title)}
                />
                {errors.title && <p className="mt-1.5 text-xs text-red-400">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-semibold text-on-surface-variant mb-2">Description *</label>
                <textarea
                  id="description" value={description} rows={4}
                  onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors(p => ({ ...p, description: undefined })) }}
                  placeholder="Describe the hazard in detail..."
                  className={`${inputClasses(errors.description)} resize-y`}
                />
                {errors.description && <p className="mt-1.5 text-xs text-red-400">{errors.description}</p>}
              </div>
            </div>

            {/* Urgency */}
            <div className="space-y-3">
              <label className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">Urgency Level *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {URGENCY_OPTIONS.map(opt => {
                  const selected = urgency === opt.value
                  return (
                    <label
                      key={opt.value}
                      className={`relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        selected
                          ? opt.activeColor
                          : 'border-outline-variant/20 bg-surface-container-highest/30 hover:bg-surface-container-highest/50 text-on-surface-variant'
                      }`}
                    >
                      <input type="radio" name="urgency" value={opt.value} checked={selected}
                        onChange={() => { setUrgency(opt.value); if (errors.urgency) setErrors(p => ({ ...p, urgency: undefined })) }}
                        className="sr-only"
                      />
                      <div className="mt-0.5">{opt.icon}</div>
                      <div>
                        <span className="block text-sm font-semibold">{opt.label}</span>
                        <span className="block text-xs text-slate-500 mt-0.5">{opt.description}</span>
                      </div>
                      {selected && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </label>
                  )
                })}
              </div>
              {errors.urgency && <p className="mt-1.5 text-xs text-red-400">{errors.urgency}</p>}
            </div>

            {/* Location */}
            <div className="space-y-3">
              <label className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">Target Location</label>
              <div>
                <label htmlFor="location" className="block text-xs font-semibold text-on-surface-variant mb-2">Building / Location *</label>
                <input
                  id="location" type="text" value={location}
                  onChange={(e) => { setLocation(e.target.value); if (errors.location) setErrors(p => ({ ...p, location: undefined })) }}
                  placeholder="e.g., Engineering Hall, Parking Lot B"
                  className={inputClasses(errors.location)}
                />
                {errors.location && <p className="mt-1.5 text-xs text-red-400">{errors.location}</p>}
              </div>
              <div>
                <label htmlFor="location_detail" className="block text-xs font-semibold text-on-surface-variant mb-2">
                  Specific Details <span className="text-slate-600 font-normal">(optional)</span>
                </label>
                <input
                  id="location_detail" type="text" value={locationDetail}
                  onChange={(e) => setLocationDetail(e.target.value)}
                  placeholder="e.g., Room 204, near the east stairwell"
                  className={inputClasses()}
                />
              </div>
            </div>

            {/* Map Location Picker */}
            <div className="space-y-3">
              <label className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">Pin Location on Map</label>
              <LocationPicker
                onLocationSelect={(lat, lng, addr) => {
                  setLatitude(lat)
                  setLongitude(lng)
                  if (addr && !location) setLocation(addr)
                }}
              />
              {latitude !== null && longitude !== null && (
                <p className="text-xs text-slate-500">
                  Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
              )}
            </div>

            {/* Photo Upload */}
            <div className="space-y-3">
              <label className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">Visual Documentation</label>
              {photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden ghost-border">
                  <img src={photoPreview} alt="Preview" className="w-full max-h-64 object-cover" />
                  <button type="button" onClick={removePhoto}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-sm truncate">{photo?.name}</p>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group ${
                    dragOver ? 'border-primary/40 bg-primary/5' : 'border-outline-variant/20 hover:bg-surface-container-highest/20'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center group-hover:scale-110 transition-transform">
                    {dragOver ? <Upload className="w-5 h-5 text-primary" /> : <Camera className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-on-surface">
                      {dragOver ? 'Drop your image here' : 'Drop imagery here or browse'}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">PNG, JPG, or WebP (MAX 10MB)</p>
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) handlePhotoSelect(file) }}
                className="hidden"
              />
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <label className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">Reporter Details</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reported_by_name" className="block text-xs font-semibold text-on-surface-variant mb-2">Name *</label>
                  <input id="reported_by_name" type="text" value={reporterName}
                    onChange={(e) => { setReporterName(e.target.value); if (errors.reported_by_name) setErrors(p => ({ ...p, reported_by_name: undefined })) }}
                    placeholder="Your full name"
                    className={inputClasses(errors.reported_by_name)}
                  />
                  {errors.reported_by_name && <p className="mt-1.5 text-xs text-red-400">{errors.reported_by_name}</p>}
                </div>
                <div>
                  <label htmlFor="reported_by_email" className="block text-xs font-semibold text-on-surface-variant mb-2">Email *</label>
                  <input id="reported_by_email" type="email" value={reporterEmail}
                    onChange={(e) => { setReporterEmail(e.target.value); if (errors.reported_by_email) setErrors(p => ({ ...p, reported_by_email: undefined })) }}
                    placeholder="you@example.com"
                    className={inputClasses(errors.reported_by_email)}
                  />
                  {errors.reported_by_email && <p className="mt-1.5 text-xs text-red-400">{errors.reported_by_email}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="reported_by_phone" className="block text-xs font-semibold text-on-surface-variant mb-2">
                    Phone <span className="text-slate-600 font-normal">(optional)</span>
                  </label>
                  <input id="reported_by_phone" type="tel" value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className={inputClasses()}
                  />
                </div>
              </div>
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-400">Submission failed</p>
                  <p className="text-sm text-red-400/80 mt-0.5">{submitError}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button type="submit" disabled={submitting}
                className="w-full py-4 bg-gradient-to-br from-primary to-on-primary-fixed-variant rounded-xl text-on-primary font-bold uppercase tracking-[0.2em] text-sm shadow-xl shadow-primary/10 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing Report...</>
                ) : (
                  <><Send className="w-5 h-5" /> Dispatch Report</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Status Widget */}
        <div className="lg:col-span-5 space-y-8">
          {/* Info Card */}
          <div className="bg-primary/5 rounded-[2rem] border border-primary/20 p-8 flex items-start gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield className="w-20 h-20 text-primary" />
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-headline text-xl font-bold text-on-surface mb-1">How It Works</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                Submit your report and our classification engine will automatically determine severity, assign the right team, and begin the dispatch process.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-highest border border-outline-variant/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Online</span>
              </div>
            </div>
          </div>

          {/* Process Timeline */}
          <div className="p-6">
            <label className="font-label text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4 block">Dispatch Pipeline</label>
            <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-outline-variant/20">
              <div className="flex gap-6 items-start relative">
                <div className="w-4 h-4 rounded-full bg-primary border-4 border-surface shadow-[0_0_10px_rgba(173,198,255,0.4)] z-10"></div>
                <div>
                  <p className="text-xs font-bold text-on-surface">Report Submitted</p>
                  <p className="text-[10px] text-slate-500">You submit the hazard details</p>
                </div>
              </div>
              <div className="flex gap-6 items-start relative">
                <div className="w-4 h-4 rounded-full bg-blue-500/50 border-4 border-surface z-10"></div>
                <div>
                  <p className="text-xs font-bold text-on-surface">Auto-Classification</p>
                  <p className="text-[10px] text-slate-500">Engine assigns severity & team</p>
                </div>
              </div>
              <div className="flex gap-6 items-start relative">
                <div className="w-4 h-4 rounded-full bg-slate-700 border-4 border-surface z-10"></div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Team Dispatch</p>
                  <p className="text-[10px] text-slate-600">Routed to the correct response team</p>
                </div>
              </div>
              <div className="flex gap-6 items-start relative">
                <div className="w-4 h-4 rounded-full bg-slate-700 border-4 border-surface z-10"></div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Resolution</p>
                  <p className="text-[10px] text-slate-600">Hazard addressed and case closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
