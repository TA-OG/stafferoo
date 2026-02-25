/**
 * Diagnostic endpoint to check staff profile statuses
 * Helps debug why staff aren't showing in approval queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/lib/supabase-server';
import { requireAdmin } from '@/app/lib/admin';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    // Get all staff profiles with their status
    const { data: allStaff, error: staffError } = await supabase
      .from('staff_profiles')
      .select('id, full_name, email, verification_status, submitted_at, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (staffError) {
      return NextResponse.json(
        { ok: false, error: { code: 'DB_ERROR', message: staffError.message, requestId } },
        { status: 500 }
      );
    }

    // Count by status
    const statusCounts = allStaff?.reduce((acc, staff) => {
      const status = staff.verification_status || 'null/undefined';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get pending specifically
    const pendingStaff = allStaff?.filter(s => s.verification_status === 'pending') || [];

    return NextResponse.json({
      ok: true,
      data: {
        totalStaff: allStaff?.length || 0,
        statusCounts,
        pendingCount: pendingStaff.length,
        recentStaff: allStaff?.map(s => ({
          id: s.id,
          name: s.full_name,
          email: s.email,
          status: s.verification_status,
          submitted: s.submitted_at,
          created: s.created_at,
        })),
        pendingStaff: pendingStaff.map(s => ({
          id: s.id,
          name: s.full_name,
          email: s.email,
          submitted: s.submitted_at,
        })),
      },
      requestId,
    });

  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Admin access required', requestId } },
        { status: 403 }
      );
    }

    console.error('[GET /api/admin/diagnostics/staff-status]', { requestId, error });
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error', requestId } },
      { status: 500 }
    );
  }
}
