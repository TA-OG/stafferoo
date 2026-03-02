/**
 * GET /api/admin/metrics/postcodes
 * 
 * Returns unit economics per postcode:
 * - Staff supply count
 * - Setting count
 * - Booking volume and fill rate
 * - Average response times
 * - Revenue per postcode
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';
import { getAuthFromRequest } from '@/app/lib/auth';
import { isAdminByEmail } from '@/app/lib/admin';

export async function GET(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth.ok) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = await isAdminByEmail(auth.user.email);
  if (!isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const minStaff = parseInt(searchParams.get('minStaff') || '0');
  const sortBy = searchParams.get('sortBy') || 'fill_rate'; // fill_rate, bookings, revenue

  try {
    // Get postcode metrics
    const { data: postcodeData } = await supabase
      .from('postcode_metrics')
      .select('*')
      .order(sortBy === 'fill_rate' ? 'avg_fill_rate' : sortBy === 'bookings' ? 'total_bookings' : 'total_gmv', { ascending: false });

    // Filter by minimum staff if requested
    const filteredData = postcodeData?.filter(p => p.staff_count >= minStaff) || [];

    // Calculate aggregates
    const totalStaff = filteredData.reduce((sum, p) => sum + p.staff_count, 0);
    const totalSettings = filteredData.reduce((sum, p) => sum + p.setting_count, 0);
    const totalBookings = filteredData.reduce((sum, p) => sum + p.total_bookings, 0);
    const totalFilled = filteredData.reduce((sum, p) => sum + p.filled_bookings, 0);
    const overallFillRate = totalBookings > 0 ? (totalFilled / totalBookings * 100).toFixed(1) : '0.0';

    // Identify problem areas (low fill rate but high demand)
    const problemAreas = filteredData
      .filter(p => p.total_bookings > 10 && p.avg_fill_rate < 0.5)
      .map(p => ({
        postcode: p.postcode_district,
        fillRate: (p.avg_fill_rate * 100).toFixed(1) + '%',
        bookings: p.total_bookings,
        staffCount: p.staff_count,
        issue: p.staff_count < 5 ? 'INSUFFICIENT_STAFF' : 'RESPONSE_TIME',
      }));

    // Identify high-performing areas
    const highPerformers = filteredData
      .filter(p => p.total_bookings > 10 && p.avg_fill_rate > 0.8)
      .slice(0, 5)
      .map(p => ({
        postcode: p.postcode_district,
        fillRate: (p.avg_fill_rate * 100).toFixed(1) + '%',
        bookings: p.total_bookings,
        revenue: `£${p.total_gmv?.toFixed(2) || '0.00'}`,
      }));

    return Response.json({
      postcodes: filteredData.map(p => ({
        district: p.postcode_district,
        staffCount: p.staff_count,
        settingCount: p.setting_count,
        bookings: {
          total: p.total_bookings,
          filled: p.filled_bookings,
          cancelled: p.cancelled_bookings,
          fillRate: (p.avg_fill_rate * 100).toFixed(1) + '%',
        },
        hours: p.total_hours,
        revenue: p.total_gmv,
        avgResponseTime: p.avg_response_time_minutes 
          ? `${p.avg_response_time_minutes}min` 
          : 'N/A',
        supplyDemandRatio: p.setting_count > 0 
          ? (p.staff_count / p.setting_count).toFixed(2) 
          : 'N/A',
      })),
      summary: {
        totalPostcodes: filteredData.length,
        totalStaff,
        totalSettings,
        totalBookings,
        overallFillRate: overallFillRate + '%',
        avgStaffPerPostcode: (totalStaff / filteredData.length).toFixed(1),
        avgSettingsPerPostcode: (totalSettings / filteredData.length).toFixed(1),
      },
      insights: {
        problemAreas,
        highPerformers,
        undersupplied: filteredData
          .filter(p => p.staff_count < 3 && p.setting_count > 5)
          .map(p => p.postcode_district),
        oversupplied: filteredData
          .filter(p => p.staff_count > 10 && p.setting_count < 3)
          .map(p => p.postcode_district),
      },
    });

  } catch (error) {
    console.error('[Admin Postcodes] Error:', error);
    return Response.json({ error: 'Failed to fetch postcode metrics' }, { status: 500 });
  }
}
