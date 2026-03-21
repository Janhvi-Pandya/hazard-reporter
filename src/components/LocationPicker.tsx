import { useState, useCallback } from 'react'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'
import { MapPin } from 'lucide-react'

const GOOGLE_MAPS_API_KEY = ''

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void
  initialLat?: number
  initialLng?: number
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
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3a6e5e' }],
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
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8fa4d9' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#101d3a' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b7db3' }],
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

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '1rem',
}

export default function LocationPicker({
  onLocationSelect,
  initialLat,
  initialLng,
}: LocationPickerProps) {
  const [selectedPos, setSelectedPos] = useState<{ lat: number; lng: number } | null>(
    initialLat !== undefined && initialLng !== undefined
      ? { lat: initialLat, lng: initialLng }
      : null
  )
  const [address, setAddress] = useState('')
  const [manualLat, setManualLat] = useState(initialLat?.toString() ?? '')
  const [manualLng, setManualLng] = useState(initialLng?.toString() ?? '')

  const defaultCenter = {
    lat: initialLat ?? 40.7128,
    lng: initialLng ?? -74.006,
  }

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        setSelectedPos({ lat, lng })
        setManualLat(lat.toFixed(6))
        setManualLng(lng.toFixed(6))
        onLocationSelect(lat, lng, address)
      }
    },
    [address, onLocationSelect]
  )

  const handleManualSubmit = () => {
    const lat = parseFloat(manualLat)
    const lng = parseFloat(manualLng)
    if (!isNaN(lat) && !isNaN(lng)) {
      setSelectedPos({ lat, lng })
      onLocationSelect(lat, lng, address)
    }
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="space-y-4">
        <div className="bg-surface-container-low rounded-xl p-6 ghost-border flex flex-col items-center justify-center gap-3 h-[300px]">
          <MapPin className="w-10 h-10 text-primary opacity-50" />
          <p className="text-on-surface/60 text-sm text-center">
            Configure Google Maps API key to enable location picker
          </p>
        </div>

        <div className="bg-surface-container-low rounded-xl p-6 ghost-border space-y-4">
          <p className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">
            Manual Coordinates
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-on-surface/60 text-xs mb-1 block">Latitude</label>
              <input
                type="number"
                step="any"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="40.7128"
                className="w-full bg-background rounded-lg px-3 py-2 text-on-surface text-sm ghost-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-on-surface/60 text-xs mb-1 block">Longitude</label>
              <input
                type="number"
                step="any"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="-74.0060"
                className="w-full bg-background rounded-lg px-3 py-2 text-on-surface text-sm ghost-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-on-surface/60 text-xs mb-1 block">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address manually"
              className="w-full bg-background rounded-lg px-3 py-2 text-on-surface text-sm ghost-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleManualSubmit}
            className="w-full bg-primary text-on-primary rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Set Location
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
        <div className="rounded-xl overflow-hidden ghost-border">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={selectedPos ?? defaultCenter}
            zoom={13}
            onClick={handleMapClick}
            options={{
              styles: darkMapStyles,
              disableDefaultUI: false,
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
            }}
          >
            {selectedPos && <Marker position={selectedPos} />}
          </GoogleMap>
        </div>
      </LoadScript>

      <div className="bg-surface-container-low rounded-xl p-6 ghost-border space-y-4">
        {selectedPos && (
          <div className="flex gap-4 text-sm">
            <span className="text-on-surface/60">
              Lat: <span className="text-on-surface font-mono">{selectedPos.lat.toFixed(6)}</span>
            </span>
            <span className="text-on-surface/60">
              Lng: <span className="text-on-surface font-mono">{selectedPos.lng.toFixed(6)}</span>
            </span>
          </div>
        )}
        <div>
          <label className="text-on-surface/60 text-xs mb-1 block">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value)
              if (selectedPos) {
                onLocationSelect(selectedPos.lat, selectedPos.lng, e.target.value)
              }
            }}
            placeholder="Enter address or click on map"
            className="w-full bg-background rounded-lg px-3 py-2 text-on-surface text-sm ghost-border focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  )
}
