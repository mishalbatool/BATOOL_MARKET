import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const ADMIN_EMAIL = "mishalbatool572@gmail.com";
export const ADMIN_UID = "b8ac65e0-d3b9-43c8-b6ee-49a425a61fa7";

const LEGACY_SESSION_KEY = 'bm_admin_session_auth';

// Track active Supabase Auth admin status in memory for synchronous checks
let currentAdminStatus = false;

type AuthListener = (isAdmin: boolean) => void;
const listeners = new Set<AuthListener>();

function notifyAuthListeners(isAdmin: boolean) {
  currentAdminStatus = isAdmin;
  listeners.forEach((fn) => fn(isAdmin));
}

function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export function isAuthorizedAdminUser(user?: { id?: string | null; email?: string | null; role?: string | null } | null): boolean {
  if (!user || !user.id) return false;
  const uidMatches = user.id === ADMIN_UID;
  const emailMatches = isAuthorizedAdminEmail(user.email);
  return uidMatches && emailMatches;
}

// Clear any legacy fake localStorage flag on initialization and sync with real Supabase session
if (typeof window !== 'undefined') {
  try {
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    // ignore storage errors
  }

  if (isSupabaseConfigured) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const isAdmin = Boolean(session?.user && isAuthorizedAdminUser(session.user));
      notifyAuthListeners(isAdmin);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      const isAdmin = Boolean(session?.user && isAuthorizedAdminUser(session.user));
      notifyAuthListeners(isAdmin);
    });
  }
}

/**
 * Sign in Admin using real Supabase Authentication (`supabase.auth.signInWithPassword`).
 * Ensures the Admin has an active, authenticated Supabase JWT session for RLS-protected operations.
 */
export async function loginAdmin(
  password: string,
  email: string = ADMIN_EMAIL
): Promise<{ success: boolean; error?: string; providerNeeded?: boolean }> {
  try {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, error: "Please enter your admin email and password." };
    }

    if (!isAuthorizedAdminEmail(cleanEmail)) {
      return {
        success: false,
        error: `Unauthorized email. Only the store owner (${ADMIN_EMAIL}) is permitted to access Admin.`,
      };
    }

    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: "Supabase is not configured. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      };
    }

    // 1. Sign in with Supabase Authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (!error && data?.session && data?.user) {
      if (!isAuthorizedAdminUser(data.user)) {
        await supabase.auth.signOut();
        notifyAuthListeners(false);
        return {
          success: false,
          error: `Unauthorized Supabase user identity (${data.user.id}). Only the authorized Admin (UID: ${ADMIN_UID}) can access Product Management.`,
        };
      }
      notifyAuthListeners(true);
      return { success: true };
    }

    if (error) {
      const errCode = (error as any).code || '';
      const errMsg = error.message || '';

      // Handle unconfirmed email in Supabase Auth
      if (errCode === 'email_not_confirmed' || errMsg.toLowerCase().includes('email not confirmed')) {
        return {
          success: false,
          error:
            `Your Supabase admin account (${cleanEmail}) is created, but email confirmation is pending. ` +
            `Please open Supabase Dashboard → Authentication → Users, click "${cleanEmail}", and click "Confirm User" (or click the confirmation link sent to your email), then click Access Product Management again.`,
        };
      }

      // If user does not exist yet in Supabase Auth, attempt one-time signUp for the store owner
      if (errCode === 'invalid_credentials' || errMsg.toLowerCase().includes('invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (!signUpError && signUpData?.session && signUpData?.user) {
          notifyAuthListeners(true);
          return { success: true };
        }

        // If identities is empty, the email is already registered in Supabase Auth with a different password
        if (signUpData?.user && Array.isArray(signUpData.user.identities) && signUpData.user.identities.length === 0) {
          return {
            success: false,
            error: `Invalid password for ${cleanEmail} in Supabase Authentication. Please enter the password configured for this user in Supabase Dashboard → Authentication → Users.`,
          };
        }

        if (!signUpError && signUpData?.user && !signUpData.session) {
          return {
            success: false,
            error:
              `Admin account (${cleanEmail}) has been registered in Supabase Authentication. ` +
              `Please confirm the user in Supabase Dashboard → Authentication → Users → Confirm User (or via the confirmation email), then log in again.`,
          };
        }

        return {
          success: false,
          error: signUpError?.message || errMsg || "Supabase authentication failed.",
        };
      }

      return {
        success: false,
        error: errMsg || "Supabase authentication failed.",
      };
    }

    return { success: false, error: "Authentication failed: No active Supabase session returned." };
  } catch (err: any) {
    console.error("Admin login error:", err);
    return { success: false, error: err?.message || "Failed to authenticate with Supabase." };
  }
}

/**
 * Sign out Admin from Supabase Authentication
 */
export async function logoutAdmin(): Promise<void> {
  try {
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
    await supabase.auth.signOut();
    notifyAuthListeners(false);
  } catch (e) {
    console.error("Logout error:", e);
    notifyAuthListeners(false);
  }
}

/**
 * Synchronous check of current admin state
 */
export function isCurrentlyAdmin(): boolean {
  return currentAdminStatus;
}

/**
 * Verify that an active authenticated Supabase Admin session exists before INSERT/UPDATE/DELETE
 * Validates the authenticated user's Supabase Auth UID (ADMIN_UID) and email.
 */
export async function requireAdminSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(`Supabase Auth session error: ${error.message}`);
  }
  if (!session || !session.user) {
    notifyAuthListeners(false);
    throw new Error(
      `Authentication required: You do not have an active Supabase Admin session. Please log in with ${ADMIN_EMAIL} first.`
    );
  }
  if (!isAuthorizedAdminUser(session.user)) {
    throw new Error(
      `Unauthorized user identity (${session.user.email} / UID: ${session.user.id}). Only the authorized Admin (${ADMIN_EMAIL} / UID: ${ADMIN_UID}) can add, edit, or delete products.`
    );
  }
  return session;
}

/**
 * Subscribe to real-time Supabase Auth state changes for the Admin user
 */
export function subscribeToAdminAuth(callback: AuthListener): () => void {
  listeners.add(callback);
  callback(currentAdminStatus);

  if (isSupabaseConfigured) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const isAdmin = Boolean(session?.user && isAuthorizedAdminUser(session.user));
      notifyAuthListeners(isAdmin);
    });
  }

  return () => {
    listeners.delete(callback);
  };
}
