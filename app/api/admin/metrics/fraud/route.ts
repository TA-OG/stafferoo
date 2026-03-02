/**
 * GET /api/admin/metrics/fraud
 * 
 * Returns fraud and scraping detection metrics:
 * - Active fraud signals
 * - Scraping patterns detected
 * - Velocity abuse alerts
 * - IP-based anomalies
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
  const severity = searchParams.get('severity') || 'all';

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  try {
    // Get fraud signals
    let fraudQuery = supabase
      .from('fraud_signals')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (severity !== 'all') {
      fraudQuery = fraudQuery.eq('severity', severity);
    }

    const { data: fraudSignals } = await fraudQuery;

    // Get scraping detection from API usage
    const { data: scrapingPatterns } = await supabase
      .from('api_usage')
      .select('user_id, ip_address, is_scraping_suspicious, created_at')
      .eq('is_scraping_suspicious', true)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    // Aggregate fraud by type
    const fraudByType = fraudSignals?.reduce((acc, signal) => {
      acc[signal.signal_type] = (acc[signal.signal_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Aggregate by severity
    const fraudBySeverity = fraudSignals?.reduce((acc, signal) => {
      acc[signal.severity] = (acc[signal.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get unique IPs with suspicious activity
    const suspiciousIps = [...new Set(scrapingPatterns?.map(s => s.ip_address) || [])];

    // Get top offending users
    const userOffenses = scrapingPatterns?.reduce((acc, pattern) => {
      if (!pattern.user_id) return acc;
      if (!acc[pattern.user_id]) {
        acc[pattern.user_id] = { count: 0, ips: new Set() };
      }
      acc[pattern.user_id].count++;
      if (pattern.ip_address) acc[pattern.user_id].ips.add(pattern.ip_address);
      return acc;
    }, {} as Record<string, { count: number; ips: Set<string> }>) || {};

    const topOffenders = Object.entries(userOffenses)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([userId, data]) => ({
        userId,
        suspiciousRequests: data.count,
        uniqueIps: data.ips.size,
      }));

    // Recent signals needing review
    const needsReview = fraudSignals
      ?.filter(s => s.status === 'open' && ['high', 'critical'].includes(s.severity))
      .slice(0, 10)
      .map(s => ({
        id: s.id,
        type: s.signal_type,
        severity: s.severity,
        entityType: s.entity_type,
        entityId: s.entity_id,
        createdAt: s.created_at,
        evidence: s.evidence,
      }));

    return Response.json({
      summary: {
        totalSignals7d: fraudSignals?.length || 0,
        openSignals: fraudSignals?.filter(s => s.status === 'open').length || 0,
        criticalSignals: fraudSignals?.filter(s => s.severity === 'critical').length || 0,
        scrapingIncidents: scrapingPatterns?.length || 0,
        suspiciousIps: suspiciousIps.length,
      },
      fraudByType,
      fraudBySeverity,
      recentSignals: fraudSignals?.slice(0, 20),
      needsReview,
      scraping: {
        totalIncidents: scrapingPatterns?.length || 0,
        suspiciousIps,
        topOffenders,
        recentActivity: scrapingPatterns?.slice(0, 20),
      },
    });

  } catch (error) {
    console.error('[Admin Fraud] Error:', error);
    return Response.json({ error: 'Failed to fetch fraud metrics' }, { status: 500 });
  }
}
