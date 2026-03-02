/**
 * GET /api/admin/metrics/overview
 * 
 * Returns high-level metrics for the admin dashboard:
 * - Free to paid conversion rate
 * - Total costs today/this month
 * - Active fraud signals
 * - Critical alerts count
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
  const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d

  const days = parseInt(period.replace('d', ''));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // 1. Conversion Rate
    const { data: conversions } = await supabase
      .from('conversion_events')
      .select('setting_id, event_type, created_at')
      .in('event_type', ['registered', 'subscription_started'])
      .gte('created_at', startDate.toISOString());

    const registered = conversions?.filter(e => e.event_type === 'registered') || [];
    const converted = conversions?.filter(e => e.event_type === 'subscription_started') || [];
    const conversionRate = registered.length > 0 
      ? (converted.length / registered.length * 100).toFixed(2)
      : '0.00';

    // 2. Cost Metrics
    const { data: costs } = await supabase
      .from('cost_tracking')
      .select('cost_amount, cost_category')
      .gte('created_at', startDate.toISOString());

    const totalCost = costs?.reduce((sum, c) => sum + (c.cost_amount || 0), 0) || 0;
    const smsCost = costs?.filter(c => c.cost_category === 'sms').reduce((sum, c) => sum + (c.cost_amount || 0), 0) || 0;
    const apiCost = costs?.filter(c => c.cost_category === 'api_call').reduce((sum, c) => sum + (c.cost_amount || 0), 0) || 0;

    // 3. Free Account Count
    const { count: freeCount } = await supabase
      .from('setting_profiles')
      .select('id', { count: 'exact', head: true })
      .not('id', 'in', (
        supabase.from('subscriptions').select('setting_id').eq('status', 'active')
      ));

    // 4. Active Fraud Signals
    const { count: fraudCount } = await supabase
      .from('fraud_signals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open')
      .in('severity', ['high', 'critical']);

    // 5. Unacknowledged Alerts
    const { count: alertCount } = await supabase
      .from('admin_alerts')
      .select('id', { count: 'exact', head: true })
      .is('acknowledged_at', null)
      .is('resolved_at', null);

    // 6. Support Ticket Metrics
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('time_spent_minutes, category')
      .gte('created_at', startDate.toISOString());

    const totalSupportMinutes = tickets?.reduce((sum, t) => sum + (t.time_spent_minutes || 0), 0) || 0;
    const avgSupportPerFreeAccount = freeCount && freeCount > 0 
      ? (totalSupportMinutes / freeCount).toFixed(1)
      : '0.0';

    // 7. Revenue (from daily_metrics or calculate)
    const { data: revenueData } = await supabase
      .from('daily_metrics')
      .select('metric_value')
      .eq('metric_category', 'revenue')
      .eq('metric_name', 'total_gmv')
      .gte('metric_date', startDate.toISOString().split('T')[0]);

    const totalRevenue = revenueData?.reduce((sum, r) => sum + (r.metric_value || 0), 0) || 0;

    return Response.json({
      period,
      summary: {
        conversionRate: `${conversionRate}%`,
        freeAccounts: freeCount || 0,
        totalCost: `£${totalCost.toFixed(2)}`,
        totalRevenue: `£${totalRevenue.toFixed(2)}`,
        netPosition: `£${(totalRevenue - totalCost).toFixed(2)}`,
        fraudSignals: fraudCount || 0,
        unacknowledgedAlerts: alertCount || 0,
      },
      costs: {
        total: totalCost,
        sms: smsCost,
        api: apiCost,
        support: totalSupportMinutes * 0.5, // Assume £0.50 per minute support cost
      },
      support: {
        totalMinutes: totalSupportMinutes,
        avgMinutesPerFreeAccount: parseFloat(avgSupportPerFreeAccount),
        ticketCount: tickets?.length || 0,
      },
      alerts: {
        critical: alertCount || 0,
        fraud: fraudCount || 0,
      },
    });

  } catch (error) {
    console.error('[Admin Metrics] Error:', error);
    return Response.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
