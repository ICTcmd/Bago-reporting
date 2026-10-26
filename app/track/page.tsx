'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, MapPin, Clock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getStatusLabel, getStatusColor, getIncidentCategoryLabel, formatDate } from '@/lib/utils'

interface Incident {
  reference_number: string
  category: string
  severity: string
  title: string
  location_summary: string  // Changed from address_text (barangay only for privacy)
  status: string
  created_at: string
  updated_at: string
  // Note: description removed for privacy (may contain PII)
  // Note: id not exposed by tracking function
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
      
      // Use secure tracking function instead of direct table query
      const { data, error: fetchError } = await supabase
        .rpc('track_incident_by_reference', { ref_num: ref.trim() })

      if (fetchError || !data || data.length === 0) {
        setError('Report not found. Please check your reference number.')
      } else {
        // RPC returns array, take first result
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Track Your Report
          </h1>
          <p className="text-gray-600 mb-8">
            Enter your reference number to check the status of your incident report.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex gap-3">
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                placeholder="Enter reference number (e.g., BS-XXXXX-XXXX)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono uppercase"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
              >
                <Search className="h-5 w-5" />
                <span className="hidden sm:inline">
                  {loading ? 'Searching...' : 'Search'}
                </span>
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Report Not Found</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Incident Details */}
          {incident && (
            <div className="border-t pt-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Report Details</h2>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                    incident.status
                  )}`}
                >
                  {getStatusLabel(incident.status)}
                </span>
              </div>

              {/* Info Grid */}
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Reference Number</p>
                  <p className="font-mono font-bold text-lg">
                    {incident.reference_number}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Incident Type</p>
                  <p className="font-semibold text-gray-900">
                    {getIncidentCategoryLabel(incident.category)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Title</p>
                  <p className="font-semibold text-gray-900">{incident.title}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Location
                  </p>
                  <p className="text-gray-900">{incident.location_summary}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Exact address withheld for privacy
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Submitted
                    </p>
                    <p className="text-gray-900">{formatDate(incident.created_at)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                    <p className="text-gray-900">{formatDate(incident.updated_at)}</p>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="mt-8 pt-8 border-t">
                <h3 className="font-semibold text-gray-900 mb-4">Status Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        ['submitted', 'under_review', 'verified', 'in_progress', 'resolved', 'closed'].includes(incident.status)
                          ? 'bg-green-600'
                          : 'bg-gray-300'
                      }`}
                    />
                    <p className="text-sm">
                      <span className="font-semibold">Submitted</span> - Report received
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        ['under_review', 'verified', 'in_progress', 'resolved', 'closed'].includes(incident.status)
                          ? 'bg-green-600'
                          : 'bg-gray-300'
                      }`}
                    />
                    <p className="text-sm">
                      <span className="font-semibold">Under Review</span> - Being evaluated by staff
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        ['verified', 'in_progress', 'resolved', 'closed'].includes(incident.status)
                          ? 'bg-green-600'
                          : 'bg-gray-300'
                      }`}
                    />
                    <p className="text-sm">
                      <span className="font-semibold">Verified</span> - Report confirmed
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        ['in_progress', 'resolved', 'closed'].includes(incident.status)
                          ? 'bg-green-600'
                          : 'bg-gray-300'
                      }`}
                    />
                    <p className="text-sm">
                      <span className="font-semibold">In Progress</span> - Response underway
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        ['resolved', 'closed'].includes(incident.status)
                          ? 'bg-green-600'
                          : 'bg-gray-300'
                      }`}
                    />
                    <p className="text-sm">
                      <span className="font-semibold">Resolved</span> - Incident addressed
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        incident.status === 'closed' ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    />
                    <p className="text-sm">
                      <span className="font-semibold">Closed</span> - Case completed
                    </p>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> DRRMO staff monitor reports during office hours (M-F, 8 AM - 5 PM). 
                  For urgent matters, contact us directly at +63-xxx-xxx-xxxx.
                </p>
              </div>
            </div>
          )}

          {/* Help Text */}
          {!incident && !error && !loading && (
            <div className="text-center text-gray-600">
              <p className="text-sm">
                Can't find your reference number? Check your email or SMS for the confirmation message.
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <TrackContent />
    </Suspense>
  )
}
