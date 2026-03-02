/**
 * GET /api/admin/alerts - List all alerts
 * POST /api/admin/alerts - Create new alert (from background jobs)
 * PATCH /api/admin/alerts/:id - Acknowledge or resolve alert
 * 
 * Alert system for threshold breaches and risk signals
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';
import { getAuthFromRequest } from '@/app/lib/auth';
import { isAdminByEmail } from '@/app/lib/admin';

// GET: List alerts
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
  const status = searchParams.get('status') || 'open'; // open, acknowledged, resolved, all
  const severity = searchParams.get('severity');
  const type = searchParams.get('type');

  let query = supabase
    .from('admin_alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (status === 'open') {
    query = query.is('resolved_at', null);
  } else if (status === 'acknowledged') {
    query = query.not('acknowledged_at', 'is', null).is('resolved_at', null);
  } else if (status === 'resolved') {
    query = query.not('resolved_at', 'is', null);
  }

  if (severity) {
    query = query.eq('severity', severity);
  }

  if (type) {
    query = query.eq('alert_type', type);
  }

  const { data: alerts, error } = await query.limit(100);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ alerts });
}

// POST: Create alert (called by background jobs or monitoring)
export async function POST(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth.ok) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = await isAdminByEmail(auth.user.email);
  if (!isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  const body = await req.json();

  const { data: alert, error } = await supabase
    .from('admin_alerts')
    .insert({
      alert_type: body.alert_type,
      severity: body.severity,
      title: body.title,
      description: body.description,
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      metric_value: body.metric_value,
      threshold_value: body.threshold_value,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ alert }, { status: 201 });
}

// PATCH: Acknowledge or resolve alert
export async function PATCH(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth.ok) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = await isAdminByEmail(auth.user.email);
  if (!isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  const body = await req.json();
  const { id, action } = body; // action: 'acknowledge' or 'resolve'

  if (!id || !action) {
    return Response.json({ error: 'ID and action required' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  
  if (action === 'acknowledge') {
    update.acknowledged_at = new Date().toISOString();
    update.acknowledged_by = auth.user.id;
  } else if (action === 'resolve') {
    update.resolved_at = new Date().toISOString();
  } else {
    return Response.json({ error: 'Invalid action' }, { status: 400 });
  }

  const { data: alert, error } = await supabase
    .from('admin_alerts')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ alert });
}
