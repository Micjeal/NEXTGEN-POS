import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()

    // Fetch employees from employees table
    const { data: employees, error: employeesError } = await serviceClient
      .from("employees")
      .select(`
        *,
        branch:branches!employees_branch_id_fkey(name)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (employeesError) {
      console.error("Employees fetch error:", employeesError)
      return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 })
    }

    // Fetch profiles from profiles table (users who might not be in employees yet)
    const { data: profiles, error: profilesError } = await serviceClient
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        role_id,
        is_active,
        created_at
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (profilesError) {
      console.error("Profiles fetch error:", profilesError)
      // Don't fail completely if profiles fetch fails, just return employees
    }

    // Fetch roles for mapping
    const { data: roles } = await serviceClient
      .from("roles")
      .select("id, name")

    const roleMap = new Map(roles?.map(role => [role.id, role.name]) || [])

    // Combine employees and profiles, avoiding duplicates
    const employeeUserIds = new Set(employees?.map(emp => emp.user_id) || [])
    const combinedEmployees = [...(employees || [])]

    // Add profiles that aren't already employees
    if (profiles) {
      for (const profile of profiles) {
        if (!employeeUserIds.has(profile.id)) {
          // Convert profile to employee-like format
          const nameParts = profile.full_name?.split(' ') || ['', '']
          combinedEmployees.push({
            id: profile.id,
            user_id: profile.id,
            employee_id: null,
            first_name: nameParts[0] || 'Unknown',
            last_name: nameParts.slice(1).join(' ') || 'User',
            email: profile.email || '',
            phone: null,
            designation: roleMap.get(profile.role_id) || 'User',
            department: null,
            branch_id: null,
            salary: null,
            is_active: profile.is_active,
            hire_date: profile.created_at,
            created_at: profile.created_at,
            branch: null,
            // Mark as profile-only
            is_from_profile: true
          })
        }
      }
    }

    return NextResponse.json({
      employees: combinedEmployees,
      total: combinedEmployees.length
    })
  } catch (error) {
    console.error("Employees API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}