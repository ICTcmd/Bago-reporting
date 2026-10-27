'use client'

import { Filter, X } from 'lucide-react'
import { useState } from 'react'

interface MapFiltersProps {
  onFilterChange: (filters: FilterState) => void
  incidentCounts: {
    bySeverity: Record<string, number>
    byStatus: Record<string, number>
  }
}

export interface FilterState {
  severities: string[]
  statuses: string[]
}

const SEVERITIES = [
  { value: 'critical', label: 'Critical', color: 'bg-red-600' },
  { value: 'high', label: 'High', color: 'bg-orange-600' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'low', label: 'Low', color: 'bg-blue-500' }
]

const STATUSES = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'verified', label: 'Verified' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
]

export default function MapFilters({ onFilterChange, incidentCounts }: MapFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    severities: ['critical', 'high', 'medium', 'low'],
    statuses: ['submitted', 'verified', 'in_progress']
  })

  const handleSeverityToggle = (severity: string) => {
    const newSeverities = filters.severities.includes(severity)
      ? filters.severities.filter(s => s !== severity)
      : [...filters.severities, severity]
    
    const newFilters = { ...filters, severities: newSeverities }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status]
    
    const newFilters = { ...filters, statuses: newStatuses }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    const defaultFilters = {
      severities: ['critical', 'high', 'medium', 'low'],
      statuses: ['submitted', 'verified', 'in_progress']
    }
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  const activeFilterCount = 
    (4 - filters.severities.length) + 
    (6 - filters.statuses.length)

  return (
    <>
      {/* Filter Toggle Button - Mobile & Desktop */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors"
      >
        <Filter className="h-4 w-4 text-gray-700" />
        <span className="text-sm font-semibold text-gray-700">Filters</span>
        {activeFilterCount > 0 && (
          <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter Panel - Slides in from left */}
      {showFilters && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-[1001] lg:hidden"
            onClick={() => setShowFilters(false)}
          />
          
          {/* Filter Panel */}
          <div className="fixed lg:absolute top-0 left-0 bottom-0 w-80 bg-white shadow-2xl z-[1002] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Filter Incidents</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Filter Content */}
            <div className="p-4 space-y-6">
              {/* Severity Filter */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Severity</h4>
                <div className="space-y-2">
                  {SEVERITIES.map((severity) => {
                    const count = incidentCounts.bySeverity[severity.value] || 0
                    const isChecked = filters.severities.includes(severity.value)
                    
                    return (
                      <label
                        key={severity.value}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSeverityToggle(severity.value)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className={`w-3 h-3 rounded-full ${severity.color}`}></div>
                        <span className="flex-1 text-sm text-gray-700">{severity.label}</span>
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {count}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Status</h4>
                <div className="space-y-2">
                  {STATUSES.map((status) => {
                    const count = incidentCounts.byStatus[status.value] || 0
                    const isChecked = filters.statuses.includes(status.value)
                    
                    return (
                      <label
                        key={status.value}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleStatusToggle(status.value)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="flex-1 text-sm text-gray-700 capitalize">
                          {status.label}
                        </span>
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {count}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Quick Filters */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Quick Filters</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const newFilters = {
                        severities: ['critical', 'high'],
                        statuses: ['submitted', 'verified', 'in_progress']
                      }
                      setFilters(newFilters)
                      onFilterChange(newFilters)
                    }}
                    className="w-full text-left px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
                  >
                    🚨 Critical & High Only
                  </button>
                  
                  <button
                    onClick={() => {
                      const newFilters = {
                        severities: ['critical', 'high', 'medium', 'low'],
                        statuses: ['in_progress']
                      }
                      setFilters(newFilters)
                      onFilterChange(newFilters)
                    }}
                    className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                  >
                    ⏳ In Progress Only
                  </button>
                  
                  <button
                    onClick={() => {
                      const newFilters = {
                        severities: ['critical', 'high', 'medium', 'low'],
                        statuses: ['submitted']
                      }
                      setFilters(newFilters)
                      onFilterChange(newFilters)
                    }}
                    className="w-full text-left px-3 py-2 text-sm bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors font-medium"
                  >
                    📋 New Submissions
                  </button>
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
