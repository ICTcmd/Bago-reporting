'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Shield,
  LogOut,
  RefreshCw,
  Map as MapIcon,
  List,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Home,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import MapFilters, { type FilterState } from '@/components/MapFilters'
import type { MapIncident } from '@/components/IncidentMap'

const IncidentMap = dynamic(() => import('@/components/IncidentMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-xl">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
        <p className="text-sm text-gray-600">Loading incident map...</p>
      </div>
    </div>
  ),
})

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'verified', label: 'Verified' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

export default function StaffDashboardPage() {
  const router = useRouter()
  const [incidents, setIncidents] = useState<MapIncident[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    severities: ['critical', 'high', 'medium', 'low'],
    statuses: ['submitted', 'verified', 'in_progress'],
  })

  const fetchIncidents = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('incidents')
        .select(
          'id, reference_number, title, description, category, severity, status, location_lat, location_lng, address_text, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(200)

      if (!error && data) {
        setIncidents(data as MapIncident[])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      setUserEmail(user.email ?? null)
      setCheckingAuth(false)
      fetchIncidents()
    }
    init()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('incidents')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (!error) {
        setIncidents((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        )
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const incidentCounts = useMemo(() => {
    const bySeverity: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    for (const item of incidents) {
      bySeverity[item.severity] = (bySeverity[item.severity] || 0) + 1
      byStatus[item.status] = (byStatus[item.status] || 0) + 1
    }
    return { bySeverity, byStatus }
  }, [incidents])

  const filteredIncidents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return incidents.filter((item) => {
      if (!filters.severities.includes(item.severity)) return false
      if (!filters.statuses.includes(item.status)) return false
      if (q) {
        const hay = `${item.reference_number} ${item.title} ${item.address_text} ${item.category}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [incidents, filters, searchQuery])

  const mappableIncidents = useMemo(
    () =>
      filteredIncidents.filter(
        (i) =>
          typeof i.location_lat === 'number' &&
          typeof i.location_lng === 'number' &&
          i.location_lat !== 0 &&
          i.location_lng !== 0
      ),
    [filteredIncidents]
  )

  const stats = useMemo(
    () => ({
      total: incidents.length,
      urgent: incidents.filter((i) => i.severity === 'critical' || i.severity === 'high').length,
      active: incidents.filter((i) => ['submitted', 'under_review', 'verified', 'in_progress'].includes(i.status)).length,
      resolved: incidents.filter((i) => i.status === 'resolved' || i.status === 'closed').length,
    }),
    [incidents]
  )

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Verifying staff session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-blue-600 p-2 rounded-xl text-white flex-shrink-0">
              <Shield className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                Bago Safe Staff Dashboard
              </h1>
              {userEmail && (
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-1.5"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <button
              type="button"
              onClick={fetchIncidents}
              disabled={loading}
              className="px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col gap-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase">Total Reports</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-red-600 uppercase">Critical / High</p>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.urgent}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-amber-600 uppercase">Active Cases</p>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-green-600 uppercase">Resolved</p>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference #, title, or barangay..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'map' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <MapIcon className="h-4 w-4" />
              Map View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <List className="h-4 w-4" />
              List View ({filteredIncidents.length})
            </button>
          </div>
        </div>

        {/* Main View */}
        {viewMode === 'map' ? (
          <div className="relative h-[560px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
            <MapFilters onFilterChange={setFilters} incidentCounts={incidentCounts} />
            <IncidentMap incidents={mappableIncidents} />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {filteredIncidents.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm">
                No incidents match the current filters.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-500">
                          {incident.reference_number}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-gray-100 text-gray-800 uppercase">
                          {incident.severity}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(incident.created_at).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900">{incident.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{incident.description}</p>
                      <p className="text-xs text-gray-500">{incident.address_text}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={incident.status}
                        disabled={updatingId === incident.id}
                        onChange={(e) => handleStatusChange(incident.id, e.target.value)}
                        className="px-3 py-2 text-sm font-semibold border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
