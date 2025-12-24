import { createClient } from "@/lib/supabase/server"
import { CustomersTable } from "@/components/customers/customers-table"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import Link from "next/link"
import type { Customer } from "@/lib/types/database"

export default async function CustomersPage() {
  const supabase = await createClient()

  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">Manage customer information and loyalty programs</p>
        </div>
        <Button asChild>
          <Link href="/customers/add">
            <UserPlus className="h-4 w-4 mr-2" />
            Register New Customer
          </Link>
        </Button>
      </div>

      <CustomersTable customers={(customers as Customer[]) || []} />
    </div>
  )
}