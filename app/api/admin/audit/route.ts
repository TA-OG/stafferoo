/**
 * GET /api/admin/audit
 * Get registration audit data and data integrity status
 * 
 * POST /api/admin/audit/sync
 * Trigger a manual sync/integrity check
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';
import { requireAdmin } from '@/app/lib/admin';

// GET audit data
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'summary'; // 'summary', 'recent', 'orphaned', 'integrity'
    const hours = parseInt(searchParams.get('hours') || '24');
    
    const supabase = await createClient();
    
    switch (view) {
      case 'summary': {
        // Summary stats
        const [
          { data: recentRegistrations },
          { data: failedAttempts },
          { data: integrityStatus },
          { data: totalSettings },
          { data: totalStaff },
        ] = await Promise.all([
          // Recent registrations
          supabase
            .from('registration_audit_log')
            .select('role, event_type, success', { count: 'exact' })
            .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()),
          
          // Failed attempts
          supabase
            .from('registration_audit_log')
            .select('id', { count: 'exact' })
            .eq('success', false)
            .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()),
          
          // Latest integrity check
          supabase
            .from('data_integrity_checks')
            .select('*')
            .order('checked_at', { ascending: false })
            .limit(5),
          
          // Total settings
          supabase
            .from('setting_profiles')
            .select('id', { count: 'exact' }),
          
          // Total staff
          supabase
            .from('staff_profiles')
            .select('id', { count: 'exact' }),
        ]);
        
        // Calculate stats
        const stats = {
          totalRegistrations: recentRegistrations?.length || 0,
          failedAttempts: failedAttempts?.length || 0,
          settingsTotal: totalSettings?.length || 0,
          staffTotal: totalStaff?.length || 0,
          byRole: {} as Record<string, number>,
          byEvent: {} as Record<string, number>,
        };
        
        recentRegistrations?.forEach((r: { role: string; event_type: string }) => {
          stats.byRole[r.role] = (stats.byRole[r.role] || 0) + 1;
          stats.byEvent[r.event_type] = (stats.byEvent[r.event_type] || 0) + 1;
        });
        
        return NextResponse.json({
          ok: true,
          data: {
            stats,
            integrity: integrityStatus || [],
            timeframe: `${hours} hours`,
          },
        });
      }
      
      case 'recent': {
        // Recent audit log entries
        const { data: logs, error } = await supabase
          .from('registration_audit_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (error) throw error;
        
        return NextResponse.json({
          ok: true,
          data: { logs: logs || [] },
        });
      }
      
      case 'orphaned': {
        // Orphaned registrations that need attention
        const { data: orphaned, error } = await supabase
          .from('orphaned_registrations')
          .select('*')
          .limit(50);
        
        if (error) throw error;
        
        return NextResponse.json({
          ok: true,
          data: { 
            orphaned: orphaned || [],
            count: orphaned?.length || 0,
          },
        });
      }
      
      case 'integrity': {
        // Run integrity check
        const { data: integrityResults, error } = await supabase
          .rpc('verify_data_integrity');
        
        if (error) throw error;
        
        // Get latest checks
        const { data: checks } = await supabase
          .from('data_integrity_checks')
          .select('*')
          .order('checked_at', { ascending: false })
          .limit(10);
        
        return NextResponse.json({
          ok: true,
          data: {
            results: integrityResults || [],
            history: checks || [],
          },
        });
      }
      
      default:
        return NextResponse.json(
          { ok: false, error: { code: 'INVALID_VIEW', message: 'Invalid view parameter' } },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('[GET /api/admin/audit]', { requestId, error });
    
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred', requestId } },
      { status: 500 }
    );
  }
}

// POST - trigger sync
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    await requireAdmin();
    
    const body = await request.json();
    const action = body.action || 'sync'; // 'sync', 'integrity_check'
    
    const supabase = await createClient();
    
    if (action === 'sync') {
      // Process unverified registrations
      const { data: result, error } = await supabase
        .rpc('process_unverified_registrations');
      
      if (error) throw error;
      
      return NextResponse.json({
        ok: true,
        data: {
          message: 'Sync completed',
          processed: result?.[0]?.processed_count || 0,
          issues: result?.[0]?.issues_found || 0,
        },
      });
    }
    
    if (action === 'integrity_check') {
      // Run full integrity check
      const { data: results, error } = await supabase
        .rpc('verify_data_integrity');
      
      if (error) throw error;
      
      return NextResponse.json({
        ok: true,
        data: {
          message: 'Integrity check completed',
          checks: results || [],
        },
      });
    }
    
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_ACTION', message: 'Invalid action' } },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('[POST /api/admin/audit]', { requestId, error });
    
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred', requestId } },
      { status: 500 }
    );
  }
}
