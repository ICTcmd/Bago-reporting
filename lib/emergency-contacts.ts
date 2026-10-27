// Bago City Emergency Contacts and Government Offices
// Source: Official Bago City Contact Directory

export interface EmergencyContact {
  id: string
  name: string
  category: 'emergency' | 'government' | 'health' | 'safety' | 'utility'
  phones: string[]
  email?: string[]
  available: '24/7' | 'office_hours' | 'always'
  priority: 'critical' | 'high' | 'medium'
  icon?: string
}

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  // CRITICAL EMERGENCY SERVICES (24/7)
  {
    id: 'cdrrmc',
    name: 'CDRRMC (City Disaster Risk Reduction Management Council)',
    category: 'emergency',
    phones: [
      '(034) 473-0043', // 24/7
      '0933-693-6444', // 24/7
      '0927-022-4884', // 24/7
      '(034) 431-5085' // Office hours
    ],
    email: ['bagodrrm@gmail.com'],
    available: '24/7',
    priority: 'critical',
    icon: '🚨'
  },
  {
    id: 'police',
    name: 'Bago City Police Station',
    category: 'safety',
    phones: [
      '(034) 471-1660',
      '0929-821-5539'
    ],
    email: ['bccps01@gmail.com', 'bagopnp.a2020@gmail.com'],
    available: '24/7',
    priority: 'critical',
    icon: '👮'
  },
  {
    id: 'fire-station',
    name: 'Bago Fire Station',
    category: 'emergency',
    phones: [
      '(034) 445-8332',
      '0939-424-8377'
    ],
    email: ['bagocityfirestation@gmail.com'],
    available: '24/7',
    priority: 'critical',
    icon: '🚒'
  },
  {
    id: 'fire-maao',
    name: 'Bago Fire Sub-Station (Ma-ao)',
    category: 'emergency',
    phones: ['0981-558-3788'],
    email: ['maaosubstation@gmail.com'],
    available: '24/7',
    priority: 'critical',
    icon: '🚒'
  },
  {
    id: 'maao-rescue',
    name: 'Ma-ao Volunteers Rescue Unit',
    category: 'emergency',
    phones: ['0966-579-6001'],
    available: '24/7',
    priority: 'critical',
    icon: '🚑'
  },

  // HEALTH SERVICES
  {
    id: 'hospital',
    name: 'Bago City Hospital',
    category: 'health',
    phones: ['(034) 435-1690'],
    email: [
      'hospitalbagocity@yahoo.com',
      'nso.bagocityhospital@gmail.com'
    ],
    available: 'always',
    priority: 'critical',
    icon: '🏥'
  },
  {
    id: 'health-office',
    name: 'City Health Office',
    category: 'health',
    phones: [
      '(034) 447-8181 loc. 246',
      '0967-632-5766' // One Hospital Command
    ],
    email: ['cityhealthbago@yahoo.com'],
    available: 'office_hours',
    priority: 'high',
    icon: '⚕️'
  },

  // GOVERNMENT OFFICES
  {
    id: 'city-hall',
    name: 'Bago City Hall Trunkline',
    category: 'government',
    phones: ['(034) 447-8181'],
    available: 'office_hours',
    priority: 'high',
    icon: '🏛️'
  },
  {
    id: 'mayor-office',
    name: "Mayor's Office",
    category: 'government',
    phones: ['(034) 447-8181 loc. 202'],
    email: ['cmo_bago@yahoo.com'],
    available: 'office_hours',
    priority: 'high',
    icon: '👨‍💼'
  },
  {
    id: 'environment-office',
    name: 'City Environment Office',
    category: 'government',
    phones: ['(034) 447-8181 loc. 234'],
    email: ['cemobagocity2021@gmail.com'],
    available: 'office_hours',
    priority: 'medium',
    icon: '🌳'
  },
  {
    id: 'cswdo',
    name: 'CSWDO (City Social Welfare Development Office)',
    category: 'government',
    phones: ['(034) 447-8181 loc. 236'],
    email: ['cswdo_bagocity@yahoo.com', 'cswdo.bagocity@gmail.com'],
    available: 'office_hours',
    priority: 'medium',
    icon: '🤝'
  },
  {
    id: 'vet-office',
    name: 'City Veterinary Office',
    category: 'government',
    phones: ['(034) 454-2315'],
    email: ['vetbagocity@gmail.com'],
    available: 'office_hours',
    priority: 'medium',
    icon: '🐾'
  },
  {
    id: 'tourism',
    name: 'Tourism Office',
    category: 'government',
    phones: ['(034) 703-8619'],
    email: ['tourismaffairsbago@gmail.com', 'tourismbago@yahoo.com'],
    available: 'office_hours',
    priority: 'medium',
    icon: '🗺️'
  },
  {
    id: 'info-office',
    name: 'City Information Office',
    category: 'government',
    phones: ['(034) 447-8181 loc. 205'],
    email: ['thecitybridge@yahoo.com'],
    available: 'office_hours',
    priority: 'medium',
    icon: '📢'
  },

  // EDUCATION
  {
    id: 'deped',
    name: 'DepEd Public Assistance Command Center',
    category: 'government',
    phones: ['(034) 445-7843', '(034) 731-9034'],
    email: ['deped.bagocity@deped.gov.ph'],
    available: 'office_hours',
    priority: 'medium',
    icon: '🎓'
  },
  {
    id: 'bcc',
    name: 'Bago City College',
    category: 'government',
    phones: ['(034) 461-0963', '(034) 461-1038'],
    email: ['bagocitycollege@gmail.com'],
    available: 'office_hours',
    priority: 'medium',
    icon: '🏫'
  },

  // UTILITIES
  {
    id: 'power',
    name: 'Negros Power (NEPC)',
    category: 'utility',
    phones: ['0962-705-8632', '0917-113-3215'],
    email: ['customercare@negrospower.ph'],
    available: 'always',
    priority: 'high',
    icon: '⚡'
  },
  {
    id: 'water',
    name: 'Primewater Bago City',
    category: 'utility',
    phones: ['(034) 441-809', '(034) 732-8177'],
    email: ['primewaterBago@primewatercorp.com'],
    available: 'office_hours',
    priority: 'high',
    icon: '💧'
  }
]

// Helper functions
export function getEmergencyContacts() {
  return EMERGENCY_CONTACTS.filter(c => c.available === '24/7')
}

export function getCriticalContacts() {
  return EMERGENCY_CONTACTS.filter(c => c.priority === 'critical')
}

export function getContactsByCategory(category: EmergencyContact['category']) {
  return EMERGENCY_CONTACTS.filter(c => c.category === category)
}

export function searchContacts(query: string) {
  const lowerQuery = query.toLowerCase()
  return EMERGENCY_CONTACTS.filter(
    c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.phones.some(p => p.includes(query)) ||
      c.email?.some(e => e.toLowerCase().includes(lowerQuery))
  )
}

export function getContactById(id: string) {
  return EMERGENCY_CONTACTS.find(c => c.id === id)
}

// Categories for filtering
export const CONTACT_CATEGORIES = [
  { value: 'emergency', label: 'Emergency Services', icon: '🚨' },
  { value: 'health', label: 'Health Services', icon: '🏥' },
  { value: 'safety', label: 'Public Safety', icon: '👮' },
  { value: 'government', label: 'Government Offices', icon: '🏛️' },
  { value: 'utility', label: 'Utilities', icon: '⚡' }
] as const
