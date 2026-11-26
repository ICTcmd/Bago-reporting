'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { RotateCcw } from 'lucide-react'

export interface MapIncident {
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
  incidents: MapIncident[]
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
    className: `custom-marker severity-${severity}`,
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
    popupAnchor: [0, -32],
  })
}

function MapBoundsController({
  incidents,
  defaultCenter,
  defaultZoom,
  resetTick,
}: {
  incidents: MapIncident[]
  defaultCenter: [number, number]
  defaultZoom: number
  resetTick: number
}) {
  const map = useMap()

  useEffect(() => {
    const valid = incidents.filter(
      (i) => typeof i.location_lat === 'number' && typeof i.location_lng === 'number'
    )
    if (valid.length === 1) {
      map.flyTo([valid[0].location_lat, valid[0].location_lng], 15, { duration: 0.5 })
    } else if (valid.length > 1) {
      const bounds = L.latLngBounds(valid.map((i) => [i.location_lat, i.location_lng]))
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 })
    }
  }, [incidents, map])

  useEffect(() => {
    if (resetTick > 0) {
      map.flyTo(defaultCenter, defaultZoom, { duration: 0.5 })
    }
  }, [resetTick, defaultCenter, defaultZoom, map])

  return null
}

export default function IncidentMap({
  incidents,
  center = [10.5380, 122.8424],
  zoom = 13,
}: IncidentMapProps) {
  const [resetTick, setResetTick] = useState(0)

  const createClusterCustomIcon = (cluster: any) => {
    const markers = cluster.getAllChildMarkers()
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }

    markers.forEach((marker: any) => {
      const className: string = marker.options?.icon?.options?.className || ''
      const match = className.match(/severity-(\w+)/)
      const severity = match?.[1]
      if (severity && severityCounts[severity as keyof typeof severityCounts] !== undefined) {
        severityCounts[severity as keyof typeof severityCounts]++
      }
    })

    let color = '#6b7280'
    if (severityCounts.critical > 0) {
      color = '#dc2626'
    } else if (severityCounts.high > 0) {
      color = '#ea580c'
    } else if (severityCounts.medium > 0) {
      color = '#f59e0b'
    } else if (severityCounts.low > 0) {
      color = '#3b82f6'
    }

    const count = markers.length

    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          border: 3px solid white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.4);
        ">${count}</div>
      `,
      className: 'custom-cluster-icon',
      iconSize: L.point(40, 40, true),
    })
  }

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
        <MapBoundsController
          incidents={incidents}
          defaultCenter={center}
          defaultZoom={zoom}
          resetTick={resetTick}
        />

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
        >
          {incidents.map((incident) => (
            <Marker
              key={incident.id}
              position={[incident.location_lat, incident.location_lng]}
              icon={createCustomIcon(incident.severity)}
            >
              <Popup>
                <div className="p-2 min-w-[210px]">
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
                  <p className="text-xs text-gray-500 mb-2">{incident.address_text}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                    <span className="font-mono">{incident.reference_number}</span>
                    <span>{new Date(incident.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-[1000]">
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

      {/* Stats & Reset View */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3">
          <p className="text-xs text-gray-600">Visible Incidents</p>
          <p className="text-2xl font-bold text-gray-900">{incidents.length}</p>
        </div>
        <button
          type="button"
          onClick={() => setResetTick((t) => t + 1)}
          className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg shadow-lg border border-gray-200 flex items-center gap-1.5 text-xs font-semibold transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset View
        </button>
      </div>
    </div>
  )
}
