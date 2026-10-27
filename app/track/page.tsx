'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, MapPin, Clock, AlertCircle, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

interface Incident {
  reference_number: string
  category: string
  severity: string
  title: string
  location_summary: string
  status: string
  created_at: string
  updated_at: string
}

function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: string; label: string; color: string }> = {
      submitted: { icon: '📝', label: 'Submitted', color: 'bg-gray-100 text-gray-800 border-gray-300' },
      under_review: { icon: '👁️', label: 'Under Review', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      verified: { icon: '✓', label: 'Verified', color: 'bg-purple-100 text-purple-800 border-purple-300' },
      in_progress: { icon: '⚙️', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      resolved: { icon: '✅', label: 'Resolved', color: 'bg-green-100 text-green-800 border-green-300' },
      closed: { icon: '🔒', label: 'Closed', color: 'bg-gray-100 text-gray-600 border-gray-300' },
      invalid: { icon: '❌', label: 'Invalid', color: 'bg-red-100 text-red-800 border-red-300' },
      duplicate: { icon: '📋', label: 'Duplicate', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    }
    return configs[status] || configs.submitted
  }

  const config = getStatusConfig(status)
  return (
    <span className={`status-badge border-2 ${config.color}`}>
      <span aria-hidden="true">{config.icon}</span>
      <span className="font-semibold">{config.label}</span>
    </span>
  )
}

function getIncidentCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    flood: 'Flooding',
    fire: 'Fire',
    road_obstruction: 'Road Obstruction',
    fallen_tree: 'Fallen Tree',
    building_damage: 'Building Damage',
    medical: 'Medical Emergency',
    crime: 'Crime/Security',
    other: 'Other',
  }
  return labels[category] || category
}

function TrackContent() {
  const searchParams = useSearchParams()
  const urlRef = searchParams.get('ref') || ''
  
  const [referenceNumber, setReferenceNumber] = useState(urlRef)
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (urlRef) {
      handleSearch(urlRef)
    }
  }, [urlRef])

  const handleSearch = async (refNumber?: string) => {
    const ref = refNumber || referenceNumber
    setError('')
    setIncident(null)

    if (!ref.trim()) {
      setError('Please enter a reference number')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      
      const { data, error: fetchError } = await supabase
        .rpc('track_incident_by_reference', { ref_num: ref.trim() })

      if (fetchError || !data || data.length === 0) {
        setError('Report not found. Please check your reference number and try again.')
      } else {
        setIncident(Array.isArray(data) ? data[0] : data)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  const isStatusActive = (checkStatus: string) => {
    const order = ['submitted', 'under_review', 'verified', 'in_progress', 'resolved', 'closed']
    const currentIndex = order.indexOf(incident?.status || '')
    const checkIndex = order.indexOf(checkStatus)
    return currentIndex >= checkIndex
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 min-h-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card-surface p-6 md:p-8">
          {/* Header with icon */}
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-action-100 p-3 rounded-lg">
              <Search className="h-6 w-6 text-action-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Track Your Report
              </h1>
              <p className="text-gray-600 text-sm">
                Enter your reference number to check status
              </p>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex gap-3">
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                placeholder="Enter reference number (e.g., BS-XXXXX-XXXX)"
                className="flex-1 input-field font-mono uppercase"
                aria-label="Reference number"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-8 flex-shrink-0"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    <span className="hidden sm:inline">Search</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Report Not Found</p>
                <p className="text-sm text-red-700">{error}</p>
                <p className="text-sm text-red-600 mt-2">
                  Can't find your reference number? Check your email or SMS for the confirmation message.
                </p>
              </div>
            </div>
          )}

          {/* Incident Details */}
          {incident && (
            <div className="border-t pt-6 space-y-6">
              {/* Status Header */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Report Details</h2>
                <StatusBadge status={incident.status} />
              </div>

              {/* Info Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card-surface p-5">
                  <p className="text-sm text-gray-500 mb-2">Reference Number</p>
                  <p className="font-mono font-bold text-xl text-navy-600 break-all">
                    {incident.reference_number}
                  </p>
                </div>

                <div className="card-surface p-5">
                  <p className="text-sm text-gray-500 mb-2">Incident Type</p>
                  <p className="font-semibold text-lg text-gray-900">
                    {getIncidentCategoryLabel(incident.category)}
                  </p>
                </div>

                <div className="md:col-span-2 card-surface p-5">
                  <p className="text-sm text-gray-500 mb-2">Title</p>
                  <p className="font-semibold text-lg text-gray-900">{incident.title}</p>
                </div>

                <div className="card-surface p-5">
                  <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Location
                  </p>
                  <p className="text-gray-900">{incident.location_summary}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Exact address withheld for privacy
                  </p>
                </div>

                <div className="card-surface p-5">
                  <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Timeline
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Submitted:</span>
                      <p className="font-medium text-gray-900">{formatDate(incident.created_at)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Updated:</span>
                      <p className="font-medium text-gray-900">{formatDate(incident.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="card-surface p-6">
                <h3 className="font-semibold text-gray-900 mb-6 text-lg">Status Timeline</h3>
                <div className="space-y-4">
                  {[
                    { status: 'submitted', label: 'Submitted', desc: 'Report received by DRRMO' },
                    { status: 'under_review', label: 'Under Review', desc: 'Being evaluated by staff' },
                    { status: 'verified', label: 'Verified', desc: 'Report confirmed and validated' },
                    { status: 'in_progress', label: 'In Progress', desc: 'Response is underway' },
                    { status: 'resolved', label: 'Resolved', desc: 'Incident has been addressed' },
                    { status: 'closed', label: 'Closed', desc: 'Case completed and archived' },
                  ].map((step) => {
                    const isActive = isStatusActive(step.status)
                    const isCurrent = incident.status === step.status
                    return (
                      <div key={step.status} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-4 h-4 rounded-full border-2 transition-all ${
                              isActive
                                ? 'bg-green-600 border-green-600'
                                : 'bg-white border-gray-300'
                            } ${isCurrent ? 'ring-4 ring-green-200' : ''}`}
                          />
                          {step.status !== 'closed' && (
                            <div
                              className={`w-0.5 h-8 ${
                                isActive ? 'bg-green-600' : 'bg-gray-200'
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <p
                            className={`font-semibold ${
                              isCurrent ? 'text-green-600' : isActive ? 'text-gray-900' : 'text-gray-500'
                            }`}
                          >
                            {step.label}
                            {isCurrent && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                                Current
                              </span>
                            )}
                          </p>
                          <p className={`text-sm ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <div className="flex gap-3">
                  <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900 mb-1">Response Timeline</p>
                    <p className="text-blue-800">
                      DRRMO staff monitor reports during office hours (Monday-Friday, 8 AM - 5 PM). 
                      For urgent matters outside office hours, contact our 24/7 hotline at <strong>(034) 473-0043</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          {!incident && !error && !loading && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="font-medium text-gray-700 mb-2">Enter your reference number above</p>
              <p className="text-sm">
                Your reference number was provided when you submitted your report.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function TrackPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-page flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-action-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  )
}
