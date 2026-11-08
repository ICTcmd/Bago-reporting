'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Crosshair, X } from 'lucide-react'

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom red marker icon for incident location
const incidentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface LocationPickerProps {
  initialLat: number
  initialLng: number
  onLocationChange: (lat: number, lng: number, address: string) => void
  onClose: () => void
}

// Component to handle map click events
function MapClickHandler({ 
  onLocationSelect 
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

export default function LocationPicker({ 
  initialLat, 
  initialLng, 
  onLocationChange,
  onClose 
}: LocationPickerProps) {
  // Default to Bago City center if no initial position
  const bagoCity

Center = {
    lat: 10.5380,
    lng: 122.8424
  }
  
  const [position, setPosition] = useState<[number, number]>([
    initialLat || bagoCityCenter.lat,
    initialLng || bagoCityCenter.lng
  ])
  const [address, setAddress] = useState('Loading address...')
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)

  // Reverse geocode to get address from coordinates
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

  // Load initial address
  useEffect(() => {
    reverseGeocode(position[0], position[1])
  }, [])

  // Handle location selection
  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition([lat, lng])
    reverseGeocode(lat, lng)
  }

  // Use current device location
  const handleUseMyLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setPosition([lat, lng])
          reverseGeocode(lat, lng)
        },
        (error) => {
          alert('Unable to get your location. Please click on the map to select a location.')
        }
      )
    } else {
      alert('Geolocation is not supported by your browser')
    }
  }

  // Confirm location selection
  const handleConfirm = () => {
    onLocationChange(position[0], position[1], address)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Pin Incident Location</h2>
              <p className="text-sm text-blue-100">Click anywhere on the map of Bago City to mark the incident location</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
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
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            <Marker position={position} icon={incidentIcon} />
          </MapContainer>

          {/* Use My Location Button - Floating on map */}
          <button
            onClick={handleUseMyLocation}
            className="absolute top-4 right-4 z-[1000] bg-white hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 font-semibold border border-gray-200"
          >
            <Crosshair className="h-5 w-5 text-blue-600" />
            <span className="hidden sm:inline">Use My Location</span>
          </button>

          {/* Instructions - Floating on map */}
          <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">
                  {isLoadingAddress ? 'Loading address...' : 'Selected Location:'}
                </p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {address}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Tip:</span> Click anywhere on the map to move the pin
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoadingAddress}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <MapPin className="h-5 w-5" />
              Confirm Location
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
