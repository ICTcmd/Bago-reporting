export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type IncidentCategory =
  | 'flood'
  | 'fire'
  | 'road_obstruction'
  | 'fallen_tree'
  | 'building_damage'
  | 'medical'
  | 'crime'
  | 'other'

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'

export type IncidentStatus =
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'invalid'
  | 'duplicate'

export type UserRole = 'citizen' | 'responder' | 'supervisor' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  phone_number: string | null
  created_at: string
  updated_at: string
}

export interface Incident {
  id: string
  reporter_id: string | null
  reporter_name: string | null
  reporter_contact: string | null
  category: IncidentCategory
  severity: IncidentSeverity
  title: string
  description: string
  location_lat: number
  location_lng: number
  address_text: string
  barangay: string | null
  status: IncidentStatus
  assigned_to: string | null
  reference_number: string
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface IncidentMedia {
  id: string
  incident_id: string
  file_path: string
  file_type: 'image' | 'video'
  file_size: number
  uploaded_at: string
}

export interface IncidentUpdate {
  id: string
  incident_id: string
  user_id: string
  status_change: IncidentStatus | null
  notes: string
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  severity: IncidentSeverity
  published_by: string
  published_at: string
  expires_at: string | null
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      incidents: {
        Row: Incident
        Insert: Omit<Incident, 'id' | 'reference_number' | 'created_at' | 'updated_at' | 'resolved_at'>
        Update: Partial<Omit<Incident, 'id' | 'reference_number' | 'created_at'>>
      }
      incident_media: {
        Row: IncidentMedia
        Insert: Omit<IncidentMedia, 'id' | 'uploaded_at'>
        Update: Partial<Omit<IncidentMedia, 'id' | 'uploaded_at'>>
      }
      incident_updates: {
        Row: IncidentUpdate
        Insert: Omit<IncidentUpdate, 'id' | 'created_at'>
        Update: Partial<Omit<IncidentUpdate, 'id' | 'created_at'>>
      }
      announcements: {
        Row: Announcement
        Insert: Omit<Announcement, 'id' | 'published_at'>
        Update: Partial<Omit<Announcement, 'id' | 'published_at'>>
      }
    }
  }
}
