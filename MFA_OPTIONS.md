# MFA/2FA Implementation Options

## Overview
This document outlines Multi-Factor Authentication (MFA) options for the Stafferoo admin dashboard and user accounts.

---

## Option 1: Supabase Auth MFA (Recommended)

**Technology:** Supabase Auth built-in MFA
**Cost:** Free tier included
**Difficulty:** Easy

### Features:
- TOTP (Time-based One-Time Password) via authenticator apps
- SMS/Phone verification
- Recovery codes
- Built into Supabase Auth

### Implementation:
```typescript
// Enable MFA for a user
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'Admin Authenticator'
});

// Verify MFA code during login
const { data, error } = await supabase.auth.mfa.verify({
  factorId: 'uuid',
  code: '123456'
});
```

### Pros:
- ✅ Native Supabase integration
- ✅ No additional cost
- ✅ TOTP + SMS support
- ✅ Recovery codes built-in
- ✅ Easy to implement

### Cons:
- ❌ No hardware key support (WebAuthn)
- ❌ Limited customization

---

## Option 2: WebAuthn (Passkeys)

**Technology:** Web Authentication API (FIDO2)
**Cost:** Free (browser native)
**Difficulty:** Medium

### Features:
- Hardware security keys (YubiKey, etc.)
- Platform authenticators (Touch ID, Windows Hello)
- Passwordless login option
- Phishing-resistant

### Implementation:
```typescript
// Using simple-webauthn library
import { generateRegistrationOptions } from '@simplewebauthn/server';

// Register new credential
const options = await generateRegistrationOptions({
  rpName: 'Stafferoo',
  rpID: 'stafferoo.app',
  userID: user.id,
  userName: user.email,
});

// Verify credential
import { verifyRegistrationResponse } from '@simplewebauthn/server';
```

### Pros:
- ✅ Most secure option
- ✅ Hardware key support
- ✅ Passwordless capable
- ✅ Phishing-proof
- ✅ Modern UX

### Cons:
- ❌ Users need hardware keys or modern devices
- ❌ More complex implementation
- ❌ Requires additional library

---

## Option 3: TOTP with QR Codes

**Technology:** speakeasy / otplib + QR codes
**Cost:** Free
**Difficulty:** Medium

### Features:
- QR code setup for Google Authenticator, Authy, etc.
- TOTP verification
- Backup codes
- Per-user secret storage

### Implementation:
```typescript
// Generate secret
import { authenticator } from 'otplib';

const secret = authenticator.generateSecret();
const otpauth = authenticator.keyuri(user.email, 'Stafferoo', secret);

// Generate QR code
import QRCode from 'qrcode';
const qrCodeUrl = await QRCode.toDataURL(otpauth);

// Verify token
const isValid = authenticator.verify({ token: '123456', secret });
```

### Pros:
- ✅ Works with all authenticator apps
- ✅ No external service needed
- ✅ Full control over UX
- ✅ Free

### Cons:
- ❌ Need to store secrets securely
- ❌ Manual implementation required
- ❌ No SMS fallback

---

## Option 4: Email-based OTP

**Technology:** Email + 6-digit codes
**Cost:** Free (existing email)
**Difficulty:** Easy

### Features:
- 6-digit codes sent via email
- Time-limited (5-15 minutes)
- No additional apps needed

### Implementation:
```typescript
// Send OTP
const otp = Math.floor(100000 + Math.random() * 900000).toString();
await supabase.from('mfa_codes').insert({
  user_id: user.id,
  code: otp,
  expires_at: new Date(Date.now() + 10 * 60000) // 10 min
});

// Send email via Resend
await resend.emails.send({
  to: user.email,
  subject: 'Your Stafferoo verification code',
  text: `Your code is: ${otp}`
});

// Verify
const { data } = await supabase
  .from('mfa_codes')
  .select('*')
  .eq('user_id', user.id)
  .eq('code', inputCode)
  .gt('expires_at', new Date().toISOString())
  .single();
```

### Pros:
- ✅ No extra apps for users
- ✅ Uses existing email infrastructure
- ✅ Simple implementation
- ✅ Everyone has email

### Cons:
- ❌ Less secure (email can be compromised)
- ❌ Email delivery delays
- ❌ Email goes to spam sometimes

---

## Option 5: Third-party MFA (Auth0, Clerk, etc.)

**Technology:** External auth provider
**Cost:** $$$ (per-user pricing)
**Difficulty:** Easy (migration required)

### Options:
- **Auth0** - $23/month + MFA add-on
- **Clerk** - $25/month includes MFA
- **FusionAuth** - Self-hosted option

### Pros:
- ✅ Professional MFA
- ✅ SMS, TOTP, WebAuthn
- ✅ Risk-based authentication
- ✅ Managed service

### Cons:
- ❌ Expensive ($25-100+/month)
- ❌ Vendor lock-in
- ❌ Migration complexity
- ❌ Overkill for current needs

---

## Recommendation

### For Admin Dashboard (Immediate):
**Option 1: Supabase Auth MFA**
- Quick to implement
- Built-in recovery codes
- Free
- Good enough for admin protection

### For All Users (Future):
**Option 1 + Option 4 hybrid**
- Supabase MFA for staff/settings who want it
- Email OTP as fallback
- Upgrade to WebAuthn later if needed

---

## Implementation Priority

### Phase 1: Admin MFA (Week 1)
1. Enable Supabase Auth MFA for admin role
2. Force MFA enrollment on first admin login
3. Store recovery codes securely
4. Add MFA verification to admin login flow

### Phase 2: Optional User MFA (Week 2-3)
1. Add MFA toggle in user settings
2. TOTP enrollment UI
3. Recovery code management
4. Email fallback option

### Phase 3: Advanced Security (Future)
1. WebAuthn/Passkeys
2. Risk-based step-up auth
3. IP-based restrictions
4. Session management improvements

---

## Security Considerations

1. **Recovery Codes**: Always provide backup codes
2. **Rate Limiting**: Limit MFA attempts (5 attempts max)
3. **Device Trust**: Option to "trust this device" for 30 days
4. **Audit Logging**: Log all MFA events
5. **Force MFA**: Require MFA for admin, optional for users

---

## Estimated Implementation Time

| Option | Setup | UI Development | Testing | Total |
|--------|-------|----------------|---------|-------|
| Supabase MFA | 2 hrs | 4 hrs | 2 hrs | **8 hrs** |
| WebAuthn | 4 hrs | 6 hrs | 4 hrs | **14 hrs** |
| TOTP Custom | 4 hrs | 6 hrs | 3 hrs | **13 hrs** |
| Email OTP | 2 hrs | 3 hrs | 2 hrs | **7 hrs** |
| Third-party | 1 hr | 2 hrs | 2 hrs | **5 hrs** + migration |
