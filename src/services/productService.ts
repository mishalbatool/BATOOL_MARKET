import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product } from '../types';
import { normalizeCategoryName } from '../data/categories';
import { requireAdminSession } from './authService';
import { deleteImageFromStorage } from './mediaService';

export const ADMIN_EMAIL_DEFAULT = "mishalbatool572@gmail.com";
export const IMAGE_UNAVAILABLE_FALLBACK = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80";

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
 * Convert any row from Supabase products table into the exact Product model expected by UI components.
 * Seamlessly handles snake_case and camelCase column variations from Supabase.
 */
export function mapSupabaseRowToProduct(row: any): Product {
  const data = row || {};

  // 1. Product ID
  const id = String(data.id || data.product_id || data.productId || data.sku || '').trim();

  // 2. Product Name
  const name = String(
    data.name || 
    data.product_name || 
    data.title || 
    (id ? `Item ${id}` : 'Batool Market Product')
  ).trim();

  // 3. Category
  const rawCat = data.category || data.category_name || data.department;
  const category = normalizeCategoryName(rawCat);

  // 4. Description
  const description = String(
    data.description || 
    data.desc || 
    data.details || 
    `${name} - premium quality from Batool Market.`
  ).trim();

  const shortDescription = typeof data.short_description === 'string' && data.short_description.trim()
    ? data.short_description.trim()
    : (typeof data.shortDescription === 'string' && data.shortDescription.trim()
      ? data.shortDescription.trim()
      : (description.length > 90 ? `${description.slice(0, 87)}...` : description));

  // 5. Images (gather from images, image, image_url, imageUrl)
  let gatheredImages: string[] = [];
  if (Array.isArray(data.images)) {
    data.images.forEach((img: any) => {
      if (typeof img === 'string' && img.trim()) gatheredImages.push(img.trim());
    });
  } else if (typeof data.images === 'string' && data.images.trim()) {
    try {
      const parsed = JSON.parse(data.images);
      if (Array.isArray(parsed)) {
        parsed.forEach((img: any) => {
          if (typeof img === 'string' && img.trim()) gatheredImages.push(img.trim());
        });
      } else {
        gatheredImages.push(data.images.trim());
      }
    } catch {
      gatheredImages.push(data.images.trim());
    }
  }

  const primaryImageCandidate = 
    data.image_url || 
    data.imageUrl || 
    data.image || 
    (gatheredImages.length > 0 ? gatheredImages[0] : '');

  if (typeof primaryImageCandidate === 'string' && primaryImageCandidate.trim()) {
    const cleanPrimary = primaryImageCandidate.trim();
    if (!gatheredImages.includes(cleanPrimary)) {
      gatheredImages.unshift(cleanPrimary);
    }
  }

  gatheredImages = Array.from(new Set(gatheredImages));
  if (gatheredImages.length === 0) {
    gatheredImages = [IMAGE_UNAVAILABLE_FALLBACK];
  }
  const primaryImage = gatheredImages[0];

  // 6. Pricing (price and optional discount_price)
  const parsedPrice = parseNumeric(data.price ?? data.original_price ?? data.originalPrice ?? data.cost, 0);
  const rawDiscount = data.discount_price ?? data.discountPrice;
  const hasExplicitDiscount =
    rawDiscount !== null &&
    rawDiscount !== undefined &&
    String(rawDiscount).trim() !== '' &&
    parseNumeric(rawDiscount, 0) > 0;
  const parsedDiscountPrice = hasExplicitDiscount ? parseNumeric(rawDiscount, 0) : null;

  const price = parsedPrice > 0 ? parsedPrice : (parsedDiscountPrice && parsedDiscountPrice > 0 ? parsedDiscountPrice : 0);
  const discountPrice = parsedDiscountPrice !== null && parsedDiscountPrice > 0 ? parsedDiscountPrice : null;
  const salePrice = discountPrice !== null ? discountPrice : price;
  const discountPercent =
    price > salePrice && price > 0
      ? Math.round(((price - salePrice) / price) * 100)
      : 0;

  // 7. Stock & Status
  const stock = parseNumeric(data.stock ?? data.quantity ?? data.qty ?? data.inventory, 10);
  const rawStatus = String(data.status || data.stock_status || '').toLowerCase();
  const status: 'in_stock' | 'low_stock' | 'out_of_stock' =
    rawStatus === 'out_of_stock' || stock <= 0
      ? 'out_of_stock'
      : rawStatus === 'low_stock' || stock <= 5
        ? 'low_stock'
        : 'in_stock';

  // 8. Sizes
  let sizes: string[] | undefined;
  if (Array.isArray(data.sizes)) {
    sizes = data.sizes.map((s: any) => String(s).trim()).filter(Boolean);
  } else if (typeof data.sizes === 'string' && data.sizes.trim()) {
    try {
      const parsed = JSON.parse(data.sizes);
      if (Array.isArray(parsed)) sizes = parsed.map((s: any) => String(s).trim()).filter(Boolean);
      else sizes = data.sizes.split(',').map((s: string) => s.trim()).filter(Boolean);
    } catch {
      sizes = data.sizes.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }
  if (sizes && sizes.length === 0) sizes = undefined;

  // 9. Colors / Colours
  const rawColors = data.colors ?? data.colours;
  let colors: string[] | undefined;
  if (Array.isArray(rawColors)) {
    colors = rawColors.map((c: any) => String(c).trim()).filter(Boolean);
  } else if (typeof rawColors === 'string' && rawColors.trim()) {
    try {
      const parsed = JSON.parse(rawColors);
      if (Array.isArray(parsed)) colors = parsed.map((c: any) => String(c).trim()).filter(Boolean);
      else colors = rawColors.split(',').map((c: string) => c.trim()).filter(Boolean);
    } catch {
      colors = rawColors.split(',').map((c: string) => c.trim()).filter(Boolean);
    }
  }
  if (colors && colors.length === 0) colors = undefined;

  // 10. SKU, Slug & Timestamps
  const sku = data.sku ? String(data.sku).trim() : undefined;
  const slug = data.slug || generateProductSlug(name, id);
  const createdAt = data.created_at || data.createdAt || new Date().toISOString();
  const updatedAt = data.updated_at || data.updatedAt || new Date().toISOString();

  return {
    id,
    name,
    category,
    description,
    shortDescription,
    image: primaryImage,
    images: gatheredImages,
    price,
    discountPrice,
    salePrice,
    discountPercent,
    stock,
    status,
    sizes,
    colors,
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
 * Extract product ID from current browser URL
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
 * Fetch all products from Supabase products table
 * Selects existing columns: id, created_at, name, category, price, discount_price, description, colors, sizes, image_url, stock
 */
export async function fetchAllProductsOnce(): Promise<Product[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, created_at, name, category, price, discount_price, description, colors, sizes, image_url, stock');

    if (error) {
      console.error("Error fetching products from Supabase:", error.message);
      return [];
    }

    if (Array.isArray(data)) {
      const mapped = data.map(mapSupabaseRowToProduct);
      return sortProductsList(mapped);
    }
    return [];
  } catch (err: any) {
    console.error("Exception fetching products from Supabase:", err?.message || err);
    return [];
  }
}

/**
 * Fetch a single product by ID or Slug from Supabase
 */
export async function fetchProductByIdFromSupabase(productId: string): Promise<Product | null> {
  const cleanId = String(productId || '').trim();
  if (!cleanId || !isSupabaseConfigured) return null;

  try {
    const isNumericId = /^\d+$/.test(cleanId);
    let query = supabase
      .from('products')
      .select('id, created_at, name, category, price, discount_price, description, colors, sizes, image_url, stock');

    if (isNumericId) {
      query = query.eq('id', parseInt(cleanId, 10));
    } else {
      query = query.limit(1);
    }

    const { data, error } = await query;

    if (error) {
      console.warn(`Supabase fetchProductById error (${cleanId}):`, error.message);
      return null;
    }

    if (data && data.length > 0) {
      return mapSupabaseRowToProduct(data[0]);
    }

    return null;
  } catch (err) {
    console.error(`Error fetching product ${cleanId} from Supabase:`, err);
    return null;
  }
}

/**
 * Subscribe to real-time products changes from Supabase.
 * Automatically keeps the website in sync when products are added, edited, or deleted.
 */
export function subscribeToProducts(
  onData: (products: Product[]) => void,
  onError?: (err: Error) => void
): () => void {
  let isCancelled = false;

  // 1. Fetch initial products from Supabase
  fetchAllProductsOnce()
    .then((initialProducts) => {
      if (!isCancelled) {
        onData(initialProducts);
      }
    })
    .catch((err) => {
      if (!isCancelled && onError) {
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    });

  if (!isSupabaseConfigured) {
    return () => { isCancelled = true; };
  }

  // 2. Set up real-time listener for postgres_changes on products table
  try {
    const channel = supabase
      .channel('public:products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          // Re-fetch all products upon any change to maintain consistent sorted list
          fetchAllProductsOnce()
            .then((updatedList) => {
              if (!isCancelled) {
                onData(updatedList);
              }
            })
            .catch((err) => {
              console.warn("Error refreshing products after real-time event:", err);
            });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && onError) {
          onError(new Error("Supabase real-time connection notice. Polling available."));
        }
      });

    return () => {
      isCancelled = true;
      supabase.removeChannel(channel);
    };
  } catch (err: any) {
    console.warn("Supabase real-time subscription error:", err?.message || err);
    return () => { isCancelled = true; };
  }
}

/**
 * Save product to Supabase products table matching the exact schema:
 * id, created_at, name, category, price, discount_price, description, colors, sizes, image_url, stock
 */
export async function saveProductToSupabase(product: Product): Promise<Product> {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase credentials not detected. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables."
    );
  }

  // Verify the Admin has an active authenticated Supabase session before INSERT/UPDATE
  await requireAdminSession();

  const discountPriceValue =
    product.discountPrice !== undefined && product.discountPrice !== null && Number(product.discountPrice) > 0
      ? Number(product.discountPrice)
      : null;

  const normalized = mapSupabaseRowToProduct({
    ...product,
    discount_price: discountPriceValue,
    updated_at: new Date().toISOString(),
    created_at: product.createdAt || new Date().toISOString(),
  });

  // Target the exact existing columns and data types of the Supabase products table
  const payload: Record<string, any> = {
    name: normalized.name,
    category: normalized.category,
    price: Number(normalized.price) || 0,
    discount_price: discountPriceValue,
    description: normalized.description,
    colors: normalized.colors && normalized.colors.length > 0 ? normalized.colors.join(', ') : null,
    sizes: normalized.sizes && normalized.sizes.length > 0 ? normalized.sizes.join(', ') : null,
    image_url: normalized.image,
    stock: Math.max(0, Math.floor(Number(normalized.stock) || 0)),
  };

  const cleanId = String(product.id || '').trim();
  const isNumericId = /^\d+$/.test(cleanId);
  const isExistingProduct = isNumericId && Boolean(product.createdAt);
  let previousImageUrl: string | null = null;

  if (isExistingProduct) {
    const existing = await fetchProductByIdFromSupabase(cleanId);
    if (existing && existing.image && existing.image !== normalized.image) {
      previousImageUrl = existing.image;
    }
  }

  const executeWrite = async (body: Record<string, any>) => {
    if (isExistingProduct) {
      const numericId = parseInt(cleanId, 10);
      const updateRes = await supabase
        .from('products')
        .update(body)
        .eq('id', numericId)
        .select();

      // If row existed and was updated (or an error occurred), return it
      if (updateRes.error || (updateRes.data && updateRes.data.length > 0)) {
        return updateRes;
      }
    }

    // Insert new product row (PostgreSQL auto-generates bigint id and created_at)
    return await supabase
      .from('products')
      .insert(body)
      .select();
  };

  let { data, error } = await executeWrite(payload);

  // If colors column name variation (colours vs colors), adapt dynamically
  if (error && error.message?.includes('colours does not exist')) {
    delete payload.colours;
    const retry = await executeWrite(payload);
    error = retry.error;
    data = retry.data;
  } else if (error && error.message?.includes('colors does not exist')) {
    const colVal = payload.colors;
    delete payload.colors;
    payload.colours = colVal;
    const retry = await executeWrite(payload);
    error = retry.error;
    data = retry.data;
  }

  if (error) {
    console.error("Supabase product save error:", error);
    if (error.code === '42501' || error.message?.toLowerCase().includes('row-level security')) {
      throw new Error(
        `Supabase RLS error (${error.code}): ${error.message}. Run the RLS policy SQL in Supabase Dashboard → SQL Editor to grant Admin UID (b8ac65e0-d3b9-43c8-b6ee-49a425a61fa7) INSERT, UPDATE, and DELETE permissions on public.products.`
      );
    }
    throw new Error(`Database save failed: ${error.message}`);
  }

  if (previousImageUrl) {
    await deleteImageFromStorage(previousImageUrl);
  }

  if (data && data.length > 0) {
    return mapSupabaseRowToProduct(data[0]);
  }

  return normalized;
}

/**
 * Delete product from Supabase products table and remove its image from product-images
 */
export async function deleteProductFromSupabase(productId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }

  await requireAdminSession();

  const cleanId = String(productId || '').trim();
  const isNumericId = /^\d+$/.test(cleanId);
  const existing = await fetchProductByIdFromSupabase(cleanId);

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', isNumericId ? parseInt(cleanId, 10) : cleanId);

  if (error) {
    console.error("Supabase delete product error:", error);
    throw new Error(error.message || "Failed to delete product from Supabase.");
  }

  if (existing?.image) {
    await deleteImageFromStorage(existing.image);
  }
}

/**
 * Batch delete multiple products from Supabase
 */
export async function deleteMultipleProductsFromSupabase(productIds: string[]): Promise<void> {
  if (!isSupabaseConfigured || productIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .in('id', productIds);

  if (error) {
    console.error("Supabase batch delete error:", error);
    throw new Error(error.message || "Failed to batch delete products.");
  }
}
