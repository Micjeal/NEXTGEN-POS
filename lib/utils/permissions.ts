import { createClient } from "@/lib/supabase/server"

export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    // First get the user's profile and role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        *,
        role:roles(*)
      `)
      .eq("id", userId)
      .single()

    if (profileError || !profile || !profile.role) {
      return false
    }

    // Now get the role permissions separately
    const { data: rolePerms, error: rpError } = await supabase
      .from("role_permissions")
      .select(`
        permissions(*)
      `)
      .eq("role_id", profile.role.id)

    if (rpError) {
      return false
    }

    const permissions = rolePerms?.map((rp: any) => rp.permissions?.name).filter(Boolean) || []

    // Check if the role has the required permission
    const hasPermission = permissions.includes(permissionName)

    return hasPermission
  } catch (error) {
    console.error("Error checking permission:", error)
    return false
  }
}

export async function requirePermission(userId: string, permissionName: string): Promise<void> {
  const hasPerm = await hasPermission(userId, permissionName)
  if (!hasPerm) {
    throw new Error(`Insufficient permissions: ${permissionName}`)
  }
}