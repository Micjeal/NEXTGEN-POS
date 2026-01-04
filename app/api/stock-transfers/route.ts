import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceClient = createServiceClient()
    const body = await request.json()
    const { id, action, approved_by } = body

    if (!id || !action) {
      return NextResponse.json({ error: "Transfer ID and action are required" }, { status: 400 })
    }

    const validActions = ['approve', 'ship', 'receive', 'cancel']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let updateData: any = {}
    let inventoryUpdates: any[] = []

    // Get transfer details with items
    const { data: transfer, error: transferError } = await serviceClient
      .from("stock_transfers")
      .select(`
        *,
        items:stock_transfer_items(*, product:products(*))
      `)
      .eq("id", id)
      .single()

    if (transferError || !transfer) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 })
    }

    switch (action) {
      case 'approve':
        if (transfer.status !== 'pending') {
          return NextResponse.json({ error: "Can only approve pending transfers" }, { status: 400 })
        }
        updateData = {
          status: 'approved',
          approved_by: approved_by || user.id,
          updated_at: new Date().toISOString()
        }
        break

      case 'ship':
        if (transfer.status !== 'approved') {
          return NextResponse.json({ error: "Can only ship approved transfers" }, { status: 400 })
        }
        // Reduce inventory from source branch
        inventoryUpdates = transfer.items.map((item: any) => ({
          branch_id: transfer.from_branch_id,
          product_id: item.product_id,
          quantity_change: -item.quantity_requested
        }))
        updateData = {
          status: 'in_transit',
          shipped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        break

      case 'receive':
        if (transfer.status !== 'in_transit') {
          return NextResponse.json({ error: "Can only receive transfers in transit" }, { status: 400 })
        }
        // Add inventory to destination branch
        inventoryUpdates = transfer.items.map((item: any) => ({
          branch_id: transfer.to_branch_id,
          product_id: item.product_id,
          quantity_change: item.quantity_requested
        }))
        updateData = {
          status: 'received',
          received_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        break

      case 'cancel':
        if (['received', 'cancelled'].includes(transfer.status)) {
          return NextResponse.json({ error: "Cannot cancel completed or already cancelled transfers" }, { status: 400 })
        }
        // If transfer was shipped but not received, return inventory to source
        if (transfer.status === 'in_transit') {
          inventoryUpdates = transfer.items.map((item: any) => ({
            branch_id: transfer.from_branch_id,
            product_id: item.product_id,
            quantity_change: item.quantity_requested
          }))
        }
        updateData = {
          status: 'cancelled',
          updated_at: new Date().toISOString()
        }
        break
    }

    // Update transfer status
    const { error: updateError } = await serviceClient
      .from("stock_transfers")
      .update(updateData)
      .eq("id", id)

    if (updateError) throw updateError

    // Update inventory levels
    for (const update of inventoryUpdates) {
      // Check if branch inventory entry exists
      const { data: existing } = await serviceClient
        .from("branch_inventory")
        .select("id, quantity")
        .eq("branch_id", update.branch_id)
        .eq("product_id", update.product_id)
        .single()

      if (existing) {
        // Update existing
        const newQuantity = Math.max(0, existing.quantity + update.quantity_change)
        await serviceClient
          .from("branch_inventory")
          .update({
            quantity: newQuantity,
            last_updated: new Date().toISOString()
          })
          .eq("id", existing.id)
      } else if (update.quantity_change > 0) {
        // Create new entry only if adding positive quantity
        await serviceClient
          .from("branch_inventory")
          .insert({
            branch_id: update.branch_id,
            product_id: update.product_id,
            quantity: update.quantity_change,
            min_stock_level: 10,
            max_stock_level: 1000
          })
      }
    }

    return NextResponse.json({ message: `Transfer ${action}d successfully` })
  } catch (error) {
    console.error("Stock transfer update error:", error)
    return NextResponse.json({ error: "Failed to update transfer" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceClient = createServiceClient()
    const body = await request.json()

    const { from_branch_id, to_branch_id, items, notes } = body

    if (!from_branch_id || !to_branch_id || !items || items.length === 0) {
      return NextResponse.json({ error: "From branch, to branch, and items are required" }, { status: 400 })
    }

    if (from_branch_id === to_branch_id) {
      return NextResponse.json({ error: "Cannot transfer to the same branch" }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Generate transfer number
    const transferNumber = `ST-${Date.now()}`

    // Create stock transfer
    const { data: transfer, error: transferError } = await serviceClient
      .from("stock_transfers")
      .insert({
        transfer_number: transferNumber,
        from_branch_id,
        to_branch_id,
        requested_by: user.id,
        notes
      })
      .select()
      .single()

    if (transferError) throw transferError

    // Create transfer items
    const transferItems = items.map((item: any) => ({
      stock_transfer_id: transfer.id,
      product_id: item.product_id,
      quantity_requested: item.quantity,
      unit_cost: item.unit_cost || 0
    }))

    const { error: itemsError } = await serviceClient
      .from("stock_transfer_items")
      .insert(transferItems)

    if (itemsError) throw itemsError

    return NextResponse.json({ transfer }, { status: 201 })
  } catch (error) {
    console.error("Stock transfer creation error:", error)
    return NextResponse.json({ error: "Failed to create stock transfer" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const serviceClient = createServiceClient()

    // First get the transfers
    const { data: transfers, error: transfersError } = await serviceClient
      .from("stock_transfers")
      .select("*")
      .order("created_at", { ascending: false })

    if (transfersError) {
      console.error("Stock transfers query error:", transfersError)
      return NextResponse.json({ error: "Failed to fetch stock transfers" }, { status: 500 })
    }

    if (!transfers || transfers.length === 0) {
      return NextResponse.json({ transfers: [] })
    }

    // Get unique branch IDs
    const branchIds = new Set<string>()
    transfers.forEach(transfer => {
      if (transfer.from_branch_id) branchIds.add(transfer.from_branch_id)
      if (transfer.to_branch_id) branchIds.add(transfer.to_branch_id)
    })

    // Get unique profile IDs
    const profileIds = new Set<string>()
    transfers.forEach(transfer => {
      if (transfer.requested_by) profileIds.add(transfer.requested_by)
      if (transfer.approved_by) profileIds.add(transfer.approved_by)
    })

    // Fetch branches
    const { data: branches } = await serviceClient
      .from("branches")
      .select("id, name")
      .in("id", Array.from(branchIds))

    // Fetch profiles
    const { data: profiles } = await serviceClient
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(profileIds))

    // Create lookup maps
    const branchMap = new Map(branches?.map(b => [b.id, b.name]) || [])
    const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || [])

    // Transform the data
    const transformedTransfers = transfers.map(transfer => ({
      ...transfer,
      from_branch_name: transfer.from_branch_id ? branchMap.get(transfer.from_branch_id) : null,
      to_branch_name: transfer.to_branch_id ? branchMap.get(transfer.to_branch_id) : null,
      requested_by_name: transfer.requested_by ? profileMap.get(transfer.requested_by) : null,
      approved_by_name: transfer.approved_by ? profileMap.get(transfer.approved_by) : null,
    }))

    return NextResponse.json({ transfers: transformedTransfers })
  } catch (error) {
    console.error("Stock transfers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}