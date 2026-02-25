/**
 * GET /api/notifications
 * List notifications for the authenticated user
 * 
 * POST /api/notifications
 * Create a notification (service role only)
 */

import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/app/lib/auth';
import { createApiRoute, rateLimits } from '@/app/lib/api-wrapper';

export const GET = createApiRoute(async (request, requestId) => {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: auth.message, requestId } },
        { status: auth.status }
      );
    }
    const { user, supabase } = auth;

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const unreadOnly = searchParams.get('unread') === 'true';

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('[GET /api/notifications] Fetch failed', { requestId, error });
      return NextResponse.json(
        { ok: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch notifications', requestId } },
        { status: 500 }
      );
    }

    // Get unread count
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null);

    if (countError) {
      console.error('[GET /api/notifications] Count failed', { requestId, error: countError });
    }

    return NextResponse.json({
      ok: true,
      data: {
        notifications: notifications || [],
        unreadCount: unreadCount || 0,
      },
    });

  } catch (error) {
    console.error('[GET /api/notifications] Unexpected error', { requestId, error });
    return NextResponse.json(
      { 
        ok: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An unexpected error occurred',
          requestId 
        } 
      },
      { status: 500 }
    );
  }
}, { rateLimit: rateLimits.apiRead });

/**
 * Mark all notifications as read
 */
export const PATCH = createApiRoute(async (request, requestId) => {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: auth.message, requestId } },
        { status: auth.status }
      );
    }
    const { user, supabase } = auth;

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', user.id)
      .is('read_at', null);

    if (error) {
      console.error('[PATCH /api/notifications] Update failed', { requestId, error });
      return NextResponse.json(
        { ok: false, error: { code: 'UPDATE_FAILED', message: 'Failed to mark notifications as read', requestId } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: { message: 'All notifications marked as read' },
    });

  } catch (error) {
    console.error('[PATCH /api/notifications] Unexpected error', { requestId, error });
    return NextResponse.json(
      { 
        ok: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An unexpected error occurred',
          requestId 
        } 
      },
      { status: 500 }
    );
  }
}, { rateLimit: rateLimits.apiMutation });
