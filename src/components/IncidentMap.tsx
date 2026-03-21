import { useState, useCallback, useEffect, useRef } from 'react'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import { MapPin } from 'lucide-react'
import type { Incident, Severity } from '../types'

const GOOGLE_MAPS_API_KEY = ''

interface IncidentMapProps {
  incidents: Incident[]
}

const darkMapStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0b1326' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1326' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7db3' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8fa4d9' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b7db3' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#101d3a' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#141e38' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1a2744' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#1a2744' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f3058' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#101d3a' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#060d1e' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3a5089' }],
  },
]

const severityMarkerColor: Record<Severity, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
}

const severityLabel: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const severityTextColor: Record<Severity, string> = {
  critical: 'text-red-500',
  high: 'text-orange-500',
  medium: 'text-amber-500',
  low: 'text-emerald-500',
}

function getMarkerIcon(severity: Severity): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: severityMarkerColor[severity],
    fillOpacity: 0.9,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 10,
  }
}

interface IncidentWithCoords extends Incident {
  latitude?: number
  longitude?: number
}

const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '1rem',
}

const defaultCenter = { lat: 40.7128, lng: -74.006 }

export default function IncidentMap({ incidents }: IncidentMapProps) {
  const [selectedIncident, setSelectedIncident] = useState<IncidentWithCoords | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)

  const incidentsWithCoords = (incidents as IncidentWithCoords[]).filter(
    (i) => i.latitude != null && i.longitude != null
  )

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map

      if (incidentsWithCoords.length > 0) {
        const bounds = new google.maps.LatLngBounds()
        for (const inc of incidentsWithCoords) {
          bounds.extend({ lat: inc.latitude!, lng: inc.longitude! })
        }
        map.fitBounds(bounds, 60)
      }
    },
    [incidentsWithCoords]
  )

  useEffect(() => {
    if (mapRef.current && incidentsWithCoords.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      for (const inc of incidentsWithCoords) {
        bounds.extend({ lat: inc.latitude!, lng: inc.longitude! })
      }
      mapRef.current.fitBounds(bounds, 60)
    }
  }, [incidentsWithCoords])

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="bg-surface-container-low rounded-xl p-6 ghost-border space-y-4">
        <div className="flex flex-col items-center justify-center gap-3 h-[400px]">
          <MapPin className="w-10 h-10 text-primary opacity-50" />
          <p className="text-on-surface/60 text-sm text-center">
            Configure Google Maps API key to enable incident map
          </p>
        </div>

        {/* Fallback: list incidents with locations */}
        {incidents.length > 0 && (
          <div>
            <p className="font-label text-[10px] uppercase tracking-widest text-primary font-bold mb-3">
              Incident Locations
            </p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="flex items-center justify-between bg-background rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        inc.severity === 'critical'
                          ? 'bg-red-500'
                          : inc.severity === 'high'
                            ? 'bg-orange-500'
                            : inc.severity === 'medium'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                      }`}
                    />
                    <span className="text-on-surface text-sm truncate">{inc.title}</span>
                  </div>
                  <span className="text-on-surface/40 text-xs shrink-0 ml-2">
                    {inc.location}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 px-1">
        {(['critical', 'high', 'medium', 'low'] as Severity[]).map((sev) => (
          <div key={sev} className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                sev === 'critical'
                  ? 'bg-red-500'
                  : sev === 'high'
                    ? 'bg-orange-500'
                    : sev === 'medium'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
              }`}
            />
            <span className="text-on-surface/60 text-xs capitalize">{sev}</span>
          </div>
        ))}
        <span className="text-on-surface/30 text-xs ml-auto">
          {incidentsWithCoords.length} of {incidents.length} mapped
        </span>
      </div>

      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
        <div className="rounded-xl overflow-hidden ghost-border">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={12}
            onLoad={onMapLoad}
            options={{
              styles: darkMapStyles,
              disableDefaultUI: false,
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
            }}
          >
            {incidentsWithCoords.map((inc) => (
              <Marker
                key={inc.id}
                position={{ lat: inc.latitude!, lng: inc.longitude! }}
                icon={getMarkerIcon(inc.severity)}
                onClick={() => setSelectedIncident(inc)}
              />
            ))}

            {selectedIncident && selectedIncident.latitude != null && selectedIncident.longitude != null && (
              <InfoWindow
                position={{
                  lat: selectedIncident.latitude,
                  lng: selectedIncident.longitude,
                }}
                onCloseClick={() => setSelectedIncident(null)}
              >
                <div className="bg-[#0b1326] text-[#dae2fd] p-3 rounded-lg min-w-[200px]">
                  <h3 className="font-semibold text-sm mb-1">{selectedIncident.title}</h3>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-bold ${severityTextColor[selectedIncident.severity]}`}
                    >
                      {severityLabel[selectedIncident.severity]}
                    </span>
                    <span className="text-[#dae2fd]/40">|</span>
                    <span className="text-xs text-[#dae2fd]/60 capitalize">
                      {selectedIncident.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-[#dae2fd]/50">{selectedIncident.location}</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      </LoadScript>
    </div>
  )
}
