import { createClient } from './supabase-server';

function getAdminEmailAllowlist(): string[] {
  const allowlist = process.env.ADMIN_EMAIL_ALLOWLIST || process.env.ADMIN_EMAILS || '';
  return allowlist.split(',').map(e => e.trim()).filter(Boolean);
}

export async function isAdminByEmail(email: string): Promise<boolean> {
  const adminEmails = getAdminEmailAllowlist();
  return adminEmails.includes(email);
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return false;
  }

  if (user.email && await isAdminByEmail(user.email)) {
    return true;
  }

  const role = user.user_metadata?.role;
  return role === 'admin';
}

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  const isAdmin = await isCurrentUserAdmin();
  
  if (!isAdmin) {
    throw new Error('Forbidden: Admin access required');
  }
  
  return user;
}
