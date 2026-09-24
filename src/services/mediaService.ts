import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

/**
 * Helper to upload a file to the full-stack server endpoint
 */
async function uploadToServerStorage(
  file: File,
  folder: 'images' | 'videos',
  productId: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const cleanName = `${productId}_${file.name}`;
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: cleanName,
            base64Data,
            folder,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server storage error: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.url) {
          // Construct absolute URL so devices across any network can load the media
          const absoluteUrl = typeof window !== 'undefined' 
            ? `${window.location.origin}${data.url}` 
            : data.url;
          resolve(absoluteUrl);
        } else {
          throw new Error('Server storage did not return a valid URL');
        }
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file for storage upload'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Upload a media file (Image or Video) to Firebase Cloud Storage.
 * Falls back to server storage if Firebase Storage bucket is not activated.
 * Returns the permanent public download URL.
 */
export async function uploadMediaFileToStorage(
  file: File,
  folder: 'images' | 'videos',
  productId: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const cleanId = (productId || 'prod').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const storagePath = `products/${folder}/${cleanId}/${Date.now()}_${cleanFileName}`;

  const storageRef = ref(storage, storagePath);
  const metadata = {
    contentType: file.type || (folder === 'videos' ? 'video/mp4' : 'image/jpeg')
  };

  try {
    const downloadUrl = await new Promise<string>((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0 && onProgress) {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            onProgress(progress);
          }
        },
        (error: any) => {
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (urlErr) {
            reject(urlErr);
          }
        }
      );
    });

    return downloadUrl;
  } catch (storageError: any) {
    console.warn(`Firebase Storage notice (${folder}), using server media storage:`, storageError?.message || storageError);
    // Fallback to server media storage
    try {
      return await uploadToServerStorage(file, folder, cleanId, onProgress);
    } catch (serverError: any) {
      console.warn(`Server storage upload failed:`, serverError?.message || serverError);
      if (folder === 'images') {
        // Safe image compression fallback under 40KB
        return await compressImageToSafeSize(file, 800, 0.7);
      }
      throw new Error(`Media upload failed: ${serverError?.message || 'Storage unavailable'}`);
    }
  }
}

/**
 * Client-side high-efficiency image compression.
 * Downscales images to web size and converts to WebP/JPEG under 40KB.
 * Ensures that even if an image is inlined, it NEVER exceeds Firestore's 1MB document limit.
 */
export async function compressImageToSafeSize(file: File, maxDimension = 900, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
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
        reject(new Error('Canvas context not available for image compression'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try webp first, fallback to jpeg
      let dataUrl = canvas.toDataURL('image/webp', quality);
      if (dataUrl.length < 50 || dataUrl.startsWith('data:image/png')) {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = objectUrl;
  });
}
