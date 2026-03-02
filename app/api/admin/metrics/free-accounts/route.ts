/**
 * GET /api/admin/metrics/free-accounts
 * 
 * Returns detailed analysis of free accounts:
 * - Cost per free account
 * - API usage per account
 * - Support tickets per account
 * - High-cost free accounts (for intervention)
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
  const minCost = parseFloat(searchParams.get('minCost') || '5');
  const limit = parseInt(searchParams.get('limit') || '50');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  try {
    // Get free settings with cost aggregation
    const { data: freeSettings } = await supabase
      .from('setting_profiles')
      .select('id, setting_name, email, created_at, postcode')
      .not('id', 'in', (
        supabase.from('subscriptions').select('setting_id').eq('status', 'active')
      ))
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!freeSettings || freeSettings.length === 0) {
      return Response.json({ accounts: [], summary: {} });
    }

    const settingIds = freeSettings.map(s => s.id);

    // Get costs per setting
    const { data: costs } = await supabase
      .from('cost_tracking')
      .select('entity_id, cost_amount, cost_category, quantity')
      .eq('entity_type', 'setting')
      .in('entity_id', settingIds)
      .gte('created_at', startDate.toISOString());

    // Get API usage per setting
    const { data: apiUsage } = await supabase
      .from('api_usage')
      .select('user_id, count')
      .in('user_id', settingIds)
      .gte('created_at', startDate.toISOString());

    // Get support tickets per setting
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('entity_id, time_spent_minutes, category, status')
      .eq('entity_type', 'setting')
      .in('entity_id', settingIds)
      .gte('created_at', startDate.toISOString());

    // Aggregate data per setting
    const accounts = freeSettings.map(setting => {
      const settingCosts = costs?.filter(c => c.entity_id === setting.id) || [];
      const settingApi = apiUsage?.filter(a => a.user_id === setting.id) || [];
      const settingTickets = tickets?.filter(t => t.entity_id === setting.id) || [];

      const totalCost = settingCosts.reduce((sum, c) => sum + (c.cost_amount || 0), 0);
      const smsCount = settingCosts.filter(c => c.cost_category === 'sms').reduce((sum, c) => sum + (c.quantity || 0), 0);
      const apiCalls = settingCosts.filter(c => c.cost_category === 'api_call').reduce((sum, c) => sum + (c.quantity || 0), 0);
      const supportMinutes = settingTickets.reduce((sum, t) => sum + (t.time_spent_minutes || 0), 0);
      const supportCost = supportMinutes * 0.5; // £0.50/minute

      return {
        id: setting.id,
        name: setting.setting_name,
        email: setting.email,
        postcode: setting.postcode,
        registeredAt: setting.created_at,
        costs: {
          total: totalCost,
          support: supportCost,
          sms: settingCosts.filter(c => c.cost_category === 'sms').reduce((sum, c) => sum + (c.cost_amount || 0), 0),
          api: settingCosts.filter(c => c.cost_category === 'api_call').reduce((sum, c) => sum + (c.cost_amount || 0), 0),
        },
        usage: {
          smsCount,
          apiCalls,
          supportMinutes,
          supportTickets: settingTickets.length,
        },
        flagForReview: totalCost > minCost || supportMinutes > 60,
      };
    });

    // Filter high-cost accounts if requested
    const highCostAccounts = accounts.filter(a => a.costs.total > minCost);

    // Calculate summary stats
    const avgCost = accounts.reduce((sum, a) => sum + a.costs.total, 0) / accounts.length;
    const avgApiCalls = accounts.reduce((sum, a) => sum + a.usage.apiCalls, 0) / accounts.length;
    const avgSupportTickets = accounts.reduce((sum, a) => sum + a.usage.supportTickets, 0) / accounts.length;

    return Response.json({
      accounts: accounts.sort((a, b) => b.costs.total - a.costs.total),
      highCostAccounts,
      summary: {
        totalFreeAccounts: accounts.length,
        highCostAccountsCount: highCostAccounts.length,
        avgCostPerAccount: avgCost.toFixed(2),
        avgApiCallsPerAccount: avgApiCalls.toFixed(1),
        avgSupportTicketsPerAccount: avgSupportTickets.toFixed(2),
        totalCostAllFree: accounts.reduce((sum, a) => sum + a.costs.total, 0).toFixed(2),
      },
    });

  } catch (error) {
    console.error('[Admin Free Accounts] Error:', error);
    return Response.json({ error: 'Failed to fetch free account metrics' }, { status: 500 });
  }
}
