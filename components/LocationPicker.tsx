'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Crosshair, X, Search, Loader2 } from 'lucide-react'

// Self-contained SVG pin icon so markers never break due to external CDN/GitHub failures
const incidentIcon = L.divIcon({
  className: 'custom-location-pin',
  html: `
    <div style="position: relative; width: 32px; height: 42px; display: flex; align-items: center; justify-content: center;">
      <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
        <path d="M16 0C7.163 0 0 7.163 0 16C0 28 16 42 16 42C16 42 32 28 32 16C32 7.163 24.837 0 16 0Z" fill="#DC2626"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>
    </div>
  `,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -40],
})

interface SearchResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface LocationPickerProps {
  initialLat: number
  initialLng: number
  onLocationChange: (lat: number, lng: number, address: string) => void
  onClose: () => void
}

function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function MapRecenter({ center, zoomTarget }: { center: [number, number]; zoomTarget?: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoomTarget ?? Math.max(map.getZoom(), 15), { duration: 0.6 })
  }, [center[0], center[1], zoomTarget, map])
  return null
}

export default function LocationPicker({
  initialLat,
  initialLng,
  onLocationChange,
  onClose,
}: LocationPickerProps) {
  const bagoCityCenter = {
    lat: 10.5380,
    lng: 122.8424,
  }

  const [position, setPosition] = useState<[number, number]>([
    initialLat || bagoCityCenter.lat,
    initialLng || bagoCityCenter.lng,
  ])
  const [flyTarget, setFlyTarget] = useState<{ coords: [number, number]; zoom?: number }>({
    coords: [initialLat || bagoCityCenter.lat, initialLng || bagoCityCenter.lng],
    zoom: 14,
  })
  const [address, setAddress] = useState('Loading address...')
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsLoadingAddress(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      const data = await response.json()

      if (data.display_name) {
        setAddress(data.display_name)
      } else {
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    } finally {
      setIsLoadingAddress(false)
    }
  }

  useEffect(() => {
    reverseGeocode(position[0], position[1])
  }, [])

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition([lat, lng])
    setSearchResults([])
    reverseGeocode(lat, lng)
  }

  const handleUseMyLocation = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setPosition([lat, lng])
        setFlyTarget({ coords: [lat, lng], zoom: 16 })
        setSearchResults([])
        reverseGeocode(lat, lng)
        setIsLocating(false)
      },
      () => {
        setIsLocating(false)
        alert('Unable to get your location. Please click on the map to select a location.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (!query) return

    setIsSearching(true)
    setSearchError('')
    try {
      const boundedQuery = query.toLowerCase().includes('bago')
        ? query
        : `${query}, Bago City, Negros Occidental`
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        boundedQuery
      )}&viewbox=122.75,10.65,123.05,10.42&limit=5`
      const response = await fetch(url)
      const data: SearchResult[] = await response.json()

      if (!data || data.length === 0) {
        setSearchResults([])
        setSearchError('No matching place found. Try a barangay, street, or landmark.')
      } else {
        setSearchResults(data)
      }
    } catch {
      setSearchError('Search failed. You can still click directly on the map.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectSearchResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    setPosition([lat, lng])
    setFlyTarget({ coords: [lat, lng], zoom: 16 })
    setAddress(result.display_name)
    setSearchResults([])
    setSearchError('')
  }

  const handleConfirm = () => {
    onLocationChange(position[0], position[1], address)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[88vh] max-h-[680px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">Pin Incident Location</h2>
              <p className="text-xs sm:text-sm text-blue-100 truncate">
                Search a place, use GPS, or click on the map
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close location picker"
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white flex-shrink-0"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 relative flex-shrink-0">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search barangay, street, or landmark in Bago City..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>

          {searchError && (
            <p className="text-xs text-red-600 mt-1.5">{searchError}</p>
          )}

          {searchResults.length > 0 && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[1005] max-h-52 overflow-y-auto divide-y divide-gray-100">
              {searchResults.map((res) => (
                <button
                  key={res.place_id}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 transition-colors flex items-start gap-2.5"
                >
                  <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-800 line-clamp-2">{res.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 relative min-h-[260px]">
          <MapContainer
            center={position}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            className="z-10"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapRecenter center={flyTarget.coords} zoomTarget={flyTarget.zoom} />
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            <Marker position={position} icon={incidentIcon} />
          </MapContainer>

          {/* Use My Location Button */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="absolute top-3 right-3 z-[1000] bg-white hover:bg-gray-50 text-gray-700 px-3.5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 font-semibold text-sm border border-gray-200 disabled:opacity-70"
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4 text-blue-600" />
            )}
            <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'Use My Location'}</span>
          </button>

          {/* Selected Address Overlay */}
          <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 border border-gray-200">
            <div className="flex items-start gap-2.5">
              <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                  {isLoadingAddress ? 'Resolving address...' : 'Selected Location:'}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 line-clamp-2">
                  {address}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-4 sm:px-6 py-3.5 border-t flex items-center justify-between gap-3 flex-shrink-0">
          <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
            <span className="font-semibold">Tip:</span> Click anywhere on the map to move the pin
          </p>
          <div className="flex gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 sm:px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-sm text-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoadingAddress}
              className="px-5 sm:px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
