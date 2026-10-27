// Bago City Emergency Services and Government Office Locations
// Coordinates for Leaflet map markers

export interface EmergencyLocation {
  id: string
  name: string
  category: 'fire' | 'police' | 'hospital' | 'government' | 'utility' | 'rescue'
  coordinates: [number, number] // [latitude, longitude]
  address: string
  barangay?: string
  phones: string[]
  email?: string
  available: '24/7' | 'office_hours'
  description?: string
  icon: string
  color: string
}

// Bago City center: approximately 10.5380°N, 122.8424°E
// Note: These are approximate coordinates. Please verify exact locations!

export const EMERGENCY_LOCATIONS: EmergencyLocation[] = [
  // FIRE STATIONS
  {
    id: 'fire-main',
    name: 'Bago Fire Station',
    category: 'fire',
    coordinates: [10.5380, 122.8424], // Near City Hall - verify exact location
    address: 'Bago City, Negros Occidental',
    barangay: 'Poblacion',
    phones: ['(034) 445-8332', '0939-424-8377'],
    email: 'bagocityfirestation@gmail.com',
    available: '24/7',
    description: 'Main fire station for Bago City. Available 24/7 for fire emergencies.',
    icon: '🚒',
    color: '#dc2626' // red
  },
  {
    id: 'fire-maao',
    name: 'Bago Fire Sub-Station (Ma-ao)',
    category: 'fire',
    coordinates: [10.5500, 122.8600], // Ma-ao area - verify exact location
    address: 'Ma-ao, Bago City',
    barangay: 'Ma-ao',
    phones: ['0981-558-3788'],
    email: 'maaosubstation@gmail.com',
    available: '24/7',
    description: 'Fire sub-station serving Ma-ao and surrounding barangays.',
    icon: '🚒',
    color: '#dc2626'
  },

  // POLICE STATION
  {
    id: 'police-station',
    name: 'Bago City Police Station',
    category: 'police',
    coordinates: [10.5370, 122.8420], // Near City Hall - verify exact location
    address: 'Bago City, Negros Occidental',
    barangay: 'Poblacion',
    phones: ['(034) 471-1660', '0929-821-5539'],
    email: 'bccps01@gmail.com',
    available: '24/7',
    description: 'Main police station. Available 24/7 for law enforcement and emergencies.',
    icon: '👮',
    color: '#1e40af' // blue
  },

  // HOSPITALS & HEALTH CENTERS
  {
    id: 'city-hospital',
    name: 'Bago City Hospital',
    category: 'hospital',
    coordinates: [10.5360, 122.8430], // Near Poblacion - verify exact location
    address: 'Bago City, Negros Occidental',
    barangay: 'Poblacion',
    phones: ['(034) 435-1690'],
    email: 'hospitalbagocity@yahoo.com',
    available: '24/7',
    description: 'Main public hospital providing emergency and general healthcare services.',
    icon: '🏥',
    color: '#059669' // green
  },

  // RESCUE SERVICES
  {
    id: 'maao-rescue',
    name: 'Ma-ao Volunteers Rescue Unit',
    category: 'rescue',
    coordinates: [10.5500, 122.8590], // Ma-ao area - verify exact location
    address: 'Ma-ao, Bago City',
    barangay: 'Ma-ao',
    phones: ['0966-579-6001'],
    available: '24/7',
    description: 'Volunteer rescue unit serving Ma-ao and surrounding areas.',
    icon: '🚑',
    color: '#ea580c' // orange
  },

  // GOVERNMENT OFFICES
  {
    id: 'city-hall',
    name: 'Bago City Hall',
    category: 'government',
    coordinates: [10.5380, 122.8424], // City center
    address: 'Poblacion, Bago City, Negros Occidental',
    barangay: 'Poblacion',
    phones: ['(034) 447-8181'],
    available: 'office_hours',
    description: 'Main government center. Houses various city offices including CDRRMC.',
    icon: '🏛️',
    color: '#6366f1' // indigo
  },
  {
    id: 'cdrrmc',
    name: 'CDRRMC (Disaster Management)',
    category: 'government',
    coordinates: [10.5380, 122.8424], // Inside City Hall
    address: 'Bago City Hall, Poblacion',
    barangay: 'Poblacion',
    phones: ['(034) 473-0043', '0933-693-6444', '0927-022-4884', '(034) 431-5085'],
    email: 'bagodrrm@gmail.com',
    available: '24/7',
    description: 'City Disaster Risk Reduction and Management Council. 24/7 emergency coordination.',
    icon: '🚨',
    color: '#dc2626'
  },
  {
    id: 'health-office',
    name: 'City Health Office',
    category: 'government',
    coordinates: [10.5380, 122.8424], // Inside City Hall
    address: 'Bago City Hall, Poblacion',
    barangay: 'Poblacion',
    phones: ['(034) 447-8181 loc. 246', '0967-632-5766'],
    email: 'cityhealthbago@yahoo.com',
    available: 'office_hours',
    description: 'City Health Office. One Hospital Command: 0967-632-5766',
    icon: '⚕️',
    color: '#059669'
  },
  {
    id: 'bago-college',
    name: 'Bago City College',
    category: 'government',
    coordinates: [10.5400, 122.8450], // Approximate - verify exact location
    address: 'Bago City, Negros Occidental',
    phones: ['(034) 461-0963', '(034) 461-1038'],
    email: 'bagocitycollege@gmail.com',
    available: 'office_hours',
    description: 'Public city college. May serve as evacuation center during disasters.',
    icon: '🏫',
    color: '#6366f1'
  }
]

// Helper functions
export function getLocationsByCategory(category: EmergencyLocation['category']) {
  return EMERGENCY_LOCATIONS.filter(loc => loc.category === category)
}

export function get24x7Locations() {
  return EMERGENCY_LOCATIONS.filter(loc => loc.available === '24/7')
}

export function getLocationById(id: string) {
  return EMERGENCY_LOCATIONS.find(loc => loc.id === id)
}

export function searchLocations(query: string) {
  const lowerQuery = query.toLowerCase()
  return EMERGENCY_LOCATIONS.filter(
    loc =>
      loc.name.toLowerCase().includes(lowerQuery) ||
      loc.description?.toLowerCase().includes(lowerQuery) ||
      loc.barangay?.toLowerCase().includes(lowerQuery) ||
      loc.address.toLowerCase().includes(lowerQuery)
  )
}

// Map center for Bago City
export const BAGO_CITY_CENTER: [number, number] = [10.5380, 122.8424]
export const DEFAULT_ZOOM = 14

// Category filters for map
export const LOCATION_CATEGORIES = [
  { value: 'fire', label: 'Fire Stations', icon: '🚒', color: '#dc2626' },
  { value: 'police', label: 'Police', icon: '👮', color: '#1e40af' },
  { value: 'hospital', label: 'Hospitals', icon: '🏥', color: '#059669' },
  { value: 'rescue', label: 'Rescue Units', icon: '🚑', color: '#ea580c' },
  { value: 'government', label: 'Government Offices', icon: '🏛️', color: '#6366f1' }
] as const

// Note: Coordinates are approximate and should be verified with actual GPS coordinates
// To get exact coordinates:
// 1. Visit each location with a GPS device or smartphone
// 2. Use Google Maps and right-click on the location
// 3. Update the coordinates in this file
