import { NextResponse } from 'next/server';
import { createAdminClient } from '@/app/lib/supabase-server';
import { requireAdmin } from '@/app/lib/admin';

export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    await requireAdmin();

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('get_postcode_density');

    if (error) {
      console.error('[GET /api/admin/postcodes]', { requestId, error: error.message });
      return NextResponse.json(
        { ok: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch postcode data', requestId } },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data: data ?? [] });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('Forbidden') || message === 'Unauthorized') {
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Admin access required', requestId } },
        { status: 403 }
      );
    }
    console.error('[GET /api/admin/postcodes]', { requestId, error: message });
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', requestId } },
      { status: 500 }
    );
  }
}
