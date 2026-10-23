'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface Incident {
  id: string
  reference_number: string
  title: string
  description: string
  category: string
  severity: string
  status: string
  location_lat: number
  location_lng: number
  address_text: string
  created_at: string
}

interface IncidentMapProps {
  incidents: Incident[]
  center?: [number, number]
  zoom?: number
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return '#dc2626'
    case 'high': return '#ea580c'
    case 'medium': return '#f59e0b'
    case 'low': return '#3b82f6'
    default: return '#6b7280'
  }
}

const createCustomIcon = (severity: string) => {
  const color = getSeverityColor(severity)
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 3px 8px rgba(0,0,0,0.4);
      ">
        <div style="
          transform: rotate(45deg);
          text-align: center;
          line-height: 26px;
          color: white;
          font-weight: bold;
          font-size: 14px;
        ">!</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  })
}

export default function IncidentMap({ incidents, center = [10.5380, 122.8424], zoom = 13 }: IncidentMapProps) {
  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {incidents.map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.location_lat, incident.location_lng]}
            icon={createCustomIcon(incident.severity)}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-gray-200 uppercase">
                    {incident.severity}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-blue-200 uppercase">
                    {incident.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-bold text-sm mb-1">{incident.title}</h3>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{incident.description}</p>
                <p className="text-xs text-gray-500 mb-2">📍 {incident.address_text}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                  <span className="font-mono">{incident.reference_number}</span>
                  <span>{new Date(incident.created_at).toLocaleDateString()}</span>
                </div>
                {/* Note: Reporter contact info NOT displayed for privacy */}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <h4 className="text-xs font-bold mb-2">Severity</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span className="text-xs">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-600"></div>
            <span className="text-xs">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-xs">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs">Low</span>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <p className="text-xs text-gray-600">Active Incidents</p>
        <p className="text-2xl font-bold text-gray-900">{incidents.length}</p>
      </div>
    </div>
  )
}
