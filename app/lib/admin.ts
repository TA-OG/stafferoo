/**
 * Admin utilities
 * 
 * Functions for checking admin permissions based on email or user metadata
 */

import { createClient } from './supabase-server';

/**
 * Check if a user is an admin by email
 * Uses ADMIN_EMAILS environment variable (comma-separated list)
 */
export async function isAdminByEmail(email: string): Promise<boolean> {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * Check if the current authenticated user is an admin
 * Checks both email and user metadata role
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return false;
  }

  // Check email against ADMIN_EMAILS
  if (user.email && await isAdminByEmail(user.email)) {
    return true;
  }

  // Check user metadata role
  const role = user.user_metadata?.role;
  return role === 'admin';
}

/**
 * Get the current user or throw error
 */
export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Require admin access or throw error
 */
export async function requireAdmin() {
  const user = await requireAuth();
  const isAdmin = await isCurrentUserAdmin();
  
  if (!isAdmin) {
    throw new Error('Forbidden: Admin access required');
  }
  
  return user;
}
