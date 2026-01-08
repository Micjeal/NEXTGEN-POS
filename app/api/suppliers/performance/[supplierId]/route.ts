import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Get supplier performance metrics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    const supabase = await createClient();
    const { supplierId } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('end_date') || new Date().toISOString();

    // Get delivery performance
    const { data: deliveryMetrics, error: deliveryError } = await supabase
      .rpc('get_supplier_delivery_metrics', {
        p_supplier_id: supplierId,
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (deliveryError && deliveryError.code !== 'PGRST116') {
      throw deliveryError;
    }

    // Get quality scores from received purchase orders
    const { data: qualityScores, error: qualityError } = await supabase
      .from('purchase_order_received_items')
      .select(`
        quality_score,
        received_quantity,
        accepted_quantity,
        purchase_order_items!inner(
          purchase_orders!inner(supplier_id)
        )
      `)
      .eq('purchase_order_items.purchase_orders.supplier_id', supplierId)
      .gte('received_at', startDate)
      .lte('received_at', endDate);

    if (qualityError) throw qualityError;

    // Calculate quality metrics
    let totalReceived = 0;
    let totalAccepted = 0;
    let qualitySum = 0;
    let qualityCount = 0;

    qualityScores?.forEach((item: any) => {
      totalReceived += item.received_quantity || 0;
      totalAccepted += item.accepted_quantity || 0;
      if (item.quality_score) {
        qualitySum += item.quality_score;
        qualityCount += 1;
      }
    });

    const qualityMetrics = {
      acceptanceRate: totalReceived > 0 ? (totalAccepted / totalReceived) * 100 : 0,
      averageQualityScore: qualityCount > 0 ? qualitySum / qualityCount : 0,
      totalItemsReceived: totalReceived,
      totalItemsAccepted: totalAccepted
    };

    // Get on-time delivery rate
    const { data: onTimeData, error: onTimeError } = await supabase
      .from('purchase_orders')
      .select('expected_delivery_date, actual_delivery_date, status')
      .eq('supplier_id', supplierId)
      .gte('expected_delivery_date', startDate)
      .lte('expected_delivery_date', endDate);

    if (onTimeError) throw onTimeError;

    let onTimeDeliveries = 0;
    let totalExpectedDeliveries = 0;

    onTimeData?.forEach((po: any) => {
      if (po.status === 'received' || po.status === 'partially_received') {
        totalExpectedDeliveries += 1;
        if (po.actual_delivery_date && new Date(po.actual_delivery_date) <= new Date(po.expected_delivery_date)) {
          onTimeDeliveries += 1;
        }
      }
    });

    const deliveryPerformance = {
      onTimeDeliveryRate: totalExpectedDeliveries > 0 ? (onTimeDeliveries / totalExpectedDeliveries) * 100 : 0,
      totalDeliveries: totalExpectedDeliveries,
      onTimeDeliveries: onTimeDeliveries
    };

    // Get price compliance
    const { data: priceCompliance, error: priceError } = await supabase
      .from('purchase_order_items')
      .select(`
        unit_price,
        last_unit_price,
        purchase_orders!inner(supplier_id, status)
      `)
      .eq('purchase_orders.supplier_id', supplierId)
      .gte('purchase_orders.order_date', startDate)
      .lte('purchase_orders.order_date', endDate);

    if (priceError) throw priceError;

    let priceChanges = 0;
    let totalItems = 0;

    priceCompliance?.forEach((item: any) => {
      if (item.last_unit_price && item.unit_price !== item.last_unit_price) {
        priceChanges += 1;
      }
      totalItems += 1;
    });

    const priceMetrics = {
      priceStabilityRate: totalItems > 0 ? ((totalItems - priceChanges) / totalItems) * 100 : 100,
      priceChanges: priceChanges,
      totalItems: totalItems
    };

    // Calculate overall performance score
    const overallScore = (
      (deliveryPerformance.onTimeDeliveryRate || 0) * 0.35 +
      (qualityMetrics.acceptanceRate || 0) * 0.35 +
      (priceMetrics.priceStabilityRate || 0) * 0.2 +
      (qualityMetrics.averageQualityScore || 0) * 0.1
    );

    return NextResponse.json({
      supplierId,
      period: { startDate, endDate },
      deliveryPerformance,
      qualityMetrics,
      priceMetrics,
      overallScore: Math.round(overallScore * 100) / 100,
      rating: overallScore >= 90 ? 'A' : overallScore >= 75 ? 'B' : overallScore >= 60 ? 'C' : 'D'
    });
  } catch (error: any) {
    console.error('Error fetching supplier performance:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update supplier performance metrics manually
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    const supabase = await createClient();
    const { supplierId } = await params;
    const body = await request.json();

    const { data, error } = await supabase
      .from('supplier_performance')
      .upsert({
        supplier_id: supplierId,
        ...body,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating supplier performance:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
