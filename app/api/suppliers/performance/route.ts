import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface PurchaseOrder {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  purchase_order_items?: Array<{
    quantity_ordered: number;
    quantity_received: number;
  }>;
}

interface QualityData {
  quality_rating: number | null;
  notes: string | null;
  created_at: string;
}

interface DefectRecord {
  quantity_defective: number | null;
  total_quantity: number | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// GET - Fetch supplier performance metrics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const supplierId = searchParams.get('supplier_id');
    const period = searchParams.get('period') || '12'; // months
    const branchId = searchParams.get('branch_id');
    
    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(period));
    
    // Fetch supplier basic info
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single();
    
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }
    
    // Fetch purchase orders statistics
    const { data: poStats } = await supabase
      .from('purchase_orders')
      .select(`
        id, status, total_amount, created_at, expected_delivery_date, actual_delivery_date,
        purchase_order_items(quantity_ordered, quantity_received)
      `)
      .eq('supplier_id', supplierId)
      .gte('created_at', startDate.toISOString());
    
    // Calculate delivery rate
    const completedOrders: PurchaseOrder[] = (poStats || []).filter((po: PurchaseOrder) => po.status === 'received');
    const onTimeDeliveries = completedOrders.filter((po: PurchaseOrder) => {
      if (po.actual_delivery_date && po.expected_delivery_date) {
        return new Date(po.actual_delivery_date) <= new Date(po.expected_delivery_date);
      }
      return false;
    });
    const deliveryRate = completedOrders.length > 0 
      ? (onTimeDeliveries.length / completedOrders.length) * 100 
      : 100;
    
    // Calculate average lead time
    const leadTimes: number[] = completedOrders
      .filter((po: PurchaseOrder) => po.actual_delivery_date && po.created_at)
      .map((po: PurchaseOrder) => {
        const created = new Date(po.created_at);
        const delivered = new Date(po.actual_delivery_date!);
        return Math.ceil((delivered.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      });
    const avgLeadTime = leadTimes.length > 0 
      ? leadTimes.reduce((a: number, b: number) => a + b, 0) / leadTimes.length 
      : 0;
    
    // Calculate order fulfillment rate
    const allItems = completedOrders.flatMap((po: PurchaseOrder) => po.purchase_order_items || []);
    const fulfilledItems = allItems.filter((item) => 
      (item.quantity_received || 0) >= (item.quantity_ordered || 0)
    );
    const fulfillmentRate = allItems.length > 0 
      ? (fulfilledItems.length / allItems.length) * 100 
      : 100;
    
    // Fetch quality scores from goods received notes
    const { data: qualityData } = await supabase
      .from('goods_received_notes')
      .select('quality_rating, notes, created_at')
      .eq('supplier_id', supplierId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);
    
    const qualityScores: QualityData[] = qualityData?.filter((q: QualityData) => q.quality_rating !== null) || [];
    const avgQualityScore = qualityScores.length > 0
      ? qualityScores.reduce((sum: number, q: QualityData) => sum + (q.quality_rating || 0), 0) / qualityScores.length
      : 5;
    
    // Calculate defect rate
    const { data: defectRecords } = await supabase
      .from('quality_defect_reports')
      .select('quantity_defective, total_quantity, created_at')
      .eq('supplier_id', supplierId)
      .gte('created_at', startDate.toISOString());
    
    const totalReceived = allItems.reduce((sum: number, item: { quantity_ordered?: number }) => sum + (item.quantity_ordered || 0), 0);
    const totalDefective = defectRecords?.reduce((sum: number, d: DefectRecord) => sum + (d.quantity_defective || 0), 0) || 0;
    const defectRate = totalReceived > 0 ? (totalDefective / totalReceived) * 100 : 0;
    
    // Calculate price competitiveness (compare with average market prices)
    const { data: priceData } = await supabase
      .from('supplier_products')
      .select('unit_price, product_id')
      .eq('supplier_id', supplierId);
    
    // Calculate cost trend
    const { data: historicalOrders } = await supabase
      .from('purchase_orders')
      .select('total_amount, created_at')
      .eq('supplier_id', supplierId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });
    
    // Group by month for trend analysis
    const monthlySpend: Record<string, number> = {};
    (historicalOrders || []).forEach((order: { created_at: string; total_amount: number | null }) => {
      const month = order.created_at.substring(0, 7); // YYYY-MM
      monthlySpend[month] = (monthlySpend[month] || 0) + (order.total_amount || 0);
    });
    
    // Calculate overall performance score (weighted average)
    const performanceScore = Math.round(
      (deliveryRate * 0.25) +
      (fulfillmentRate * 0.20) +
      (clamp(10 - avgLeadTime / 3, 0, 10) * 0.15) * 10 + // Normalize lead time
      (avgQualityScore / 5 * 100) * 0.25 +
      (clamp(10 - defectRate * 10, 0, 10) * 0.15) * 10
    );
    
    // Determine supplier rating
    let rating = 'Poor';
    if (performanceScore >= 90) rating = 'Excellent';
    else if (performanceScore >= 75) rating = 'Good';
    else if (performanceScore >= 60) rating = 'Average';
    else if (performanceScore >= 40) rating = 'Fair';
    
    return NextResponse.json({
      supplier: {
        id: supplier.id,
        name: supplier.name,
        code: supplier.code
      },
      summary: {
        performanceScore,
        rating,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        avgLeadTime: Math.round(avgLeadTime * 10) / 10,
        fulfillmentRate: Math.round(fulfillmentRate * 100) / 100,
        avgQualityScore: Math.round(avgQualityScore * 10) / 10,
        defectRate: Math.round(defectRate * 100) / 100,
        totalOrders: poStats?.length || 0,
        completedOrders: completedOrders.length,
        totalSpend: (poStats || []).reduce((sum: number, po: PurchaseOrder) => sum + (po.total_amount || 0), 0)
      },
      trends: {
        monthlySpend,
        qualityTrend: qualityScores.slice(0, 12).reverse().map(q => ({
          date: q.created_at,
          score: q.quality_rating
        }))
      },
      recommendations: generateRecommendations({
        deliveryRate, avgLeadTime, fulfillmentRate, avgQualityScore, defectRate
      })
    });
    
  } catch (error) {
    console.error('Error fetching performance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper to generate recommendations based on metrics
function generateRecommendations(metrics: {
  deliveryRate: number;
  avgLeadTime: number;
  fulfillmentRate: number;
  avgQualityScore: number;
  defectRate: number;
}) {
  const recommendations: string[] = [];
  
  if (metrics.deliveryRate < 80) {
    recommendations.push('Consider discussing delivery reliability with the supplier');
  }
  if (metrics.avgLeadTime > 14) {
    recommendations.push('Lead time is high. Consider negotiating faster delivery options');
  }
  if (metrics.fulfillmentRate < 95) {
    recommendations.push('Order fulfillment rate needs improvement');
  }
  if (metrics.avgQualityScore < 3.5) {
    recommendations.push('Quality scores are below average. Request quality improvement plan');
  }
  if (metrics.defectRate > 2) {
    recommendations.push('Defect rate is concerning. Implement stricter quality checks');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Supplier is performing well. Consider for preferred vendor status');
  }
  
  return recommendations;
}

// POST - Update supplier performance metrics manually
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { supplierId, qualityRating, notes, defectInfo } = await request.json();
    
    // Record quality assessment
    if (qualityRating) {
      const { error: qualityError } = await supabase
        .from('supplier_quality_assessments')
        .insert({
          supplier_id: supplierId,
          rating: qualityRating,
          assessed_by: user.id,
          assessment_date: new Date().toISOString(),
          notes: notes
        });
      
      if (qualityError) {
        return NextResponse.json({ error: qualityError.message }, { status: 500 });
      }
    }
    
    // Record defect report
    if (defectInfo) {
      const { error: defectError } = await supabase
        .from('quality_defect_reports')
        .insert({
          supplier_id: supplierId,
          product_id: defectInfo.productId,
          quantity_defective: defectInfo.quantity,
          defect_type: defectInfo.type,
          severity: defectInfo.severity,
          reported_by: user.id,
          report_date: new Date().toISOString(),
          resolution_status: 'open',
          notes: defectInfo.notes
        });
      
      if (defectError) {
        return NextResponse.json({ error: defectError.message }, { status: 500 });
      }
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error recording performance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
