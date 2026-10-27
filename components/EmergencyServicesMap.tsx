'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { EMERGENCY_LOCATIONS, BAGO_CITY_CENTER, DEFAULT_ZOOM, type EmergencyLocation } from '@/lib/emergency-locations'
import { Phone, Mail, Clock, MapPin } from 'lucide-react'

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface EmergencyServicesMapProps {
  selectedCategories?: string[]
  height?: string
}

// Create custom marker icon based on category
const createLocationIcon = (location: EmergencyLocation) => {
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
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
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
    popupAnchor: [0, -40]
  })
}

export default function EmergencyServicesMap({ 
  selectedCategories = ['fire', 'police', 'hospital', 'rescue', 'government'],
  height = '600px'
}: EmergencyServicesMapProps) {
  
  // Filter locations based on selected categories
  const filteredLocations = EMERGENCY_LOCATIONS.filter(
    loc => selectedCategories.includes(loc.category)
  )

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
        
        {filteredLocations.map((location) => (
          <Marker
            key={location.id}
            position={location.coordinates}
            icon={createLocationIcon(location)}
          >
            <Popup className="custom-popup" maxWidth={300}>
              <div className="p-3">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3 pb-3 border-b">
                  <div 
                    className="text-3xl flex-shrink-0"
                    style={{ 
                      backgroundColor: location.color,
                      borderRadius: '50%',
                      width: '50px',
                      height: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {location.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-gray-900 leading-tight mb-1">
                      {location.name}
                    </h3>
                    <span 
                      className="inline-block px-2 py-1 text-xs font-semibold rounded-full text-white capitalize"
                      style={{ backgroundColor: location.color }}
                    >
                      {location.category}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {location.description && (
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                    {location.description}
                  </p>
                )}

                {/* Contact Information */}
                <div className="space-y-2">
                  {/* Address */}
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-gray-900 font-medium">{location.address}</p>
                      {location.barangay && (
                        <p className="text-gray-500">Barangay {location.barangay}</p>
                      )}
                    </div>
                  </div>

                  {/* Phone Numbers */}
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

                  {/* Email */}
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

                  {/* Availability */}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className={`text-sm font-semibold ${
                      location.available === '24/7' 
                        ? 'text-green-600' 
                        : 'text-blue-600'
                    }`}>
                      {location.available === '24/7' ? '⏰ Open 24/7' : '🕐 Office Hours'}
                    </span>
                  </div>
                </div>

                {/* Call to Action */}
                {location.available === '24/7' && (
                  <div className="mt-4 pt-3 border-t">
                    <a
                      href={`tel:${location.phones[0].replace(/[^0-9+]/g, '')}`}
                      className="block w-full text-center bg-gradient-to-r from-red-600 to-red-500 text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg transition-all"
                    >
                      📞 Call for Emergency
                    </a>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000] max-w-xs">
        <h4 className="text-xs font-bold mb-2 text-gray-900">Emergency Services</h4>
        <div className="space-y-1.5">
          {selectedCategories.map((category) => {
            const locations = filteredLocations.filter(loc => loc.category === category)
            if (locations.length === 0) return null
            
            const firstLocation = locations[0]
            return (
              <div key={category} className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
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

      {/* Instructions */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000] max-w-xs">
        <p className="text-xs text-gray-600">
          <strong>📍 Click markers</strong> to see contact information and call emergency services
        </p>
      </div>
    </div>
  )
}
