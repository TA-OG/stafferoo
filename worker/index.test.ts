/**
 * Unit tests for worker handlers and claim logic.
 * All external dependencies (Supabase, Resend) are mocked — no real network calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleReferenceRequestEmail } from './handlers/reference-request-email';
import { claimNextJob } from './lib/claim-job';
import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Mock the email module
// ---------------------------------------------------------------------------

vi.mock('@/app/lib/email', () => ({
  sendEmail: vi.fn(),
  refereeInvitationHtml: vi.fn(() => '<html>mock</html>'),
}));

import { sendEmail } from '@/app/lib/email';
const mockSendEmail = vi.mocked(sendEmail);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validPayload = {
  referenceRequestId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  applicantName:      'Jane Smith',
  refereeFirstName:   'Bob',
  refereeName:        'Bob Jones',
  refereeEmail:       'bob@example.com',
  referenceLink:      'https://stafferoo.app/r/reference/abc123',
  expiresAt:          '2026-03-01T00:00:00.000Z',
};

// A minimal fake SupabaseClient (handlers that don't use DB need no mock methods)
const mockDb = {} as unknown as SupabaseClient;

// ---------------------------------------------------------------------------
// handleReferenceRequestEmail
// ---------------------------------------------------------------------------

describe('handleReferenceRequestEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves and calls sendEmail with correct args on valid payload', async () => {
    mockSendEmail.mockResolvedValueOnce({ ok: true, id: 'email-abc' });

    await expect(
      handleReferenceRequestEmail(mockDb, validPayload)
    ).resolves.toBeUndefined();

    expect(mockSendEmail).toHaveBeenCalledOnce();
    const callArgs = mockSendEmail.mock.calls[0][0];
    expect(callArgs.to).toBe('bob@example.com');
    expect(callArgs.subject).toContain('Jane Smith');
  });

  it('throws when sendEmail returns ok: false', async () => {
    mockSendEmail.mockResolvedValueOnce({ ok: false, error: 'rate limited' });

    await expect(
      handleReferenceRequestEmail(mockDb, validPayload)
    ).rejects.toThrow('rate limited');
  });

  it('throws on missing refereeEmail', async () => {
    const bad = { ...validPayload, refereeEmail: '' };
    await expect(
      handleReferenceRequestEmail(mockDb, bad)
    ).rejects.toThrow('invalid payload');
  });

  it('throws on invalid refereeEmail format', async () => {
    const bad = { ...validPayload, refereeEmail: 'not-an-email' };
    await expect(
      handleReferenceRequestEmail(mockDb, bad)
    ).rejects.toThrow('invalid payload');
  });

  it('throws on missing referenceLink', async () => {
    const bad = { ...validPayload, referenceLink: '' };
    await expect(
      handleReferenceRequestEmail(mockDb, bad)
    ).rejects.toThrow('invalid payload');
  });

  it('throws on non-URL referenceLink', async () => {
    const bad = { ...validPayload, referenceLink: 'not-a-url' };
    await expect(
      handleReferenceRequestEmail(mockDb, bad)
    ).rejects.toThrow('invalid payload');
  });

  it('throws on non-ISO expiresAt', async () => {
    const bad = { ...validPayload, expiresAt: '01/03/2026' };
    await expect(
      handleReferenceRequestEmail(mockDb, bad)
    ).rejects.toThrow('invalid payload');
  });

  it('throws on missing applicantName', async () => {
    const bad = { ...validPayload, applicantName: '' };
    await expect(
      handleReferenceRequestEmail(mockDb, bad)
    ).rejects.toThrow('invalid payload');
  });

  it('throws on non-uuid referenceRequestId', async () => {
    const bad = { ...validPayload, referenceRequestId: 'not-a-uuid' };
    await expect(
      handleReferenceRequestEmail(mockDb, bad)
    ).rejects.toThrow('invalid payload');
  });
});

// ---------------------------------------------------------------------------
// claimNextJob
// ---------------------------------------------------------------------------

describe('claimNextJob', () => {
  it('returns null when RPC returns null (no pending jobs)', async () => {
    const db = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as unknown as SupabaseClient;

    const result = await claimNextJob(db);
    expect(result).toBeNull();
  });

  it('throws when RPC returns an error', async () => {
    const db = {
      rpc: vi.fn().mockResolvedValue({
        data:  null,
        error: { message: 'connection timeout' },
      }),
    } as unknown as SupabaseClient;

    await expect(claimNextJob(db)).rejects.toThrow('claim_next_job RPC failed');
  });

  it('returns null and logs error on malformed row', async () => {
    const db = {
      rpc: vi.fn().mockResolvedValue({
        data:  { id: 'not-a-uuid', type: 'foo' }, // missing required fields
        error: null,
      }),
    } as unknown as SupabaseClient;

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await claimNextJob(db);
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('malformed'),
      expect.any(Object)
    );
    consoleSpy.mockRestore();
  });

  it('returns a valid JobRow on a well-formed RPC response', async () => {
    const mockRow = {
      id:           'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      type:         'reference_request_email',
      payload:      { refereeEmail: 'x@example.com' },
      status:       'running',
      attempts:     1,
      max_attempts: 3,
      run_at:       '2026-02-21T00:00:00.000Z',
      created_at:   '2026-02-20T00:00:00.000Z',
    };

    const db = {
      rpc: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
    } as unknown as SupabaseClient;

    const result = await claimNextJob(db);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(mockRow.id);
    expect(result?.type).toBe('reference_request_email');
    expect(result?.attempts).toBe(1);
  });
});
