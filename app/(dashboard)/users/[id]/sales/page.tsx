import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function UserSalesPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, role:roles(*)")
    .eq("id", user.id)
    .single()

  if (profile?.role?.name !== "admin") {
    redirect("/dashboard")
  }

  // Get user profile
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  // Get sales for this user
  const { data: sales } = await supabase
    .from("sales")
    .select(`
      *,
      items:sale_items(*, product:products(*))
    `)
    .eq("user_id", id)
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Sales for {userProfile?.full_name}</h1>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              UGX {sales?.reduce((sum, sale) => sum + sale.total, 0).toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              UGX {sales?.length ? (sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length).toFixed(2) : "0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
        </CardHeader>
        <CardContent>
          {sales?.length ? (
            <div className="space-y-4">
              {sales.map((sale) => (
                <div key={sale.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">Invoice #{sale.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">UGX {sale.total.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground capitalize">{sale.status}</p>
                    </div>
                  </div>
                  <div className="text-sm">
                    {sale.items?.length} item(s)
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No sales found for this user.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}