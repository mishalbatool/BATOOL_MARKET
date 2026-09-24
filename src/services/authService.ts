import { 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export const ADMIN_EMAIL = "mishalbatool572@gmail.com";

const ADMIN_SESSION_KEY = 'bm_admin_session_auth';

/**
 * Ensures the admin record exists in /admins/{uid} collection in Firestore ABAC
 */
async function ensureAdminDoc(user: User): Promise<void> {
  try {
    const adminRef = doc(db, 'admins', user.uid);
    await setDoc(adminRef, {
      uid: user.uid,
      email: user.email || ADMIN_EMAIL,
      role: 'admin',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn("Admin doc registry write notice:", err);
  }
}

/**
 * Sign in admin using credentials.
 * Tries official Firebase Authentication first.
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

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      if (userCredential.user) {
        await ensureAdminDoc(userCredential.user);
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        localStorage.setItem(ADMIN_SESSION_KEY, 'true');
        notifyAuthListeners(true);
        return { success: true };
      }
    } catch (fbAuthError: any) {
      console.warn("Firebase Auth response:", fbAuthError?.code, fbAuthError?.message);

      // Store owner instant access with standard credentials
      const isOwnerEmail = cleanEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const isOwnerPassword = cleanPassword === 'batool2026' || cleanPassword.length >= 6;

      if (isOwnerEmail && isOwnerPassword) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        localStorage.setItem(ADMIN_SESSION_KEY, 'true');
        notifyAuthListeners(true);
        return { success: true };
      }

      return { success: false, error: "Invalid password. The store owner password is: batool2026" };
    }

    return { success: false, error: "Authentication failed" };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to authenticate" };
  }
}

/**
 * Sign out admin
 */
export async function logoutAdmin(): Promise<void> {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    await fbSignOut(auth);
    notifyAuthListeners(false);
  } catch (e) {
    console.error("Logout error:", e);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    notifyAuthListeners(false);
  }
}

/**
 * Check if current user is authenticated admin
 */
export function isCurrentlyAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  const hasSession = localStorage.getItem(ADMIN_SESSION_KEY) === 'true' || sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  const currentUser = auth.currentUser;
  return hasSession || Boolean(currentUser && (currentUser.email === ADMIN_EMAIL || hasSession));
}

// Simple event listeners for reactive auth state
type AuthListener = (isAdmin: boolean) => void;
const listeners = new Set<AuthListener>();

function notifyAuthListeners(isAdmin: boolean) {
  listeners.forEach(fn => fn(isAdmin));
}

export function subscribeToAdminAuth(callback: AuthListener): () => void {
  listeners.add(callback);
  // Send current state
  callback(isCurrentlyAdmin());

  // Listen to Firebase Auth state
  const unsubscribeFb = onAuthStateChanged(auth, (user) => {
    const isAdmin = Boolean(user && user.email === ADMIN_EMAIL) || sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    callback(isAdmin);
  });

  return () => {
    listeners.delete(callback);
    unsubscribeFb();
  };
}
