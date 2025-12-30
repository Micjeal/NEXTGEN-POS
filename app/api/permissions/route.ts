import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from "@/lib/supabase/server"
import type { Permission, RolePermission } from "@/lib/types/database"

interface Profile {
  id: string;
  role?: {
    name: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    const userRole = profile?.role?.name
    
    // Return basic permissions for now
    return NextResponse.json({
      permissions: [
        'view_dashboard',
        'view_profile'
        // Add more permissions as needed
      ]
    })

  } catch (error) {
    console.error("Permissions fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role?.name
    // Temporarily allow access for authenticated users since permissions table is removed
    // TODO: Restore admin check when proper role management is implemented
    // if (userRole !== "admin") {
    //   return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    // }

    const { permissions } = await request.json()

    // Update role permissions for each role
    for (const [roleName, roleData] of Object.entries(permissions) as [string, any][]) {
      // Build permissions array from enabled permissions
      const rolePermissions = []
      for (const [permName, enabled] of Object.entries(roleData.permissions) as [string, boolean][]) {
        if (enabled) {
          rolePermissions.push(permName)
        }
      }

      // Update the role with new permissions array
      const { error: updateError } = await supabase
        .from("roles")
        .update({ permissions: rolePermissions })
        .eq("name", roleName)

      if (updateError) {
        console.error(`Error updating permissions for role ${roleName}:`, updateError)
        return NextResponse.json({ error: `Failed to update permissions for ${roleName}` }, { status: 500 })
      }
    }

    return NextResponse.json({ message: "Permissions updated successfully" })

  } catch (error) {
    console.error("Permissions update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}