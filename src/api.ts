import type { Incident, IncidentStats, StatusUpdate } from './types'

const BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function submitReport(formData: FormData): Promise<Incident> {
  return request<Incident>('/reports', {
    method: 'POST',
    body: formData,
  })
}

export interface IncidentFilters {
  status?: string
  severity?: string
  category?: string
  search?: string
  sort?: string
  order?: string
}

export async function getIncidents(filters?: IncidentFilters): Promise<Incident[]> {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
  }
  const query = params.toString()
  return request<Incident[]>(`/incidents${query ? `?${query}` : ''}`)
}

export async function getIncidentStats(): Promise<IncidentStats> {
  return request<IncidentStats>('/incidents/stats')
}

export async function getIncident(
  id: string
): Promise<Incident & { status_updates: StatusUpdate[] }> {
  return request<Incident & { status_updates: StatusUpdate[] }>(
    `/incidents/${id}`
  )
}

export async function updateIncident(
  id: string,
  data: Record<string, unknown>
): Promise<Incident & { status_updates: StatusUpdate[] }> {
  return request<Incident & { status_updates: StatusUpdate[] }>(`/incidents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function trackReport(code: string): Promise<Incident & { status_updates: StatusUpdate[] }> {
  return request<Incident & { status_updates: StatusUpdate[] }>(`/track/${code}`)
}
