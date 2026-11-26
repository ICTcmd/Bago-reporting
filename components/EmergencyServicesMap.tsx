'use client'

import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { EMERGENCY_LOCATIONS, BAGO_CITY_CENTER, DEFAULT_ZOOM, type EmergencyLocation } from '@/lib/emergency-locations'
import { Phone, Mail, Clock, MapPin, Crosshair, Navigation, RotateCcw, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface EmergencyServicesMapProps {
  selectedCategories?: string[]
  height?: string
}

const createLocationIcon = (location: EmergencyLocation, isNearest = false) => {
  const ring = isNearest
    ? 'box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.45), 0 4px 12px rgba(0,0,0,0.35);'
    : 'box-shadow: 0 4px 10px rgba(0,0,0,0.3);'
  return L.divIcon({
    className: 'custom-emergency-marker',
    html: `
      <div style="
        background-color: ${location.color};
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        ${ring}
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          font-size: 20px;
        ">${location.icon}</div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  })
}

const userLocationIcon = L.divIcon({
  className: 'user-gps-marker',
  html: `
    <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: rgba(37, 99, 235, 0.25);"></div>
      <div style="width: 12px; height: 12px; border-radius: 50%; background: #2563EB; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35);"></div>
    </div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
})

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function MapViewportController({
  targetBounds,
  resetTick,
}: {
  targetBounds: L.LatLngBoundsExpression | null
  resetTick: number
}) {
  const map = useMap()

  useEffect(() => {
    if (targetBounds) {
      map.fitBounds(targetBounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [targetBounds, map])

  useEffect(() => {
    if (resetTick > 0) {
      map.flyTo(BAGO_CITY_CENTER, DEFAULT_ZOOM, { duration: 0.5 })
    }
  }, [resetTick, map])

  return null
}

export default function EmergencyServicesMap({
  selectedCategories = ['fire', 'police', 'hospital', 'rescue', 'government'],
  height = '600px',
}: EmergencyServicesMapProps) {
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [resetTick, setResetTick] = useState(0)
  const [legendOpen, setLegendOpen] = useState(false)

  const filteredLocations = useMemo(
    () => EMERGENCY_LOCATIONS.filter((loc) => selectedCategories.includes(loc.category)),
    [selectedCategories]
  )

  const nearestResult = useMemo(() => {
    if (!userCoords || filteredLocations.length === 0) return null
    let best: { location: EmergencyLocation; distanceKm: number } | null = null
    for (const loc of filteredLocations) {
      const dist = haversineKm(userCoords[0], userCoords[1], loc.coordinates[0], loc.coordinates[1])
      if (!best || dist < best.distanceKm) {
        best = { location: loc, distanceKm: dist }
      }
    }
    return best
  }, [userCoords, filteredLocations])

  const targetBounds = useMemo<L.LatLngBoundsExpression | null>(() => {
    if (!userCoords || !nearestResult) return null
    return [userCoords, nearestResult.location.coordinates]
  }, [userCoords, nearestResult])

  const handleLocateMe = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords([pos.coords.latitude, pos.coords.longitude])
        setIsLocating(false)
      },
      () => {
        setIsLocating(false)
        alert('Unable to access your GPS location. Please allow location permissions.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="w-full relative" style={{ height }}>
      <MapContainer
        center={BAGO_CITY_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewportController targetBounds={targetBounds} resetTick={resetTick} />

        {userCoords && (
          <Marker position={userCoords} icon={userLocationIcon}>
            <Popup>
              <div className="p-1 text-xs font-semibold text-blue-700">Your Current Location</div>
            </Popup>
          </Marker>
        )}

        {filteredLocations.map((location) => {
          const isNearest = nearestResult?.location.id === location.id
          const distKm = userCoords
            ? haversineKm(userCoords[0], userCoords[1], location.coordinates[0], location.coordinates[1])
            : null
          const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.coordinates[0]},${location.coordinates[1]}`

          return (
            <Marker
              key={location.id}
              position={location.coordinates}
              icon={createLocationIcon(location, isNearest)}
            >
              <Popup className="custom-popup" maxWidth={300}>
                <div className="p-2.5">
                  <div className="flex items-start gap-3 mb-3 pb-3 border-b">
                    <div
                      className="text-2xl flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: location.color }}
                    >
                      {location.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-gray-900 leading-tight mb-1">
                        {location.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full text-white capitalize"
                          style={{ backgroundColor: location.color }}
                        >
                          {location.category}
                        </span>
                        {distKm !== null && (
                          <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {distKm < 1 ? `${Math.round(distKm * 1000)} m away` : `${distKm.toFixed(1)} km away`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {location.description && (
                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                      {location.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">{location.address}</p>
                        {location.barangay && (
                          <p className="text-gray-500">Barangay {location.barangay}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm space-y-1">
                        {location.phones.map((phone, idx) => (
                          <a
                            key={idx}
                            href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                            className="block text-blue-600 hover:text-blue-800 font-medium hover:underline"
                          >
                            {phone}
                          </a>
                        ))}
                      </div>
                    </div>

                    {location.email && (
                      <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                        <a
                          href={`mailto:${location.email}`}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                        >
                          {location.email}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span
                        className={`text-sm font-semibold ${
                          location.available === '24/7' ? 'text-green-600' : 'text-blue-600'
                        }`}
                      >
                        {location.available === '24/7' ? 'Open 24/7' : 'Office Hours'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex flex-col gap-2">
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                    >
                      <Navigation className="h-4 w-4" />
                      Get Directions
                    </a>
                    {location.available === '24/7' && location.phones[0] && (
                      <a
                        href={`tel:${location.phones[0].replace(/[^0-9+]/g, '')}`}
                        className="block w-full text-center bg-gradient-to-r from-red-600 to-red-500 text-white font-bold py-2 px-3 rounded-lg hover:shadow-lg transition-all text-sm"
                      >
                        Call for Emergency
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Top-Right Controls: Locate Nearest & Reset View */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="bg-white hover:bg-gray-50 text-gray-800 px-3.5 py-2.5 rounded-xl shadow-lg border border-gray-200 flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-70"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          ) : (
            <Crosshair className="h-4 w-4 text-blue-600" />
          )}
          <span>{isLocating ? 'Locating...' : 'Find Nearest'}</span>
        </button>
        <button
          type="button"
          onClick={() => setResetTick((t) => t + 1)}
          title="Reset map view to Bago City"
          className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2.5 rounded-xl shadow-lg border border-gray-200 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold transition-colors"
        >
          <RotateCcw className="h-4 w-4 text-gray-600" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Nearest Facility Banner */}
      {nearestResult && (
        <div className="absolute top-16 sm:top-16 right-3 z-[1000] bg-white/95 backdrop-blur-sm border border-blue-200 rounded-xl shadow-lg p-3 max-w-[260px]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            Nearest Facility
          </p>
          <p className="text-sm font-bold text-gray-900 leading-snug mt-0.5">
            {nearestResult.location.icon} {nearestResult.location.name}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            {nearestResult.distanceKm < 1
              ? `${Math.round(nearestResult.distanceKm * 1000)} m away`
              : `${nearestResult.distanceKm.toFixed(1)} km away`}
          </p>
          <div className="flex gap-2 mt-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${nearestResult.location.coordinates[0]},${nearestResult.location.coordinates[1]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center text-xs font-semibold bg-blue-600 text-white py-1.5 px-2 rounded-lg hover:bg-blue-700"
            >
              Directions
            </a>
            {nearestResult.location.phones[0] && (
              <a
                href={`tel:${nearestResult.location.phones[0].replace(/[^0-9+]/g, '')}`}
                className="flex-1 text-center text-xs font-semibold bg-red-600 text-white py-1.5 px-2 rounded-lg hover:bg-red-700"
              >
                Call
              </a>
            )}
          </div>
        </div>
      )}

      {/* Collapsible Map Legend */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg z-[1000] border border-gray-200 overflow-hidden max-w-[220px]">
        <button
          type="button"
          onClick={() => setLegendOpen(!legendOpen)}
          className="w-full px-3 py-2 flex items-center justify-between gap-2 text-xs font-bold text-gray-900 sm:cursor-default"
        >
          <span>Legend ({filteredLocations.length})</span>
          <span className="sm:hidden text-gray-500">
            {legendOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </span>
        </button>
        <div className={`${legendOpen ? 'block' : 'hidden'} sm:block px-3 pb-2.5 space-y-1.5`}>
          {selectedCategories.map((category) => {
            const locations = filteredLocations.filter((loc) => loc.category === category)
            if (locations.length === 0) return null

            const firstLocation = locations[0]
            return (
              <div key={category} className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                  style={{ backgroundColor: firstLocation.color }}
                >
                  {firstLocation.icon}
                </div>
                <span className="text-xs text-gray-700 capitalize">
                  {category} ({locations.length})
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
