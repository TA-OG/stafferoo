/**
 * Magic link authentication - ultimate low friction
 * PLACEHOLDER: Requires Resend email template setup
 * 
 * Future implementation will send passwordless login links
 * For now, users use standard email/password auth
 */

import { NextResponse } from 'next/server';
import { createApiRoute, rateLimits } from '@/app/lib/api-wrapper';

export const POST = createApiRoute(async (_request, requestId) => {
  // Placeholder - magic links require email template setup
  // TODO: Implement with Resend template + Supabase auth
  
  return NextResponse.json({
    ok: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Magic links coming soon. Please use email/password for now.',
      requestId,
    },
  }, { status: 501 });
}, { rateLimit: rateLimits.auth });
