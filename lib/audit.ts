/**
 * BAGO SAFE - AUDIT LOGGING UTILITY
 * 
 * Server-side audit logging for sensitive actions.
 * Must be used in Server Components, Route Handlers, or Server Actions only.
 * 
 * Usage:
 *   import { logAuditEvent } from '@/lib/audit'
 *   await logAuditEvent(supabase, {
 *     action: 'incident_status_change',
 *     resourceType: 'incident',
 *     resourceId: incidentId,
 *     details: { old_status: 'submitted', new_status: 'verified' }
 *   })
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface AuditEventData {
  action: string
  resourceType: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Log an audit event to the audit_logs table
 * 
 * @param supabase - Supabase client (must be server-side with user context)
 * @param eventData - Audit event details
 * @returns Promise<void>
 */
export async function logAuditEvent(
  supabase: SupabaseClient,
  eventData: AuditEventData
): Promise<void> {
  try {
    // Get current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('[Audit] Cannot log event - no authenticated user:', userError)
      return
    }

    // Get user profile for additional context
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('id', user.id)
      .single()

    // Insert audit log
    const { error: insertError } = await supabase
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        actor_email: profile?.email || user.email,
        action: eventData.action,
        resource_type: eventData.resourceType,
        resource_id: eventData.resourceId || null,
        details: eventData.details || {},
        ip_address: eventData.ipAddress || null,
        user_agent: eventData.userAgent || null,
      })

    if (insertError) {
      // Log error but don't throw - audit failure shouldn't break primary operation
      console.error('[Audit] Failed to insert audit log:', insertError)
    }
  } catch (error) {
    console.error('[Audit] Unexpected error logging audit event:', error)
  }
}

/**
 * Common audit action types (for consistency)
 */
export const AUDIT_ACTIONS = {
  // Incident actions
  INCIDENT_STATUS_CHANGE: 'incident_status_change',
  INCIDENT_ASSIGNMENT_CHANGE: 'incident_assignment_change',
  INCIDENT_CREATED: 'incident_created',
  INCIDENT_UPDATED: 'incident_updated',
  INCIDENT_DELETED: 'incident_deleted',
  INCIDENT_MEDIA_UPLOADED: 'incident_media_uploaded',
  INCIDENT_MEDIA_DELETED: 'incident_media_deleted',
  
  // User actions
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_ROLE_CHANGED: 'user_role_changed',
  
  // Access actions
  UNAUTHORIZED_ACCESS_ATTEMPT: 'unauthorized_access_attempt',
  DATA_EXPORT: 'data_export',
} as const

/**
 * Resource types (for consistency)
 */
export const RESOURCE_TYPES = {
  INCIDENT: 'incident',
  USER: 'user',
  PROFILE: 'profile',
  MEDIA: 'media',
  ANNOUNCEMENT: 'announcement',
} as const
