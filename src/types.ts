export type Severity = 'critical' | 'high' | 'medium' | 'low'

export type Status = 'reported' | 'acknowledged' | 'dispatched' | 'in_progress' | 'resolved' | 'closed'

export type Category =
  | 'electrical'
  | 'structural'
  | 'fire_safety'
  | 'chemical'
  | 'accessibility'
  | 'water_damage'
  | 'lighting'
  | 'environmental'
  | 'security'
  | 'other'

export type Urgency = 'emergency' | 'urgent' | 'soon' | 'when_possible'

export interface Incident {
  id: string
  tracking_code: string
  title: string
  description: string
  category: Category
  severity: Severity
  status: Status
  location: string
  location_detail: string
  reported_by_name: string
  reported_by_email: string
  reported_by_phone: string
  photo_url: string | null
  assigned_team: string
  assigned_to: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  classification?: {
    severity: Severity
    assigned_team: string
    reasoning: string
  }
  status_updates?: StatusUpdate[]
}

export interface StatusUpdate {
  id: number
  incident_id: string
  old_status: string | null
  new_status: string
  note: string | null
  updated_by: string
  created_at: string
}

export interface IncidentStats {
  total: number
  by_status: Record<string, number>
  by_severity: Record<string, number>
  by_category: Record<string, number>
  recent_24h: number
  avg_resolution_time_hours: number | null
}

export interface ReportFormData {
  title: string
  description: string
  category: Category
  urgency: Urgency
  location: string
  location_detail: string
  reported_by_name: string
  reported_by_email: string
  reported_by_phone: string
  photo: File | null
}
