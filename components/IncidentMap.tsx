'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Next.js
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

type Incident = {
  id: string
  reference_number: string
  title: string
  description: string
  category: string
  severity: string
  status: string
  latitude: number | null
  longitude: number | null
  location_text: string
  created_at: string
}

interface IncidentMapProps {
  incidents: Incident[]
}

// Custom marker colors based on severity
const getMarkerColor = (severity: string) => {
  switch (severity) {
    case 'critical': return '#dc2626' // red
    case 'high': return '#ea580c' // orange
    case 'medium': return '#f59e0b' // amber
    case 'low': return '#3b82f6' // blue
    default: return '#6b7280' // gray
  }
}

const createCustomIcon = (severity: string, status: string) => {
  const color = getMarkerColor(severity)
  const opacity = status === 'resolved' || status === 'closed' ? 0.5 : 1
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        opacity: ${opacity};
      ">
        <div style="
          transform: rotate(45deg);
          text-align: center;
          line-height: 24px;
          color: white;
          font-weight: bold;
          font-size: 12px;
        ">!</div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  })
}

export default function IncidentMap({ incidents }: IncidentMapProps) {
  // Bago City coordinates
  const center: [number, number] = [10.5380, 122.8424]
  
  // Filter incidents with valid coordinates
  const mappableIncidents = incidents.filter(
    i => i.latitude !== null && i.longitude !== null
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'under_review': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-orange-100 text-orange-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {mappableIncidents.map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.latitude!, incident.longitude!]}
            icon={createCustomIcon(incident.severity, incident.status)}
          >
            <Popup className="custom-popup" maxWidth={300}>
              <div className="p-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getStatusColor(incident.status)}`}>
                    {incident.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-200 text-gray-800">
                    {incident.severity.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-bold text-sm mb-1">{incident.title}</h3>
                <p className="text-xs text-gray-600 mb-2">{incident.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                  <span className="font-mono">{incident.reference_number}</span>
                  <span>{new Date(incident.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <h4 className="text-xs font-semibold mb-2">Severity</h4>
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
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-xs">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs">Low</span>
          </div>
        </div>
      </div>
      
      {/* Stats overlay */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <p className="text-xs text-gray-600">Active Incidents</p>
        <p className="text-2xl font-bold text-gray-900">{mappableIncidents.length}</p>
      </div>
    </div>
  )
}
