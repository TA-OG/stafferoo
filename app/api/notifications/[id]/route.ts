/**
 * PATCH /api/notifications/:id
 * Mark a single notification as read
 */

import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/app/lib/auth';
import { createApiRoute, rateLimits } from '@/app/lib/api-wrapper';

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

    // Get notification ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const notificationId = pathParts[pathParts.length - 1];

    if (!notificationId) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_ID', message: 'Notification ID is required', requestId } },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[PATCH /api/notifications/:id] Update failed', { requestId, error });
      return NextResponse.json(
        { ok: false, error: { code: 'UPDATE_FAILED', message: 'Failed to mark notification as read', requestId } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: { notification },
    });

  } catch (error) {
    console.error('[PATCH /api/notifications/:id] Unexpected error', { requestId, error });
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
