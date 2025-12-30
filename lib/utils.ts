import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { createClient } from '@/lib/supabase/client'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get all permissions for the current user
 */
export async function getUserPermissions(): Promise<string[]> {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get user profile with role and permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        *,
        role:roles (
          permissions
        )
      `)
      .eq('id', user.id)
      .single()

    if (!profile?.role?.permissions) return []

    return profile.role.permissions
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return []
  }
}
