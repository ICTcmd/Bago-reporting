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

// Bago City center: Updated with exact GPS coordinates from Google Maps
// Last updated: October 26, 2026

export const EMERGENCY_LOCATIONS: EmergencyLocation[] = [
  // FIRE STATIONS
  {
    id: 'fire-main',
    name: 'Fire Station Bago City',
    category: 'fire',
    coordinates: [10.536528, 122.837639], // Exact location from Google Maps
    address: 'Gen. Luna St, Bago City, Negros Occidental',
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
    name: 'Ma-ao Fire Sub-Station',
    category: 'fire',
    coordinates: [10.561944, 122.863611], // Exact location from Google Maps
    address: 'Ma-ao, Bago City, Negros Occidental',
    barangay: 'Ma-ao',
    phones: ['0981-558-3788', '0975-436-5606'],
    email: 'maaosubstation@gmail.com',
    available: '24/7',
    description: 'Fire sub-station serving Ma-ao and surrounding barangays.',
    icon: '🚒',
    color: '#dc2626'
  },

  // POLICE STATIONS
  {
    id: 'police-maao',
    name: 'Ma-ao Police Station',
    category: 'police',
    coordinates: [10.560833, 122.863333], // Exact location from Google Maps
    address: 'Ma-ao, Bago City, Negros Occidental',
    barangay: 'Ma-ao',
    phones: ['0929-821-5539'],
    available: '24/7',
    description: 'Ma-ao police station serving Ma-ao and surrounding areas.',
    icon: '👮',
    color: '#1e40af' // blue
  },
  {
    id: 'police-dulao',
    name: 'Dulao Police Mobile Force (PNP)',
    category: 'police',
    coordinates: [10.534722, 122.852778], // Exact location from Google Maps
    address: 'Dulao, Bago City, Negros Occidental',
    barangay: 'Dulao',
    phones: ['(034) 471-1660'],
    email: 'bccps01@gmail.com',
    available: '24/7',
    description: 'Police Mobile Force base in Dulao. Available 24/7 for law enforcement and emergencies.',
    icon: '👮',
    color: '#1e40af'
  },

  // HOSPITALS & HEALTH CENTERS
  {
    id: 'city-hospital',
    name: 'Bago City Hospital',
    category: 'hospital',
    coordinates: [10.543056, 122.836389], // Exact location from Google Maps
    address: 'Barangay Road, Bago City, Negros Occidental',
    barangay: 'Poblacion',
    phones: ['(034) 435-1690'],
    email: 'hospitalbagocity@yahoo.com',
    available: '24/7',
    description: 'Main public hospital providing emergency and general healthcare services.',
    icon: '🏥',
    color: '#059669' // green
  },
  {
    id: 'health-office',
    name: 'City Health Office of Bago',
    category: 'hospital',
    coordinates: [10.536111, 122.837222], // Exact location from Google Maps
    address: 'General Luna St, Bago City, Negros Occidental',
    barangay: 'Poblacion',
    phones: ['(034) 447-8181 loc. 246', '0967-632-5766'],
    email: 'cityhealthbago@yahoo.com',
    available: 'office_hours',
    description: 'City Health Office. One Hospital Command: 0967-632-5766',
    icon: '⚕️',
    color: '#059669'
  },

  // RESCUE SERVICES
  {
    id: 'maao-rescue',
    name: 'Ma-ao Volunteers Rescue Unit (MAVRU Team)',
    category: 'rescue',
    coordinates: [10.560556, 122.863889], // Exact location from Google Maps
    address: 'Ma-ao, Bago City, Negros Occidental',
    barangay: 'Ma-ao',
    phones: ['0966-579-6001'],
    available: '24/7',
    description: 'Volunteer rescue unit (MAVRU Team) serving Ma-ao and surrounding areas.',
    icon: '🚑',
    color: '#ea580c' // orange
  },

  // GOVERNMENT OFFICES
  {
    id: 'cdrrmc',
    name: 'Bago CDRRMC Control Center',
    category: 'government',
    coordinates: [10.536389, 122.837500], // Exact location from Google Maps
    address: 'Bago City Hall Compound, General Luna St, Bago City',
    barangay: 'Poblacion',
    phones: ['(034) 473-0043', '0933-693-6444', '0927-022-4884', '(034) 431-5085'],
    email: 'bagodrrm@gmail.com',
    available: '24/7',
    description: 'City Disaster Risk Reduction and Management Council Control Center. 24/7 emergency coordination.',
    icon: '🚨',
    color: '#dc2626'
  },
  {
    id: 'cswdo',
    name: 'CSWDO Bago City',
    category: 'government',
    coordinates: [10.536667, 122.837778], // Exact location from Google Maps
    address: 'General Luna St, Bago City, Negros Occidental',
    barangay: 'Poblacion',
    phones: ['(034) 447-8181 loc. 236'],
    email: 'cswdo_bagocity@yahoo.com',
    available: 'office_hours',
    description: 'City Social Welfare and Development Office providing social services.',
    icon: '🤝',
    color: '#6366f1'
  },
  {
    id: 'vet-office',
    name: 'City Veterinary Office of Bago',
    category: 'government',
    coordinates: [10.537222, 122.838056], // Exact location from Google Maps
    address: 'Bago City, Negros Occidental',
    barangay: 'Poblacion',
    phones: ['(034) 454-2315'],
    email: 'vetbagocity@gmail.com',
    available: 'office_hours',
    description: 'City Veterinary Office for animal health and safety services.',
    icon: '🐾',
    color: '#6366f1'
  },
  {
    id: 'environment-office',
    name: 'City Environment Management Office',
    category: 'government',
    coordinates: [10.536944, 122.837361], // Exact location from Google Maps
    address: 'Bago City Hall, General Luna St, Bago City',
    barangay: 'Poblacion',
    phones: ['(034) 447-8181 loc. 234'],
    email: 'cemobagocity2021@gmail.com',
    available: 'office_hours',
    description: 'City Environment Management Office for environmental concerns.',
    icon: '🌳',
    color: '#059669'
  },
  {
    id: 'tourism-office',
    name: "Bago City Tourism's Office",
    category: 'government',
    coordinates: [10.536806, 122.837472], // Exact location from Google Maps
    address: 'Bago City Hall, General Luna St, Bago City',
    barangay: 'Poblacion',
    phones: ['(034) 703-8619'],
    email: 'tourismaffairsbago@gmail.com',
    available: 'office_hours',
    description: 'Bago City Tourism Office for tourist information and assistance.',
    icon: '🗺️',
    color: '#6366f1'
  },
  {
    id: 'bago-college',
    name: 'Bago City College',
    category: 'government',
    coordinates: [10.528611, 122.838056], // Exact location from Google Maps
    address: 'Rizal Ave, Bago City, Negros Occidental',
    barangay: 'Barangay 3',
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

// Map center for Bago City (updated with exact center coordinates)
export const BAGO_CITY_CENTER: [number, number] = [10.536528, 122.837639] // Fire Station Bago City (central reference point)
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
