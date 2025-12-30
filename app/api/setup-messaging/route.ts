import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const supabase = await createClient()

    // Check if messages table exists by trying a simple query
    let tableExists = false
    try {
      const { error } = await supabase
        .from("messages")
        .select("id")
        .limit(1)

      tableExists = !error
    } catch (e) {
      tableExists = false
    }

    if (tableExists) {
      return NextResponse.json({
        success: true,
        message: "Messaging tables already exist"
      })
    }

    // Read the SQL schema file
    const sqlFilePath = path.join(process.cwd(), "scripts", "messaging_schema.sql")
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8")

    return NextResponse.json({
      success: false,
      message: "Messaging tables not found. Please run the SQL manually.",
      sql_content: sqlContent,
      instructions: [
        "1. Go to your Supabase dashboard",
        "2. Navigate to SQL Editor",
        "3. Copy and paste the SQL below",
        "4. Click 'Run' to execute",
        "5. Refresh the messages page"
      ]
    })

  } catch (error: any) {
    console.error("Error checking messaging setup:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      instruction: "Please check your Supabase connection and try again."
    }, { status: 500 })
  }
}