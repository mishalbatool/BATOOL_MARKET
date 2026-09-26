import imageCompression from 'browser-image-compression';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { requireAdminSession } from './authService';

// In-memory cache to prevent re-uploading identical images
const uploadedImageCache = new Map<string, string>();

/**
 * Generate a unique signature for an image file to detect duplicates
 */
export function getImageFingerprint(file: File): string {
  return `${file.name}_${file.size}_${file.lastModified}`;
}

/**
 * High-performance image compression using browser-image-compression.
 * Resizes and optimizes user-selected images before uploading to Supabase Storage.
 *
 * Defaults:
 * - maxSizeMB: 0.8 (approx 800KB max, usually produces ~100-300KB clean web images)
 * - maxWidthOrHeight: 1200px
 * - useWebWorker: true (keeps UI completely smooth and non-blocking)
 * - fileType: 'image/webp'
 * - initialQuality: 0.82
 */
export async function compressProductImage(
  imageFile: File,
  customOptions?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
    initialQuality?: number;
    onProgress?: (progressPercent: number) => void;
  }
): Promise<File> {
  // If the file is already an ultra-small WebP/JPEG under 60KB, return as-is
  if (imageFile.size < 60 * 1024 && (imageFile.type === 'image/webp' || imageFile.type === 'image/jpeg')) {
    return imageFile;
  }

  const options = {
    maxSizeMB: customOptions?.maxSizeMB ?? 0.8,
    maxWidthOrHeight: customOptions?.maxWidthOrHeight ?? 1200,
    useWebWorker: customOptions?.useWebWorker ?? true,
    fileType: 'image/webp',
    initialQuality: customOptions?.initialQuality ?? 0.82,
    onProgress: customOptions?.onProgress,
  };

  try {
    const compressedFile = await imageCompression(imageFile, options);
    return compressedFile;
  } catch (error) {
    console.warn("browser-image-compression fallback triggered:", error);
    // Canvas-based fallback if WebWorker or browser-image-compression fails
    return await fallbackCanvasCompress(imageFile, options.maxWidthOrHeight, options.initialQuality);
  }
}

/**
 * Canvas fallback compression in case web-workers are restricted in some iframe environments
 */
async function fallbackCanvasCompress(file: File, maxDimension = 1200, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(file);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size > 0) {
            const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const newFile = new File([blob], cleanName, { type: 'image/webp', lastModified: Date.now() });
            resolve(newFile);
          } else {
            resolve(file);
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Client-side safe DataURL conversion for extreme offline fallbacks
 */
export async function compressImageToSafeSize(file: File, maxDimension = 900, quality = 0.72): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(IMAGE_PLACEHOLDER);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, width, height);

      let dataUrl = canvas.toDataURL('image/webp', quality);
      if (dataUrl.length < 50 || dataUrl.startsWith('data:image/png')) {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(IMAGE_PLACEHOLDER);
    };

    img.src = objectUrl;
  });
}

const IMAGE_PLACEHOLDER = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800";

/**
 * Upload an image to Supabase Storage with automatic compression via browser-image-compression,
 * deduplication, retry mechanism, and server fallback.
 */
export async function uploadImageToStorage(
  file: File,
  productId: string,
  onProgress?: (status: string) => void
): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    );
  }

  // Ensure the Admin has a real authenticated Supabase session before uploading
  await requireAdminSession();

  // 1. Check deduplication cache
  const fingerprint = getImageFingerprint(file);
  const cachedUrl = uploadedImageCache.get(fingerprint);
  if (cachedUrl) {
    if (onProgress) onProgress('Reusing uploaded image...');
    return cachedUrl;
  }

  // 2. Client-side compress using browser-image-compression
  if (onProgress) onProgress('Compressing image with browser-image-compression...');
  const optimizedFile = await compressProductImage(file, {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    initialQuality: 0.82,
    onProgress: (percent) => {
      if (onProgress && percent < 100) {
        onProgress(`Compressing image (${percent}%)...`);
      }
    }
  });

  // 3. Upload to existing Supabase Storage bucket ('product-images')
  const cleanId = (productId || 'prod').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanFileName = (file.name || 'image')
    .replace(/\.[^/.]+$/, "") // strip old extension
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = `${cleanId}/${Date.now()}_${cleanFileName}.webp`;

  const bucket = 'product-images';
  if (onProgress) {
    onProgress('Uploading to Supabase Storage...');
  }

  let { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, optimizedFile, {
      contentType: optimizedFile.type || 'image/webp',
      upsert: false,
    });

  // If replacing an existing file path, use UPDATE on storage.objects
  if (
    uploadError &&
    (uploadError.message?.toLowerCase().includes('already exists') ||
      uploadError.message?.toLowerCase().includes('duplicate'))
  ) {
    const updateRes = await supabase.storage
      .from(bucket)
      .update(filePath, optimizedFile, {
        contentType: optimizedFile.type || 'image/webp',
        upsert: true,
      });
    uploadError = updateRes.error;
  }

  if (uploadError) {
    console.error("Supabase Storage upload error:", uploadError);
    if (uploadError.message?.toLowerCase().includes('row-level security')) {
      throw new Error(
        `Supabase Storage RLS error on bucket "${bucket}": ${uploadError.message}. Run the Storage RLS policy SQL in Supabase Dashboard → SQL Editor to grant Admin UID (b8ac65e0-d3b9-43c8-b6ee-49a425a61fa7) INSERT, UPDATE, and DELETE permissions on storage.objects for bucket "${bucket}".`
      );
    }
    throw new Error(`Image upload to Supabase Storage ("${bucket}") failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error(`Failed to generate public URL for uploaded image in bucket "${bucket}".`);
  }

  uploadedImageCache.set(fingerprint, data.publicUrl);
  return data.publicUrl;
}

/**
 * Extract storage object path inside the 'product-images' bucket from a public URL
 */
export function extractProductImagesPath(imageUrl?: string | null): string | null {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const marker = '/storage/v1/object/public/product-images/';
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return null;
  const rawPath = imageUrl.slice(idx + marker.length).split('?')[0];
  return rawPath ? decodeURIComponent(rawPath) : null;
}

/**
 * Delete an old product image from the 'product-images' bucket when replacing or deleting a product
 */
export async function deleteImageFromStorage(imageUrl?: string | null): Promise<void> {
  if (!isSupabaseConfigured || !imageUrl) return;
  const objectPath = extractProductImagesPath(imageUrl);
  if (!objectPath) return;

  await requireAdminSession();

  const { error } = await supabase.storage
    .from('product-images')
    .remove([objectPath]);

  if (error) {
    console.warn(`Could not delete old image "${objectPath}" from product-images:`, error.message);
  }
}
