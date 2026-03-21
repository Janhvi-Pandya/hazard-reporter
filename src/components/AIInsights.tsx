import { useMemo } from 'react'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  MapPin,
  AlertTriangle,
  Zap,
  BarChart3,
  Lightbulb,
} from 'lucide-react'
import type { Incident, Severity, Category } from '../types'

interface AIInsightsProps {
  incidents: Incident[]
}

const severityWeight: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

const severityColor: Record<Severity, string> = {
  critical: 'text-red-500',
  high: 'text-orange-500',
  medium: 'text-amber-500',
  low: 'text-emerald-500',
}

const severityBg: Record<Severity, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
}

const categoryLabels: Record<Category, string> = {
  electrical: 'Electrical',
  structural: 'Structural',
  fire_safety: 'Fire Safety',
  chemical: 'Chemical',
  accessibility: 'Accessibility',
  water_damage: 'Water Damage',
  lighting: 'Lighting',
  environmental: 'Environmental',
  security: 'Security',
  other: 'Other',
}

function getRiskScore(incidents: Incident[]): number {
  if (incidents.length === 0) return 0

  const openStatuses = ['reported', 'acknowledged', 'dispatched', 'in_progress']
  const openIncidents = incidents.filter((i) => openStatuses.includes(i.status))

  const severityScore = openIncidents.reduce((sum, i) => sum + severityWeight[i.severity], 0)
  const maxPossible = openIncidents.length * 4

  if (maxPossible === 0) return 0

  const severityRatio = severityScore / maxPossible
  const volumeFactor = Math.min(openIncidents.length / 20, 1)

  const criticalCount = openIncidents.filter((i) => i.severity === 'critical').length
  const criticalBonus = Math.min(criticalCount * 10, 30)

  const score = Math.round(severityRatio * 50 + volumeFactor * 20 + criticalBonus)
  return Math.min(score, 100)
}

function getRiskColor(score: number): string {
  if (score >= 75) return 'text-red-500'
  if (score >= 50) return 'text-orange-500'
  if (score >= 25) return 'text-amber-500'
  return 'text-emerald-500'
}

function getRiskBgColor(score: number): string {
  if (score >= 75) return 'bg-red-500'
  if (score >= 50) return 'bg-orange-500'
  if (score >= 25) return 'bg-amber-500'
  return 'bg-emerald-500'
}

export default function AIInsights({ incidents }: AIInsightsProps) {
  const riskScore = useMemo(() => getRiskScore(incidents), [incidents])

  const hotspots = useMemo(() => {
    const locationCounts: Record<string, number> = {}
    for (const inc of incidents) {
      const loc = inc.location || 'Unknown'
      locationCounts[loc] = (locationCounts[loc] || 0) + 1
    }
    return Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
  }, [incidents])

  const trend = useMemo(() => {
    const now = Date.now()
    const h24 = 24 * 60 * 60 * 1000
    const last24h = incidents.filter(
      (i) => now - new Date(i.created_at).getTime() < h24
    ).length
    const prev24h = incidents.filter((i) => {
      const age = now - new Date(i.created_at).getTime()
      return age >= h24 && age < h24 * 2
    }).length

    if (last24h > prev24h) return { label: 'Increasing', direction: 'up' as const, last24h, prev24h }
    if (last24h < prev24h) return { label: 'Decreasing', direction: 'down' as const, last24h, prev24h }
    return { label: 'Stable', direction: 'stable' as const, last24h, prev24h }
  }, [incidents])

  const categoryBreakdown = useMemo(() => {
    const counts: Partial<Record<Category, number>> = {}
    for (const inc of incidents) {
      counts[inc.category] = (counts[inc.category] || 0) + 1
    }
    const total = incidents.length || 1
    return Object.entries(counts)
      .map(([cat, count]) => ({
        category: cat as Category,
        count: count!,
        pct: Math.round((count! / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [incidents])

  const recommendations = useMemo(() => {
    const recs: string[] = []
    const openStatuses = ['reported', 'acknowledged', 'dispatched', 'in_progress']

    // Critical incidents by location
    const criticalByLocation: Record<string, string[]> = {}
    for (const inc of incidents) {
      if (inc.severity === 'critical' && openStatuses.includes(inc.status)) {
        const loc = inc.location || 'Unknown'
        if (!criticalByLocation[loc]) criticalByLocation[loc] = []
        criticalByLocation[loc].push(inc.category)
      }
    }
    for (const [loc, categories] of Object.entries(criticalByLocation)) {
      const primaryCat = categories[0]
      recs.push(
        `Critical ${primaryCat.replace('_', ' ')} incidents detected in ${loc} - recommend immediate inspection`
      )
    }

    // Water damage trend
    const now = Date.now()
    const h48 = 48 * 60 * 60 * 1000
    const recentWater = incidents.filter(
      (i) => i.category === 'water_damage' && now - new Date(i.created_at).getTime() < h48
    )
    if (recentWater.length >= 2) {
      recs.push('Water damage incidents increasing - check plumbing infrastructure')
    }

    // Unresolved high-priority
    const unresolvedHigh = incidents.filter(
      (i) =>
        (i.severity === 'high' || i.severity === 'critical') &&
        openStatuses.includes(i.status)
    )
    if (unresolvedHigh.length > 0) {
      recs.push(
        `${unresolvedHigh.length} unresolved high-priority incident${unresolvedHigh.length > 1 ? 's' : ''} require${unresolvedHigh.length === 1 ? 's' : ''} attention`
      )
    }

    // Fire safety
    const fireSafety = incidents.filter(
      (i) => i.category === 'fire_safety' && openStatuses.includes(i.status)
    )
    if (fireSafety.length > 0) {
      recs.push('Active fire safety incidents - ensure evacuation routes are clear')
    }

    // High volume location
    if (hotspots.length > 0 && hotspots[0][1] >= 5) {
      recs.push(
        `${hotspots[0][0]} has ${hotspots[0][1]} incidents - consider dedicated response team`
      )
    }

    if (recs.length === 0) {
      recs.push('No critical patterns detected - continue routine monitoring')
    }

    return recs
  }, [incidents, hotspots])

  return (
    <div className="liquid-glass rounded-[2rem] ghost-border p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">
            AI Threat Analysis
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-emerald-400 text-xs font-semibold">AI ENGINE ACTIVE</span>
        </div>
      </div>

      {/* Risk Score */}
      <div className="bg-surface-container-low rounded-xl p-6 ghost-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${getRiskColor(riskScore)}`} />
            <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">
              Risk Score
            </span>
          </div>
          <span className={`text-3xl font-bold font-mono ${getRiskColor(riskScore)}`}>
            {riskScore}
          </span>
        </div>
        <div className="w-full bg-background rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${getRiskBgColor(riskScore)}`}
            style={{ width: `${riskScore}%` }}
          />
        </div>
        <p className="text-on-surface/40 text-xs mt-2">
          Based on {incidents.length} total incident{incidents.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Trend Analysis */}
      <div className="bg-surface-container-low rounded-xl p-6 ghost-border">
        <div className="flex items-center gap-2 mb-3">
          {trend.direction === 'up' ? (
            <TrendingUp className="w-4 h-4 text-red-500" />
          ) : trend.direction === 'down' ? (
            <TrendingDown className="w-4 h-4 text-emerald-500" />
          ) : (
            <Zap className="w-4 h-4 text-amber-500" />
          )}
          <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">
            Trend Analysis
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span
              className={`text-lg font-bold ${
                trend.direction === 'up'
                  ? 'text-red-500'
                  : trend.direction === 'down'
                    ? 'text-emerald-500'
                    : 'text-amber-500'
              }`}
            >
              {trend.label}
            </span>
            <p className="text-on-surface/40 text-xs mt-1">24h comparison</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-on-surface/60">
              Last 24h: <span className="text-on-surface font-semibold">{trend.last24h}</span>
            </p>
            <p className="text-on-surface/40">
              Previous 24h: <span className="text-on-surface/60">{trend.prev24h}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Hotspot Analysis */}
      <div className="bg-surface-container-low rounded-xl p-6 ghost-border">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">
            Hotspot Analysis
          </span>
        </div>
        {hotspots.length === 0 ? (
          <p className="text-on-surface/40 text-sm">No location data available</p>
        ) : (
          <div className="space-y-2">
            {hotspots.map(([location, count], idx) => (
              <div key={location} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-on-surface/40 text-xs font-mono w-4">
                    {idx + 1}.
                  </span>
                  <span className="text-on-surface text-sm">{location}</span>
                </div>
                <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="bg-surface-container-low rounded-xl p-6 ghost-border">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">
            Category Breakdown
          </span>
        </div>
        {categoryBreakdown.length === 0 ? (
          <p className="text-on-surface/40 text-sm">No incidents to analyze</p>
        ) : (
          <div className="space-y-3">
            {categoryBreakdown.map(({ category, count, pct }) => (
              <div key={category}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-on-surface/80">
                    {categoryLabels[category] ?? category}
                  </span>
                  <span className="text-on-surface/40 font-mono text-xs">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Recommendations */}
      <div className="bg-surface-container-low rounded-xl p-6 ghost-border">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">
            AI Recommendations
          </span>
        </div>
        <div className="space-y-2">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-sm"
            >
              <Zap className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <span className="text-on-surface/80">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
