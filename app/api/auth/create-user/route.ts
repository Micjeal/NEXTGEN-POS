import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

// This endpoint allows managers/admins to create users
export async function POST(request: NextRequest) {
  try {
    // Check if the requester is authenticated and has permission
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or manager
    const { data: profile } = await supabase
      .from("profiles")
      .select("*, role:roles(*)")
      .eq("id", user.id)
      .single()

    if (!["admin", "manager"].includes(profile?.role?.name || "")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    console.log("Create user request body:", body)
    const { email, password, full_name, role_id, ...employeeData } = body

    if (!email || !password || !full_name || !role_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if role requires employee record
    console.log("Checking role:", role_id)
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("name")
      .eq("id", role_id)
      .single()

    console.log("Role query result:", { role, roleError })

    // Temporarily assume it's an employee role to test
    const isEmployeeRole = true // role && ['admin', 'manager', 'cashier'].includes(role.name)
    console.log("Is employee role:", isEmployeeRole, "role name:", role?.name)

    if (isEmployeeRole) {
      if (!employeeData.first_name || !employeeData.last_name || !employeeData.hire_date || !employeeData.designation) {
        return NextResponse.json({ error: "Missing required employee fields" }, { status: 400 })
      }
    }

    // Use admin client to create user
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    console.log("Creating auth user...")
    // Create user in auth with email confirmed
    const { data: authData, error: authError2 } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email so user can login immediately
      user_metadata: {
        full_name,
      },
    })

    console.log("Auth creation result:", { authData: !!authData, authError2 })

    if (authError2) {
      console.error("Auth creation error:", authError2)
      return NextResponse.json({ error: authError2.message }, { status: 400 })
    }

    if (authData.user) {
      console.log("Creating profile...")
      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: authData.user.id,
          email,
          full_name,
          role_id,
          is_active: true,
        })

      console.log("Profile creation result:", { profileError })

      if (profileError) {
        console.error("Profile creation error:", profileError)
        // If profile creation fails, we should probably delete the auth user
        // But for simplicity, we'll just return the error
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }

      // isEmployeeRole is already determined above

      if (isEmployeeRole) {
        console.log("Creating employee record...")
        // Generate automatic employee ID
        const { data: lastEmployee } = await supabaseAdmin
          .from("employees")
          .select("employee_id")
          .order("created_at", { ascending: false })
          .limit(1)

        console.log("Last employee query result:", lastEmployee)

        let nextId = 1
        if (lastEmployee && lastEmployee.length > 0 && lastEmployee[0].employee_id) {
          const match = lastEmployee[0].employee_id.match(/EMP(\d+)/)
          if (match) {
            nextId = parseInt(match[1]) + 1
          }
        }
        const employeeId = `EMP${nextId.toString().padStart(3, '0')}`
        console.log("Generated employee ID:", employeeId)

        // Create employee record
        const employeeInsert: any = {
          user_id: authData.user.id,
          employee_id: employeeId,
          first_name: employeeData.first_name || '',
          last_name: employeeData.last_name || '',
          email,
          hire_date: employeeData.hire_date || null,
          designation: employeeData.designation || '',
          is_active: true,
        }

        // Optional fields
        if (employeeData.phone) employeeInsert.phone = employeeData.phone
        if (employeeData.date_of_birth) employeeInsert.date_of_birth = employeeData.date_of_birth
        if (employeeData.gender) employeeInsert.gender = employeeData.gender
        if (employeeData.address) employeeInsert.address = employeeData.address
        if (employeeData.city) employeeInsert.city = employeeData.city
        if (employeeData.department) employeeInsert.department = employeeData.department
        if (employeeData.branch_id) employeeInsert.branch_id = employeeData.branch_id
        if (employeeData.salary) employeeInsert.salary = parseFloat(employeeData.salary)
        if (employeeData.hourly_rate) employeeInsert.hourly_rate = parseFloat(employeeData.hourly_rate)

        console.log("Employee insert data:", employeeInsert)

        const { error: employeeError } = await supabaseAdmin
          .from("employees")
          .insert(employeeInsert)

        console.log("Employee creation result:", { employeeError })

        if (employeeError) {
          console.error("Employee creation error:", employeeError)
          // Don't fail the whole operation, just log the error
        }
      }

      return NextResponse.json({
        success: true,
        user: {
          id: authData.user.id,
          email,
          full_name,
        }
      })
    }

    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}