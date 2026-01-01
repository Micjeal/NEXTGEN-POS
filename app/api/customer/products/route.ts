import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/customer/products - Get products available for customers
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const offset = (page - 1) * limit

    // Build the query
    let query = supabase
      .from("products")
      .select(`
        id,
        name,
        price,
        image_url,
        sku,
        is_active,
        categories (
          id,
          name
        )
      `)
      .eq("is_active", true)
      .range(offset, offset + limit - 1)

    // Add category filter if provided
    if (category) {
      query = query.eq("categories.id", category)
    }

    // Add search filter if provided
    if (search) {
      query = query.ilike("name", `%${search}%`)
    }

    // Add sorting
    const validSortFields = ['name', 'price', 'created_at']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name'
    query = query.order(sortField, { ascending: sortOrder === 'asc' })

    const { data: products, error } = await query

    if (error) {
      console.error("Error fetching products:", error)
      // If table doesn't exist or other issues, return empty result
      if (error.code === '42P01' || error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          products: [],
          categories: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0
          },
          filters: {
            category: null,
            search: null,
            sortBy: 'name',
            sortOrder: 'asc'
          },
          message: "Products not yet available"
        })
      }
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)

    if (category) {
      countQuery = countQuery.eq("categories.id", category)
    }

    if (search) {
      countQuery = countQuery.ilike("name", `%${search}%`)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error("Error getting product count:", countError)
    }

    // Get categories for filtering
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name")
      .order("name")

    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError)
    }

    // Transform products to include stock_quantity
    const transformedProducts = (products || []).map(product => {
      if (!product || typeof product !== 'object') return null
      return {
        ...product,
        stock_quantity: 10 // Default stock for demo
      }
    }).filter(Boolean)

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      categories: categories || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      filters: {
        category: category || null,
        search: search || null,
        sortBy,
        sortOrder
      }
    })

  } catch (error) {
    console.error("Error in products GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}