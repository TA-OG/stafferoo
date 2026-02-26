'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/app/lib/supabase';

interface MFAStatus {
  enrolled: boolean;
  totp: {
    id: string;
    friendlyName: string;
    status: string;
    createdAt: string;
  } | null;
}

export default function AdminMFASetup() {
  const [status, setStatus] = useState<MFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingUp, setSettingUp] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch('/api/admin/mfa/status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const json = await res.json();
      if (json.ok) {
        setStatus(json.data);
      }
    } catch (err) {
      console.error('Failed to check MFA status:', err);
    } finally {
      setLoading(false);
    }
  }

  async function startSetup() {
    try {
      setSettingUp(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Not authenticated');
        return;
      }

      const res = await fetch('/api/admin/mfa/setup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const json = await res.json();

      if (!json.ok) {
        setError(json.error?.message || 'Failed to setup MFA');
        return;
      }

      if (json.data.alreadyEnrolled) {
        setSuccess('MFA is already enrolled');
        await checkStatus();
        return;
      }

      setQrCode(json.data.qrCode);
      setFactorId(json.data.factorId);
      setSecret(json.data.secret);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setSettingUp(false);
    }
  }

  async function verifyAndEnable() {
    if (!factorId || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Not authenticated');
        return;
      }

      const res = await fetch('/api/admin/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          factorId,
          code: verificationCode,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        setError(json.error?.message || 'Invalid code');
        return;
      }

      setSuccess('MFA enabled successfully!');
      setQrCode(null);
      setFactorId(null);
      setSecret(null);
      setVerificationCode('');
      await checkStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (status?.enrolled) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-green-900">MFA Enabled</h3>
            <p className="text-sm text-green-700">
              Your account is protected with {status.totp?.friendlyName || 'TOTP'}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (qrCode) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Set up Two-Factor Authentication</h3>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            1. Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </p>
          <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block">
            <Image
              src={qrCode}
              alt="MFA QR Code"
              width={200}
              height={200}
              className="mx-auto"
            />
          </div>
        </div>

        {secret && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Can&apos;t scan? Enter this code manually:</p>
            <code className="text-sm font-mono text-gray-700 break-all">{secret}</code>
          </div>
        )}

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">
            2. Enter the 6-digit code from your app:
          </p>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full max-w-xs rounded-lg border border-gray-300 px-4 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[#b49cdc]"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={verifyAndEnable}
            disabled={loading || verificationCode.length !== 6}
            className="bg-[#bf5d9f] text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Enable MFA'}
          </button>
          <button
            onClick={() => {
              setQrCode(null);
              setFactorId(null);
              setSecret(null);
              setError(null);
            }}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900">Two-Factor Authentication Required</h3>
          <p className="text-sm text-amber-700 mt-1">
            Protect your admin account by enabling two-factor authentication. 
            This adds an extra layer of security to your login.
          </p>
          
          {success && (
            <div className="mt-3 bg-green-100 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}
          
          {error && (
            <div className="mt-3 bg-red-100 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={startSetup}
            disabled={settingUp}
            className="mt-4 bg-[#bf5d9f] text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {settingUp ? 'Setting up...' : 'Set up MFA'}
          </button>
        </div>
      </div>
    </div>
  );
}
