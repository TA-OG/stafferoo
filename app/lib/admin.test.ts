import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isAdminByEmail } from './admin';

describe('Admin allowlist logic', () => {
  const originalEnv = process.env.ADMIN_EMAIL_ALLOWLIST;

  beforeEach(() => {
    process.env.ADMIN_EMAIL_ALLOWLIST = 'admin@stafferoo.app,test@example.com';
  });

  afterEach(() => {
    process.env.ADMIN_EMAIL_ALLOWLIST = originalEnv;
  });

  it('should return true for email in allowlist', async () => {
    const result = await isAdminByEmail('admin@stafferoo.app');
    expect(result).toBe(true);
  });

  it('should return true for second email in allowlist', async () => {
    const result = await isAdminByEmail('test@example.com');
    expect(result).toBe(true);
  });

  it('should return false for email not in allowlist', async () => {
    const result = await isAdminByEmail('hacker@evil.com');
    expect(result).toBe(false);
  });

  it('should handle empty allowlist', async () => {
    process.env.ADMIN_EMAIL_ALLOWLIST = '';
    const result = await isAdminByEmail('admin@stafferoo.app');
    expect(result).toBe(false);
  });

  it('should handle missing allowlist env var', async () => {
    delete process.env.ADMIN_EMAIL_ALLOWLIST;
    delete process.env.ADMIN_EMAILS;
    const result = await isAdminByEmail('admin@stafferoo.app');
    expect(result).toBe(false);
  });

  it('should trim whitespace in allowlist', async () => {
    process.env.ADMIN_EMAIL_ALLOWLIST = ' admin@stafferoo.app , test@example.com ';
    const result = await isAdminByEmail('admin@stafferoo.app');
    expect(result).toBe(true);
  });

  it('should be case sensitive', async () => {
    const result = await isAdminByEmail('ADMIN@STAFFEROO.APP');
    expect(result).toBe(false);
  });
});
