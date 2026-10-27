'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield, Home, AlertCircle, MapPin, Clock, Filter, TrendingUp, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

interface CommunityIncident {
  reference_number: string
  category: string
  severity: string
  title: string
  location_summary: string
  status: string
  created_at: string
}

const CATEGORY_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  flood: { icon: '🌊', label: 'Flooding', color: 'bg-blue-100 text-blue-800' },
  fire: { icon: '🔥', label: 'Fire', color: 'bg-red-100 text-red-800' },
  road_obstruction: { icon: '🚧', label: 'Road Obstruction', color: 'bg-yellow-100 text-yellow-800' },
  fallen_tree: { icon: '🌳', label: 'Fallen Tree', color: 'bg-green-100 text-green-800' },
  building_damage: { icon: '🏚️', label: 'Building Damage', color: 'bg-orange-100 text-orange-800' },
  medical: { icon: '🏥', label: 'Medical Emergency', color: 'bg-pink-100 text-pink-800' },
  crime: { icon: '🚨', label: 'Crime/Security', color: 'bg-purple-100 text-purple-800' },
  other: { icon: '📋', label: 'Other', color: 'bg-gray-100 text-gray-800' },
}

const STATUS_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  submitted: { icon: '📝', label: 'Submitted', color: 'bg-gray-100 text-gray-700' },
  under_review: { icon: '👁️', label: 'Under Review', color: 'bg-blue-100 text-blue-700' },
  verified: { icon: '✓', label: 'Verified', color: 'bg-purple-100 text-purple-700' },
  in_progress: { icon: '⚙️', label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
  resolved: { icon: '✅', label: 'Resolved', color: 'bg-green-100 text-green-700' },
  closed: { icon: '🔒', label: 'Closed', color: 'bg-gray-100 text-gray-500' },
}

export default function CommunityDashboard() {
  const [incidents, setIncidents] = useState<CommunityIncident[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<CommunityIncident[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0 })

  useEffect(() => {
    loadIncidents()
  }, [])

  useEffect(() => {
    filterIncidents()
  }, [incidents, selectedCategory, selectedStatus])

  const loadIncidents = async () => {
    try {
      const supabase = createClient()
      
      // Call tracking function for each incident (public safe data only)
      // For demo, we'll fetch from incidents table with limited fields
      // In production, you'd call track_incident_by_reference for each
      const { data, error } = await supabase
        .from('incidents')
        .select('reference_number, category, severity, title, barangay, status, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const communityIncidents: CommunityIncident[] = (data || []).map(incident => ({
        reference_number: incident.reference_number,
        category: incident.category,
        severity: incident.severity,
        title: incident.title,
        location_summary: incident.barangay ? `Barangay ${incident.barangay}` : 'Location withheld',
        status: incident.status,
        created_at: incident.created_at,
      }))

      setIncidents(communityIncidents)

      // Calculate stats
      const total = communityIncidents.length
      const active = communityIncidents.filter(i => 
        ['submitted', 'under_review', 'verified', 'in_progress'].includes(i.status)
      ).length
      const resolved = communityIncidents.filter(i => 
        ['resolved', 'closed'].includes(i.status)
      ).length

      setStats({ total, active, resolved })
    } catch (err) {
      console.error('Error loading incidents:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterIncidents = () => {
    let filtered = incidents

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(i => i.category === selectedCategory)
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(i => i.status === selectedStatus)
    }

    setFilteredIncidents(filtered)
  }

  const getCategoryConfig = (category: string) => {
    return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other
  }

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.submitted
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <header className="bg-navy-600 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-lg">
                <Users className="h-7 w-7 text-navy-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Community Dashboard
                </h1>
                <p className="text-xs text-white/80 font-medium">See what's happening in Bago City</p>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 text-white/90 hover:text-white font-semibold transition-colors px-4 py-2 rounded-lg hover:bg-white/10 min-h-[44px]"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Community Incident Feed
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            See recent incident reports from your community. Stay informed about what's happening in Bago City.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card-surface p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-action-100 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-action-600" />
              </div>
              <span className="text-sm text-gray-600 font-semibold">Total Reports</span>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="card-surface p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-600 font-semibold">Active Cases</span>
            </div>
            <p className="text-4xl font-bold text-yellow-600">{stats.active}</p>
          </div>

          <div className="card-surface p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-600 font-semibold">Resolved</span>
            </div>
            <p className="text-4xl font-bold text-green-600">{stats.resolved}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card-surface p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-900">Filter Reports</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Incident Type
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field"
              >
                <option value="all">All Types</option>
                {Object.entries(CATEGORY_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-field"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">📝 Submitted</option>
                <option value="under_review">👁️ Under Review</option>
                <option value="verified">✓ Verified</option>
                <option value="in_progress">⚙️ In Progress</option>
                <option value="resolved">✅ Resolved</option>
                <option value="closed">🔒 Closed</option>
              </select>
            </div>
          </div>

          {(selectedCategory !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSelectedCategory('all')
                setSelectedStatus('all')
              }}
              className="mt-4 text-sm text-action-600 hover:text-action-700 font-semibold hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Incident Feed */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-action-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading community reports...</p>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="card-surface p-12 text-center">
            <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-600 mb-4">
              {selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'No incident reports have been submitted yet'}
            </p>
            {(selectedCategory !== 'all' || selectedStatus !== 'all') && (
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setSelectedStatus('all')
                }}
                className="btn-primary"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIncidents.map((incident) => {
              const categoryConfig = getCategoryConfig(incident.category)
              const statusConfig = getStatusConfig(incident.status)

              return (
                <div key={incident.reference_number} className="card-surface p-6 hover:shadow-lg transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Category Icon */}
                      <div className={`${categoryConfig.color} p-3 rounded-xl text-2xl flex-shrink-0`}>
                        {categoryConfig.icon}
                      </div>

                      {/* Title and Meta */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {incident.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${categoryConfig.color} font-semibold`}>
                            {categoryConfig.icon} {categoryConfig.label}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {incident.location_summary}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(incident.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`status-badge border-2 ${statusConfig.color} flex-shrink-0`}>
                      <span aria-hidden="true">{statusConfig.icon}</span>
                      <span className="font-semibold">{statusConfig.label}</span>
                    </span>
                  </div>

                  {/* Reference Number */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Reference Number</p>
                        <p className="font-mono font-bold text-sm text-navy-600">
                          {incident.reference_number}
                        </p>
                      </div>
                      <Link
                        href={`/track?ref=${incident.reference_number}`}
                        className="btn-secondary text-sm py-2 px-4"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>

                  {/* Privacy Notice */}
                  <div className="text-xs text-gray-500 italic">
                    🔒 Exact location and reporter details withheld for privacy
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Showing Count */}
        {!loading && filteredIncidents.length > 0 && (
          <div className="text-center mt-8 text-gray-600">
            Showing {filteredIncidents.length} of {incidents.length} reports
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 card-surface p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            See Something? Report It!
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Help keep Bago City safe by reporting non-emergency incidents. Your report will appear here for the community to see.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/report" className="btn-primary">
              Submit New Report
            </Link>
            <Link href="/emergency-map" className="btn-secondary">
              Emergency Services Map
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-navy-600 text-white mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <div className="bg-white p-2 rounded-lg">
              <Shield className="h-5 w-5 text-navy-600" />
            </div>
            <h3 className="text-lg font-bold">Bago Safe</h3>
          </div>
          <p className="text-white/80 text-sm">
            © 2026 Bago City Disaster Risk Reduction and Management Office
          </p>
          <p className="text-xs text-white/60 mt-2">
            Community Dashboard • Stay Informed
          </p>
        </div>
      </footer>
    </div>
  )
}
