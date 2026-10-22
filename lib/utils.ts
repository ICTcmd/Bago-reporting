import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateReferenceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `BS-${timestamp}-${random}`
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getIncidentCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    flood: 'Flood',
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

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    submitted: 'Submitted',
    under_review: 'Under Review',
    verified: 'Verified',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
    invalid: 'Invalid',
    duplicate: 'Duplicate',
  }
  return labels[status] || status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    submitted: 'bg-gray-100 text-gray-800',
    under_review: 'bg-blue-100 text-blue-800',
    verified: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-600',
    invalid: 'bg-red-100 text-red-800',
    duplicate: 'bg-orange-100 text-orange-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  }
  return colors[severity] || 'bg-gray-100 text-gray-800'
}
