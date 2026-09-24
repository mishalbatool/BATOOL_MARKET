import { 
  collection, 
  doc, 
  getDoc,
  getDocFromServer,
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Product, ReviewItem } from '../types';
import { normalizeCategoryName } from '../data/categories';

export const ADMIN_EMAIL_DEFAULT = "mishalbatool572@gmail.com";
export const IMAGE_UNAVAILABLE_FALLBACK = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80";

const BACKUP_KEY = 'batool_market_products_shared_cache';

/**
 * Generate a clean URL slug from product name and id
 */
export function generateProductSlug(name: string, id: string): string {
  const cleanName = (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${cleanName || 'item'}-${(id || '').toLowerCase()}`;
}

/**
 * Parse any raw value (string, number, null) into a safe number
 */
function parseNumeric(val: any, fallback = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

/**
 * Convert any Firestore document format into the exact Product model expected by UI components.
 * Resolves mismatches:
 * - productName vs name vs title
 * - productImage vs images vs image
 * - quantity vs stock vs count
 * - price vs cost vs originalPrice
 * - salePrice vs discountPrice
 * - category normalization
 * - sizes & colors array/string handling
 * - video string handling safely
 */
export function normalizeProductFromFirestore(docId: string, rawData: any): Product {
  const data = rawData || {};

  // 1. Unique ID: document ID or data.id or data.productId
  const id = String(data.id || data.productId || data._id || docId || '').trim();

  // 2. Product Name: handle name, productName, title, product_name
  const name = String(
    data.name || 
    data.productName || 
    data.title || 
    data.product_name || 
    (id ? `Item ${id}` : 'Batool Market Product')
  ).trim();

  // 3. Category: strictly normalized to one of the 31 exact categories
  const rawCat = data.category || data.categoryName || data.category_name || data.department;
  const category = normalizeCategoryName(rawCat);

  // 4. Description
  const description = String(
    data.description || 
    data.desc || 
    data.details || 
    data.shortDescription || 
    `${name} - premium quality from Batool Market.`
  ).trim();

  const shortDescription = typeof data.shortDescription === 'string' && data.shortDescription.trim()
    ? data.shortDescription.trim()
    : (description.length > 90 ? `${description.slice(0, 87)}...` : description);

  // 5. Images: gather from images, productImage, image, imageUrl, photo
  let gatheredImages: string[] = [];
  if (Array.isArray(data.images)) {
    data.images.forEach((img: any) => {
      if (typeof img === 'string' && img.trim()) gatheredImages.push(img.trim());
    });
  }
  if (Array.isArray(data.productImage)) {
    data.productImage.forEach((img: any) => {
      if (typeof img === 'string' && img.trim()) gatheredImages.push(img.trim());
    });
  }
  if (typeof data.image === 'string' && data.image.trim()) {
    gatheredImages.push(data.image.trim());
  }
  if (typeof data.productImage === 'string' && data.productImage.trim()) {
    gatheredImages.push(data.productImage.trim());
  }
  if (typeof data.imageUrl === 'string' && data.imageUrl.trim()) {
    gatheredImages.push(data.imageUrl.trim());
  }
  if (typeof data.photo === 'string' && data.photo.trim()) {
    gatheredImages.push(data.photo.trim());
  }
  gatheredImages = Array.from(new Set(gatheredImages));
  if (gatheredImages.length === 0) {
    gatheredImages = [IMAGE_UNAVAILABLE_FALLBACK];
  }
  const primaryImage = gatheredImages[0];

  // 6. Video (optional, safe undefined if absent or empty)
  const rawVideo = data.video || data.videoUrl || data.productVideo || data.video_url;
  const video = typeof rawVideo === 'string' && rawVideo.trim().length > 0 ? rawVideo.trim() : undefined;

  // 7. Pricing
  const parsedPrice = parseNumeric(data.price ?? data.originalPrice ?? data.cost, 0);
  const parsedSalePrice = parseNumeric(
    data.salePrice ?? data.discountPrice ?? data.discountedPrice ?? data.finalPrice, 
    parsedPrice
  );
  const price = parsedPrice > 0 ? parsedPrice : (parsedSalePrice > 0 ? parsedSalePrice : 1500);
  const salePrice = parsedSalePrice > 0 ? parsedSalePrice : price;
  const discountPercent = typeof data.discountPercent === 'number' && !isNaN(data.discountPercent)
    ? data.discountPercent
    : (price > salePrice ? Math.round(((price - salePrice) / price) * 100) : 0);

  // 8. Stock / Quantity
  const stock = parseNumeric(data.stock ?? data.quantity ?? data.qty ?? data.count ?? data.inventory, 10);
  const status: 'in_stock' | 'low_stock' | 'out_of_stock' =
    data.status === 'out_of_stock' || stock <= 0
      ? 'out_of_stock'
      : data.status === 'low_stock' || stock <= 5
        ? 'low_stock'
        : 'in_stock';

  // 9. Sizes
  let sizes: string[] | undefined;
  if (Array.isArray(data.sizes)) {
    sizes = data.sizes.map((s: any) => String(s).trim()).filter(Boolean);
  } else if (typeof data.sizes === 'string' && data.sizes.trim()) {
    sizes = data.sizes.split(',').map((s: string) => s.trim()).filter(Boolean);
  } else if (typeof data.size === 'string' && data.size.trim()) {
    sizes = data.size.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  if (sizes && sizes.length === 0) sizes = undefined;

  // 10. Colors
  let colors: string[] | undefined;
  if (Array.isArray(data.colors)) {
    colors = data.colors.map((c: any) => String(c).trim()).filter(Boolean);
  } else if (typeof data.colors === 'string' && data.colors.trim()) {
    colors = data.colors.split(',').map((c: string) => c.trim()).filter(Boolean);
  } else if (typeof data.color === 'string' && data.color.trim()) {
    colors = data.color.split(',').map((c: string) => c.trim()).filter(Boolean);
  }
  if (colors && colors.length === 0) colors = undefined;

  // 11. Rating & Reviews
  const rating = Math.min(5, Math.max(1, parseNumeric(data.rating, 5.0)));
  let reviews: ReviewItem[] | undefined;
  if (Array.isArray(data.reviews)) {
    reviews = data.reviews.map((r: any, idx: number) => ({
      id: r.id || `rev_${id}_${idx}`,
      author: String(r.author || r.name || 'Verified Buyer').trim(),
      rating: Math.min(5, Math.max(1, parseNumeric(r.rating, 5))),
      comment: String(r.comment || r.text || '').trim(),
      date: String(r.date || new Date().toISOString().split('T')[0]),
    }));
  }
  const reviewsCount = parseNumeric(data.reviewsCount ?? data.reviewCount ?? reviews?.length, reviews?.length || 1);

  // 12. Featured & New Arrival flags
  const featured = Boolean(data.featured);
  const newArrival = data.newArrival !== undefined ? Boolean(data.newArrival) : true;

  // 13. SKU, Slug & Timestamps
  const sku = data.sku ? String(data.sku).trim() : undefined;
  const slug = data.slug || generateProductSlug(name, id);
  const createdAt = data.createdAt ? String(data.createdAt) : new Date().toISOString();
  const updatedAt = data.updatedAt ? String(data.updatedAt) : new Date().toISOString();

  return {
    id,
    name,
    category,
    description,
    shortDescription,
    image: primaryImage,
    images: gatheredImages,
    video,
    price,
    salePrice,
    discountPercent,
    stock,
    status,
    sizes,
    colors,
    featured,
    newArrival,
    rating,
    reviewsCount,
    reviews,
    sku,
    slug,
    createdAt,
    updatedAt,
  };
}

/**
 * Get product full unique shareable URL in format:
 * https://mywebsite.com/product/PRODUCT_ID
 */
export function getProductShareUrl(product: Product | { id: string }): string {
  const origin = window.location.origin;
  const cleanId = String(product?.id || '').trim();
  return `${origin}/product/${encodeURIComponent(cleanId)}`;
}

/**
 * Extract product ID from the current browser URL
 * Supports:
 * - /product/:productId
 * - /product/:productId/
 * - ?product=:productId
 */
export function extractProductIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/product\/([^/?#]+)/i);
  if (match && match[1]) {
    return decodeURIComponent(match[1]).trim();
  }
  const searchParams = new URLSearchParams(window.location.search);
  const qProd = searchParams.get('product');
  if (qProd) return qProd.trim();
  return null;
}

/**
 * Clean any undefined properties from an object recursively
 * so Firestore setDoc never throws unsupported field value error.
 */
function cleanUndefinedForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj
      .map(cleanUndefinedForFirestore)
      .filter(v => v !== undefined && v !== null);
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanUndefinedForFirestore(value);
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Local cache backup helpers
 */
export function saveProductsLocalBackup(products: Product[]) {
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(products));
  } catch (e) {
    // ignore
  }
}

export function loadProductsLocalBackup(): Product[] {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      return list.map((item, idx) => normalizeProductFromFirestore(item.id || `item_${idx}`, item));
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Helper to sort products newest first
 */
function sortProductsList(items: Product[]): Product[] {
  return items.sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (!isNaN(diff) && diff !== 0) return diff;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Fetch a single product directly from Firestore by document ID or product ID.
 * This guarantees direct URLs (/product/:id) load even on fresh tabs or cold page refreshes.
 */
export async function fetchProductByIdFromFirestore(productId: string): Promise<Product | null> {
  const cleanId = String(productId || '').trim();
  if (!cleanId) return null;

  try {
    // 1. Try direct doc reference by ID
    const productRef = doc(db, 'products', cleanId);
    const snap = await getDoc(productRef);
    if (snap.exists()) {
      return normalizeProductFromFirestore(snap.id, snap.data());
    }

    // 2. Secondary fallback: check all docs or where clause
    const q = query(collection(db, 'products'));
    const allSnap = await getDocs(q);
    for (const d of allSnap.docs) {
      const raw = d.data();
      if (
        d.id.toLowerCase() === cleanId.toLowerCase() ||
        String(raw.id || '').toLowerCase() === cleanId.toLowerCase() ||
        String(raw.productId || '').toLowerCase() === cleanId.toLowerCase() ||
        String(raw.slug || '').toLowerCase() === cleanId.toLowerCase()
      ) {
        return normalizeProductFromFirestore(d.id, raw);
      }
    }

    return null;
  } catch (err) {
    console.error(`Error fetching single product ${cleanId} from Firestore:`, err);
    return null;
  }
}

/**
 * Subscribe to real-time products collection from Firestore.
 * Ensures EVERY customer on ANY laptop, mobile, browser sees live changes.
 */
export function subscribeToProducts(
  onData: (products: Product[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef);

    // Real-time listener for live sync across all tabs, browsers, and devices.
    // onSnapshot immediately emits the initial state and subsequently all live updates.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((docSnap) => {
        items.push(normalizeProductFromFirestore(docSnap.id, docSnap.data()));
      });
      const sorted = sortProductsList(items);
      saveProductsLocalBackup(sorted);
      onData(sorted);
    }, (error) => {
      console.warn("Firestore onSnapshot status:", error?.message || error);
      const localBackup = loadProductsLocalBackup();
      if (localBackup.length > 0) {
        onData(localBackup);
      }
      // If error is code unavailable (client operates in offline mode until connected),
      // do not disrupt the customer experience since offline cache is loaded.
      if (error && (error as any).code === 'unavailable') {
        console.info("Firestore is currently operating in offline mode. Local products backup served.");
      } else {
        if (onError) onError(error);
      }
    });

    return unsubscribe;
  } catch (err: any) {
    console.error("Error setting up Firestore products listener:", err);
    if (onError) onError(err instanceof Error ? err : new Error(String(err)));
    onData(loadProductsLocalBackup());
    return () => {};
  }
}

/**
 * Fetch all products once from Firestore
 */
export async function fetchAllProductsOnce(): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    const items: Product[] = [];
    snapshot.forEach(docSnap => {
      items.push(normalizeProductFromFirestore(docSnap.id, docSnap.data()));
    });
    const sorted = sortProductsList(items);
    saveProductsLocalBackup(sorted);
    return sorted;
  } catch (err: any) {
    console.warn("Error fetching products once from Firestore:", err);
    return loadProductsLocalBackup();
  }
}

/**
 * Add or update a product in Firestore shared database with confirmation.
 * Firestore is the single source of truth.
 * Only after Firestore confirms the write is the local cache updated.
 */
export async function saveProductToFirestore(product: Product): Promise<Product> {
  const normalized = normalizeProductFromFirestore(product.id, {
    ...product,
    updatedAt: new Date().toISOString(),
    createdAt: product.createdAt || new Date().toISOString(),
  });

  // 1. Sync to Firestore with strict undefined cleanup
  const productRef = doc(db, 'products', normalized.id);
  const cleanedPayload = cleanUndefinedForFirestore(normalized);

  try {
    await setDoc(productRef, cleanedPayload, { merge: true });

    // 2. Read confirmation to guarantee the document exists in Firestore
    const verifySnap = await getDoc(productRef);
    if (!verifySnap.exists()) {
      throw new Error("Firestore write verification failed: document was not confirmed.");
    }
  } catch (err: any) {
    console.error("Firestore save error:", err);
    throw new Error(err?.message || "Failed to write product to Firestore database.");
  }

  // 3. ONLY after Firestore confirms the write, update local cache
  const currentLocal = loadProductsLocalBackup();
  const exists = currentLocal.some(p => p.id === normalized.id);
  const updatedLocal = exists 
    ? currentLocal.map(p => p.id === normalized.id ? normalized : p)
    : [normalized, ...currentLocal];
  saveProductsLocalBackup(updatedLocal);

  console.log(`Product "${normalized.name}" (${normalized.id}) saved and confirmed in Firestore.`);
  return normalized;
}

/**
 * Delete a product from Firestore shared database
 */
export async function deleteProductFromFirestore(productId: string): Promise<void> {
  // Update local cache immediately
  const currentLocal = loadProductsLocalBackup();
  const updatedLocal = currentLocal.filter(p => p.id !== productId);
  saveProductsLocalBackup(updatedLocal);

  try {
    const productRef = doc(db, 'products', productId);
    await deleteDoc(productRef);
  } catch (err: any) {
    console.error("Firestore delete error:", err);
    throw err;
  }
}

/**
 * Batch delete multiple products
 */
export async function deleteMultipleProductsFromFirestore(productIds: string[]): Promise<void> {
  const idSet = new Set(productIds);
  const currentLocal = loadProductsLocalBackup();
  const updatedLocal = currentLocal.filter(p => !idSet.has(p.id));
  saveProductsLocalBackup(updatedLocal);

  try {
    const batch = writeBatch(db);
    for (const id of productIds) {
      const ref = doc(db, 'products', id);
      batch.delete(ref);
    }
    await batch.commit();
  } catch (err) {
    console.error("Firestore batch delete error:", err);
    throw err;
  }
}
