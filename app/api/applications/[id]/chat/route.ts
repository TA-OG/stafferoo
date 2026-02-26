/**
 * GET  /api/applications/:id/chat
 * POST /api/applications/:id/chat
 *
 * Application-stage chat tied to a booking_response (before a booking exists).
 * Chat is live from the moment the application is created and closes 6 hours
 * after the job's end_time. After that point the history is read-only.
 *
 * Participants: the applicant staff member + the setting that posted the job.
 * Contact-detail filtering is feature-flagged via FEATURE_CHAT_CONTACT_FILTER.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthFromRequest } from '@/app/lib/auth';
import { createApiRoute, rateLimits } from '@/app/lib/api-wrapper';
import { features } from '@/app/lib/features';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Chat stays open until 6 hours after the shift's end_time. */
const CHAT_EXPIRY_MS = 6 * 60 * 60 * 1000;

/** Patterns that indicate a message contains contact details. */
const CONTACT_PATTERNS: RegExp[] = [
  /(\+44|0)[0-9\s\-]{9,}/,   // UK phone numbers
  /\S+@\S+\.\S+/,             // email addresses
  /@[a-z0-9_.]{2,}/i,         // social / messaging handles
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sendMessageSchema = z.object({
  body: z.string().min(1).max(2000),
});

function isChatOpen(endTime: string): boolean {
  return Date.now() < new Date(endTime).getTime() + CHAT_EXPIRY_MS;
}

function chatExpiresAt(endTime: string): string {
  return new Date(new Date(endTime).getTime() + CHAT_EXPIRY_MS).toISOString();
}

function containsContactDetails(text: string): boolean {
  return CONTACT_PATTERNS.some((p) => p.test(text));
}

/** Extract the dynamic [id] segment from the URL path. */
function getApplicationId(request: NextRequest): string | null {
  const parts = new URL(request.url).pathname.split('/');
  const idx = parts.indexOf('applications');
  return idx !== -1 ? parts[idx + 1] : null;
}

type JobRequestShape = { setting_id: string; end_time: string };

/** Supabase types nested FK joins as arrays; unwrap to a single item. */
function unwrapJobRequest(raw: unknown): JobRequestShape | null {
  if (!raw) return null;
  const item = Array.isArray(raw) ? raw[0] : raw;
  if (!item || typeof item !== 'object') return null;
  const j = item as Record<string, unknown>;
  if (typeof j.setting_id !== 'string' || typeof j.end_time !== 'string') return null;
  return { setting_id: j.setting_id, end_time: j.end_time };
}

// ---------------------------------------------------------------------------
// GET — fetch messages
// ---------------------------------------------------------------------------

export const GET = createApiRoute(async (request: NextRequest, requestId: string) => {
  const auth = getAuthFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: auth.message, requestId } },
      { status: auth.status },
    );
  }
  const { user, supabase } = auth;

  const applicationId = getApplicationId(request);
  if (!applicationId) {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_ID', message: 'Application ID is required', requestId } },
      { status: 400 },
    );
  }

  // Load application with nested job details. RLS already restricts to participants.
  const { data: application, error: appError } = await supabase
    .from('booking_responses')
    .select(`
      id,
      staff_id,
      job_request:job_request_id(
        setting_id,
        end_time
      )
    `)
    .eq('id', applicationId)
    .single();

  if (appError || !application) {
    return NextResponse.json(
      { ok: false, error: { code: 'NOT_FOUND', message: 'Application not found', requestId } },
      { status: 404 },
    );
  }

  const jobRequest = unwrapJobRequest(application.job_request);
  if (!jobRequest) {
    return NextResponse.json(
      { ok: false, error: { code: 'NOT_FOUND', message: 'Job details not found', requestId } },
      { status: 404 },
    );
  }

  // Explicit participant guard (belt-and-braces on top of RLS)
  const isParticipant =
    application.staff_id === user.id || jobRequest.setting_id === user.id;
  if (!isParticipant) {
    return NextResponse.json(
      { ok: false, error: { code: 'FORBIDDEN', message: 'You are not a participant in this application', requestId } },
      { status: 403 },
    );
  }

  // Fetch messages (oldest first — most natural reading order)
  const { data: messages, error: msgError } = await supabase
    .from('chat_messages')
    .select('id, body, sender_id, read_at, created_at')
    .eq('booking_response_id', applicationId)
    .order('created_at', { ascending: true });

  if (msgError) {
    console.error('[GET /api/applications/:id/chat] fetch failed', { requestId, msgError });
    return NextResponse.json(
      { ok: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch messages', requestId } },
      { status: 500 },
    );
  }

  // Resolve display names for both participants
  const [{ data: staffRow }, { data: settingRow }] = await Promise.all([
    supabase
      .from('staff_profiles')
      .select('id, full_name')
      .eq('id', application.staff_id)
      .maybeSingle(),
    supabase
      .from('setting_profiles')
      .select('id, setting_name')
      .eq('id', jobRequest.setting_id)
      .maybeSingle(),
  ]);

  const nameMap: Record<string, string> = {};
  const sr = staffRow as { id: string; full_name?: string } | null;
  const str = settingRow as { id: string; setting_name?: string } | null;
  if (sr) nameMap[application.staff_id] = sr.full_name ?? 'Staff Member';
  if (str) nameMap[jobRequest.setting_id] = str.setting_name ?? 'Nursery';

  const open = isChatOpen(jobRequest.end_time);
  const expiresAt = chatExpiresAt(jobRequest.end_time);

  const transformedMessages = (messages ?? []).map((msg) => ({
    id: msg.id,
    body: msg.body,
    senderId: msg.sender_id,
    senderName: nameMap[msg.sender_id] ?? 'Unknown',
    isMe: msg.sender_id === user.id,
    readAt: msg.read_at,
    createdAt: msg.created_at,
  }));

  return NextResponse.json({
    ok: true,
    data: {
      messages: transformedMessages,
      chatOpen: open,
      expiresAt,
    },
  });
}, { rateLimit: rateLimits.apiRead });

// ---------------------------------------------------------------------------
// POST — send a message
// ---------------------------------------------------------------------------

export const POST = createApiRoute(async (request: NextRequest, requestId: string) => {
  const auth = getAuthFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: auth.message, requestId } },
      { status: auth.status },
    );
  }
  const { user, supabase } = auth;

  const applicationId = getApplicationId(request);
  if (!applicationId) {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_ID', message: 'Application ID is required', requestId } },
      { status: 400 },
    );
  }

  // Parse body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body', requestId } },
      { status: 400 },
    );
  }

  const parsed = sendMessageSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid message data',
          details: parsed.error.flatten(),
          requestId,
        },
      },
      { status: 400 },
    );
  }

  const { body } = parsed.data;

  // Load application with job details
  const { data: application, error: appError } = await supabase
    .from('booking_responses')
    .select(`
      id,
      staff_id,
      job_request:job_request_id(
        setting_id,
        end_time
      )
    `)
    .eq('id', applicationId)
    .single();

  if (appError || !application) {
    return NextResponse.json(
      { ok: false, error: { code: 'NOT_FOUND', message: 'Application not found', requestId } },
      { status: 404 },
    );
  }

  const jobRequest = unwrapJobRequest(application.job_request);
  if (!jobRequest) {
    return NextResponse.json(
      { ok: false, error: { code: 'NOT_FOUND', message: 'Job details not found', requestId } },
      { status: 404 },
    );
  }

  const isParticipant =
    application.staff_id === user.id || jobRequest.setting_id === user.id;
  if (!isParticipant) {
    return NextResponse.json(
      { ok: false, error: { code: 'FORBIDDEN', message: 'You are not a participant in this application', requestId } },
      { status: 403 },
    );
  }

  // Expiry check — chat closes 6 hours after the shift ends
  if (!isChatOpen(jobRequest.end_time)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'CHAT_EXPIRED',
          message: 'This chat has closed. Messages can only be sent up to 6 hours after the shift ends.',
          requestId,
        },
      },
      { status: 403 },
    );
  }

  // Contact-detail filter (feature-flagged)
  if (features.chatContactFilter && containsContactDetails(body)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'CONTACT_DETAILS_PROHIBITED',
          message:
            'Messages containing contact details are not permitted. Sharing contact information outside the platform is a violation of our Terms and Conditions and may result in account removal.',
          requestId,
        },
      },
      { status: 422 },
    );
  }

  // Insert message
  const { data: message, error: insertError } = await supabase
    .from('chat_messages')
    .insert({
      booking_response_id: applicationId,
      sender_id: user.id,
      body,
    })
    .select('id, body, sender_id, read_at, created_at')
    .single();

  if (insertError || !message) {
    console.error('[POST /api/applications/:id/chat] insert failed', { requestId, insertError });
    return NextResponse.json(
      { ok: false, error: { code: 'INSERT_FAILED', message: 'Failed to send message', requestId } },
      { status: 500 },
    );
  }

  // Resolve sender display name
  const [{ data: staffRow }, { data: settingRow }] = await Promise.all([
    supabase.from('staff_profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.from('setting_profiles').select('setting_name').eq('id', user.id).maybeSingle(),
  ]);

  const sr = staffRow as { full_name?: string } | null;
  const str = settingRow as { setting_name?: string } | null;
  const senderName = sr?.full_name ?? str?.setting_name ?? 'Unknown';

  console.log('[POST /api/applications/:id/chat] message sent', {
    requestId,
    applicationId,
    senderId: user.id,
  });

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
}, { rateLimit: rateLimits.apiMutation });
