/**
 * GET /api/bookings/:id/chat
 * Get chat messages for a booking
 * 
 * POST /api/bookings/:id/chat
 * Send a message in the booking chat
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthFromRequest } from '@/app/lib/auth';
import { createApiRoute, rateLimits } from '@/app/lib/api-wrapper';

const sendMessageSchema = z.object({
  body: z.string().min(1).max(2000),
});

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

    // Get booking ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const bookingId = pathParts[pathParts.indexOf('bookings') + 1];

    if (!bookingId) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_ID', message: 'Booking ID is required', requestId } },
        { status: 400 }
      );
    }

    // Verify user is a participant in this booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, setting_id, primary_staff_id, secondary_staff_id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { ok: false, error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found', requestId } },
        { status: 404 }
      );
    }

    const isParticipant = 
      booking.setting_id === user.id ||
      booking.primary_staff_id === user.id ||
      booking.secondary_staff_id === user.id;

    if (!isParticipant) {
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'You are not a participant in this booking', requestId } },
        { status: 403 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const before = searchParams.get('before');

    let query = supabase
      .from('chat_messages')
      .select(`
        id,
        body,
        sender_id,
        read_at,
        created_at,
        sender:sender_id(full_name)
      `)
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('[GET /api/bookings/:id/chat] Fetch failed', { requestId, error });
      return NextResponse.json(
        { ok: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch messages', requestId } },
        { status: 500 }
      );
    }

    // Get unread count for this user
    const { count: unreadCount } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('booking_id', bookingId)
      .neq('sender_id', user.id)
      .is('read_at', null);

    // Transform messages
    const transformedMessages = messages?.map((msg) => {
      const sender = msg.sender as { full_name?: string } | { full_name?: string }[] | null;
      const senderName = Array.isArray(sender) 
        ? sender[0]?.full_name 
        : sender?.full_name || 'Unknown';
      return {
        id: msg.id,
        body: msg.body,
        senderId: msg.sender_id,
        senderName,
        isMe: msg.sender_id === user.id,
        readAt: msg.read_at,
        createdAt: msg.created_at,
      };
    }).reverse() || [];

    return NextResponse.json({
      ok: true,
      data: {
        messages: transformedMessages,
        unreadCount: unreadCount || 0,
      },
    });

  } catch (error) {
    console.error('[GET /api/bookings/:id/chat] Unexpected error', { requestId, error });
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

export const POST = createApiRoute(async (request, requestId) => {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: auth.message, requestId } },
        { status: auth.status }
      );
    }
    const { user, supabase } = auth;

    // Get booking ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const bookingId = pathParts[pathParts.indexOf('bookings') + 1];

    if (!bookingId) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_ID', message: 'Booking ID is required', requestId } },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const parseResult = sendMessageSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { 
          ok: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid message data',
            details: parseResult.error.flatten(),
            requestId 
          } 
        },
        { status: 400 }
      );
    }

    // Verify user is a participant in this booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, setting_id, primary_staff_id, secondary_staff_id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { ok: false, error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found', requestId } },
        { status: 404 }
      );
    }

    const isParticipant = 
      booking.setting_id === user.id ||
      booking.primary_staff_id === user.id ||
      booking.secondary_staff_id === user.id;

    if (!isParticipant) {
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'You are not a participant in this booking', requestId } },
        { status: 403 }
      );
    }

    // Insert message
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        booking_id: bookingId,
        sender_id: user.id,
        body: parseResult.data.body,
      })
      .select(`
        id,
        body,
        sender_id,
        read_at,
        created_at,
        sender:sender_id(full_name)
      `)
      .single();

    if (error) {
      console.error('[POST /api/bookings/:id/chat] Insert failed', { requestId, error });
      return NextResponse.json(
        { ok: false, error: { code: 'INSERT_FAILED', message: 'Failed to send message', requestId } },
        { status: 500 }
      );
    }

    // Get sender name
    const { data: sender } = await supabase
      .from('staff_profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    const { data: setting } = await supabase
      .from('setting_profiles')
      .select('setting_name')
      .eq('id', user.id)
      .maybeSingle();

    const senderName = (sender as {full_name?: string} | null)?.full_name || 
                       (setting as {setting_name?: string} | null)?.setting_name || 
                       'Unknown';

    return NextResponse.json({
      ok: true,
      data: {
        message: {
          id: message.id,
          body: message.body,
          senderId: message.sender_id,
          senderName,
          isMe: true,
          readAt: message.read_at,
          createdAt: message.created_at,
        },
      },
    });

  } catch (error) {
    console.error('[POST /api/bookings/:id/chat] Unexpected error', { requestId, error });
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
