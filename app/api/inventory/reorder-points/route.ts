import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Calculate and update reorder points for products
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { supplier_id, product_id, calculation_type } = body;

    // Get inventory settings or defaults
    const { data: settings } = await supabase
      .from('inventory_settings')
      .select('*')
      .limit(1)
      .single();

    const defaultSafetyStockDays = settings?.safety_stock_days || 7;
    const defaultLeadTimeDays = settings?.default_lead_time_days || 3;
    const defaultServiceLevel = settings?.service_level || 0.95;

    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        current_stock,
        reorder_level,
        reorder_quantity,
        lead_time,
        average_daily_sales,
        supplier_products(supplier_id, lead_time_days, supplier(supplier_name))
      `);

    if (supplier_id) {
      query = query.eq('supplier_products.supplier_id', supplier_id);
    }

    if (product_id) {
      query = query.eq('id', product_id);
    }

    const { data: products, error } = await query;
    if (error) throw error;

    // Get sales history for calculating demand
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: salesHistory } = await supabase
      .from('sale_items')
      .select('product_id, quantity, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Calculate average daily sales per product
    const salesByProduct: Record<string, { total: number; dates: Set<string> }> = {};
    salesHistory?.forEach(item => {
      const date = item.created_at.split('T')[0];
      if (!salesByProduct[item.product_id]) {
        salesByProduct[item.product_id] = { total: 0, dates: new Set() };
      }
      salesByProduct[item.product_id].total += item.quantity;
      salesByProduct[item.product_id].dates.add(date);
    });

    // Calculate reorder points and update products
    const updates: Array<{
      id: string;
      average_daily_sales: number;
      reorder_level: number;
      reorder_quantity: number;
      lead_time: number;
    }> = [];

    for (const product of products || []) {
      const salesData = salesByProduct[product.id];
      const daysWithSales = salesData?.dates.size || 1;
      const avgDailySales = (salesData?.total || 0) / Math.min(daysWithSales, 30);
      
      // Lead time: use product setting or supplier product lead time or default
      const leadTime = product.lead_time || 
        (product.supplier_products?.[0]?.lead_time_days) || 
        defaultLeadTimeDays;
      
      // Safety stock calculation (based on service level)
      const zScore = defaultServiceLevel === 0.95 ? 1.645 : 
                     defaultServiceLevel === 0.90 ? 1.28 : 1.0;
      
      // Standard deviation of daily demand
      const variance = salesData?.total ? (salesData.total / daysWithSales) * (1 - 1/daysWithSales) : 0;
      const stdDev = Math.sqrt(variance);
      
      const safetyStock = Math.ceil(zScore * stdDev * Math.sqrt(leadTime + defaultSafetyStockDays));
      
      // Reorder point = (Average daily sales × Lead time) + Safety stock
      const reorderPoint = Math.ceil(avgDailySales * leadTime + safetyStock);
      
      // Reorder quantity: Economic Order Quantity approximation
      const annualDemand = avgDailySales * 365;
      const orderingCost = 25; // Assumed ordering cost
      const holdingCostRate = 0.2; // 20% of item cost annually
      const itemCost = 10; // Would get from supplier_catalog
      
      const eoq = Math.ceil(Math.sqrt((2 * annualDemand * orderingCost) / (holdingCostRate * itemCost)));
      const reorderQuantity = Math.max(eoq, product.reorder_quantity || 10);

      updates.push({
        id: product.id,
        average_daily_sales: avgDailySales,
        reorder_level: reorderPoint,
        reorder_quantity: reorderQuantity,
        lead_time: leadTime
      });
    }

    // Batch update products with calculated values
    if (updates.length > 0) {
      const { error: updateError } = await supabase
        .from('products')
        .upsert(updates.map(u => ({
          id: u.id,
          average_daily_sales: u.average_daily_sales,
          reorder_level: u.reorder_level,
          reorder_quantity: u.reorder_quantity,
          lead_time: u.lead_time,
          last_reorder_calc: new Date().toISOString()
        })));

      if (updateError) throw updateError;
    }

    // Get low stock products that need reordering
    const { data: lowStockProducts } = await supabase
      .from('products')
      .select(`
        *,
        supplier_products(supplier_id, supplier(supplier_name, email, phone))
      `)
      .lt('current_stock', 'reorder_level');

    // Group low stock by supplier for purchase order suggestions
    const suggestionsBySupplier: Record<string, Array<{
      product_id: string;
      product_name: string;
      sku: string;
      current_stock: number;
      reorder_level: number;
      suggested_quantity: number;
      supplier_sku?: string;
      supplier_price?: number;
    }>> = {};
    lowStockProducts?.forEach(product => {
      const supplier = product.supplier_products?.[0];
      if (supplier?.supplier_id) {
        if (!suggestionsBySupplier[supplier.supplier_id]) {
          suggestionsBySupplier[supplier.supplier_id] = [];
        }
        suggestionsBySupplier[supplier.supplier_id].push({
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          current_stock: product.current_stock,
          reorder_level: product.reorder_level,
          suggested_quantity: product.reorder_quantity,
          supplier_sku: supplier.supplier_sku,
          supplier_price: supplier.supplier_price
        });
      }
    });

    return NextResponse.json({
      success: true,
      products_updated: updates.length,
      reorder_points: updates,
      low_stock_alerts: lowStockProducts?.length || 0,
      purchase_order_suggestions: suggestionsBySupplier
    });
  } catch (error: any) {
    console.error('Error calculating reorder points:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Get current reorder settings and recommendations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplier_id');

    // Get inventory settings
    const { data: settings } = await supabase
      .from('inventory_settings')
      .select('*')
      .limit(1)
      .single();

    // Get products with low stock
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        current_stock,
        reorder_level,
        reorder_quantity,
        average_daily_sales,
        lead_time,
        supplier_products(
          supplier_id,
          supplier(supplier_name),
          supplier_price,
          supplier_sku
        )
      `)
      .lt('current_stock', 'reorder_level');

    if (supplierId) {
      query = query.eq('supplier_products.supplier_id', supplierId);
    }

    const { data: lowStockProducts, error } = await query;
    if (error) throw error;

    // Calculate days until stockout for each product
    const stockAlerts = lowStockProducts?.map(product => {
      const avgDailySales = product.average_daily_sales || 0;
      const daysUntilStockout = avgDailySales > 0 
        ? Math.floor(product.current_stock / avgDailySales)
        : 999;
      
      const leadTime = product.lead_time || 3;
      const needsReorder = daysUntilStockout <= leadTime;

      return {
        ...product,
        days_until_stockout: daysUntilStockout,
        needs_reorder: needsReorder,
        priority: daysUntilStockout <= leadTime ? 'critical' : 
                  daysUntilStockout <= leadTime * 2 ? 'high' : 'medium'
      };
    }) || [];

    // Group by supplier
    const bySupplier: Record<string, { supplier_name: string; products: any[] }> = {};
    stockAlerts.forEach(alert => {
      const supplierProduct = alert.supplier_products?.[0];
      const key = supplierProduct?.supplier_id || 'unknown';
      if (!bySupplier[key]) {
        const supplier = Array.isArray(supplierProduct?.supplier) 
          ? supplierProduct.supplier[0] 
          : supplierProduct?.supplier;
        bySupplier[key] = {
          supplier_name: supplier?.supplier_name || 'Unknown',
          products: []
        };
      }
      bySupplier[key].products.push(alert);
    });

    return NextResponse.json({
      settings: settings || {
        safety_stock_days: 7,
        default_lead_time_days: 3,
        service_level: 0.95
      },
      low_stock_count: stockAlerts.length,
      critical_alerts: stockAlerts.filter(a => a.priority === 'critical').length,
      alerts_by_supplier: bySupplier,
      alerts: stockAlerts
    });
  } catch (error: any) {
    console.error('Error fetching reorder info:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
