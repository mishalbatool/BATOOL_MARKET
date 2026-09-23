import { Product, CartItem, CustomerDetails } from '../types';

const PRODUCTS_KEY = 'batool_market_products_v2';
const OLD_PRODUCTS_KEY = 'batool_market_products_v1';
const CART_KEY = 'batool_market_cart_v1';
const CUSTOMER_KEY = 'batool_market_customer_v1';

// Admin credentials
export const ADMIN_PASSWORD_DEFAULT = "batool2026";

// Placeholder for fallback or missing image
export const IMAGE_UNAVAILABLE_FALLBACK = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80";

// Clean up old sample products from previous version key if present
try {
  if (localStorage.getItem(OLD_PRODUCTS_KEY)) {
    localStorage.removeItem(OLD_PRODUCTS_KEY);
  }
} catch (e) {
  // ignore
}

/**
 * Loads products from localStorage.
 * Initially returns an empty array [] if no imported products exist yet.
 * Never recreates sample products!
 */
export function loadProductsFromStorage(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error("Failed to load products from storage:", error);
    return [];
  }
}

/**
 * Saves products to localStorage
 */
export function saveProductsToStorage(products: Product[]): void {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (error) {
    console.error("Failed to save products to localStorage:", error);
  }
}

/**
 * Completely clears all products from storage
 */
export function clearAllProductsStorage(): void {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify([]));
  } catch (e) {
    console.error(e);
  }
}

/**
 * Cart operations
 */
export function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCartToStorage(cart: CartItem[]): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error(e);
  }
}

/**
 * Customer details operations
 */
export function loadCustomerFromStorage(): CustomerDetails {
  try {
    const raw = localStorage.getItem(CUSTOMER_KEY);
    if (!raw) {
      return { name: '', phone: '', city: '', address: '', notes: '' };
    }
    return JSON.parse(raw);
  } catch {
    return { name: '', phone: '', city: '', address: '', notes: '' };
  }
}

export function saveCustomerToStorage(customer: CustomerDetails): void {
  try {
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  } catch (e) {
    console.error(e);
  }
}
