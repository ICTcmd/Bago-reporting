'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, Home, Filter, Phone } from 'lucide-react'
import dynamic from 'next/dynamic'
import { LOCATION_CATEGORIES, get24x7Locations, EMERGENCY_LOCATIONS } from '@/lib/emergency-locations'

const EmergencyServicesMap = dynamic(() => import('@/components/EmergencyServicesMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full flex items-center justify-center bg-gray-100 rounded-xl">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  )
})

export default function EmergencyMapPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'fire',
    'police',
    'hospital',
    'rescue',
    'government'
  ])
  const [showFilters, setShowFilters] = useState(false)

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  const emergencyServices = get24x7Locations()
  const totalLocations = EMERGENCY_LOCATIONS.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-2 rounded-xl shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Bago Safe
                </h1>
                <p className="text-xs text-gray-600">Emergency Services Map</p>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-semibold transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
            Emergency Services Locations
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Find fire stations, hospitals, police stations, and emergency services across Bago City. 
            Click on markers for contact information.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filter Services</span>
              {selectedCategories.length < LOCATION_CATEGORIES.length && (
                <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {LOCATION_CATEGORIES.length - selectedCategories.length}
                </span>
              )}
            </button>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-medium">{emergencyServices.length} Open 24/7</span>
              </div>
              <div className="text-gray-400">|</div>
              <div className="font-semibold text-gray-900">{totalLocations} Total Locations</div>
            </div>
          </div>

          {/* Category Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {LOCATION_CATEGORIES.map((category) => {
                const isSelected = selectedCategories.includes(category.value)
                return (
                  <label
                    key={category.value}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleCategoryToggle(category.value)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {category.label}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-2xl shadow-2xl p-4 mb-8">
          <EmergencyServicesMap 
            selectedCategories={selectedCategories}
            height="600px"
          />
        </div>

        {/* Emergency Services List */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="h-6 w-6 text-red-600" />
            <h3 className="text-2xl font-bold text-gray-900">24/7 Emergency Hotlines</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {emergencyServices.map((service) => (
              <div key={service.id} className="bg-white rounded-xl p-4 shadow-md">
                <div className="flex items-start gap-3">
                  <div
                    className="text-2xl flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: service.color }}
                  >
                    {service.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 mb-1">{service.name}</h4>
                    <div className="space-y-1">
                      {service.phones.map((phone, idx) => (
                        <a
                          key={idx}
                          href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                          className="block text-blue-600 hover:text-blue-800 font-semibold hover:underline text-sm"
                        >
                          📞 {phone}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800 font-semibold mb-2">
            ⚠️ For Life-Threatening Emergencies
          </p>
          <p className="text-yellow-700">
            Call <strong className="text-2xl">911</strong> immediately or contact{' '}
            <strong>CDRRMC at (034) 473-0043</strong>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-2 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold">Bago Safe</h3>
          </div>
          <p className="text-gray-400 text-sm">
            © 2026 Bago City Disaster Risk Reduction and Management Office
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Emergency Services Map • Public Information
          </p>
        </div>
      </footer>
    </div>
  )
}
