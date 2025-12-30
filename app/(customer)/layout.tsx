import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CustomerNavbar } from "@/components/customer/customer-navbar"
import { CustomerSidebar } from "@/components/customer/customer-sidebar"

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/customer-login")
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerNavbar />
      <div className="flex">
        {/* Sidebar - hidden on mobile, shown on lg+ screens */}
        <div className="hidden lg:block">
          <CustomerSidebar />
        </div>
        <main className="flex-1 p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}