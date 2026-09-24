import React, { useState, useRef, useEffect } from 'react';
import { Product, CategoryName, ReviewItem } from '../types';
import { EXACT_CATEGORIES, normalizeCategoryName } from '../data/categories';
import { 
  loginAdmin, 
  logoutAdmin, 
  isCurrentlyAdmin, 
  ADMIN_EMAIL 
} from '../services/authService';
import { uploadMediaFileToStorage, compressImageToSafeSize } from '../services/mediaService';
import { getProductShareUrl } from '../services/productService';
import { SafeProductImage } from './SafeProductImage';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  X, 
  Upload, 
  Image as ImageIcon, 
  Video, 
  Check, 
  AlertCircle, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Save, 
  Copy, 
  Layers, 
  Palette, 
  Star, 
  Sparkles,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

const IMAGE_UNAVAILABLE_FALLBACK = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800";

interface AdminDashboardProps {
  products: Product[];
  onSaveProduct: (p: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onClose: () => void;
  initialOpenAdd?: boolean;
}

interface ImageItem {
  id: string;
  previewUrl: string;
  file?: File;
  isExistingUrl?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  onSaveProduct,
  onDeleteProduct,
  onClose,
  initialOpenAdd = false,
}) => {
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(() => isCurrentlyAdmin());
  const [emailInput, setEmailInput] = useState(ADMIN_EMAIL);
  const [passwordInput, setPasswordInput] = useState('batool2026');
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Search & Filter
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simple Add/Edit Product Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatusText, setSaveStatusText] = useState('Saving product...');
  const [formError, setFormError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Multiple image upload items
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [selectedMainImageIndex, setSelectedMainImageIndex] = useState<number>(0);
  const [newImageUrlInput, setNewImageUrlInput] = useState('');

  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  const [videoPreviewError, setVideoPreviewError] = useState(false);

  // Sizes & Colors string inputs (comma separated)
  const [sizesInput, setSizesInput] = useState('');
  const [colorsInput, setColorsInput] = useState('');

  // Reviews list management inside product edit
  const [productReviews, setProductReviews] = useState<ReviewItem[]>([]);

  // Delete modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // If initialOpenAdd was requested and authenticated, open add form immediately
  useEffect(() => {
    if (initialOpenAdd && isAuthenticated && !isFormOpen) {
      handleOpenAdd();
    }
  }, [initialOpenAdd, isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError('');
    setAuthNotice('');

    const res = await loginAdmin(passwordInput, emailInput);
    setIsLoggingIn(false);

    if (res.success) {
      setIsAuthenticated(true);
      if (res.providerNeeded && res.error) {
        setAuthNotice(res.error);
      }
      showToast('Admin authenticated successfully');
      if (initialOpenAdd) {
        handleOpenAdd();
      }
    } else {
      setAuthError(res.error || 'Authentication failed. Please check credentials.');
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
    setPasswordInput('');
    showToast('Admin logged out');
  };

  // Open "Add Product" Clean Form
  const handleOpenAdd = () => {
    const nextNum = products.length + 1;
    const newId = 'BM' + nextNum.toString().padStart(3, '0');

    setEditingProduct({
      id: newId,
      name: '',
      category: 'Cosmetics',
      description: '',
      price: 1999,
      salePrice: 1699,
      stock: 15,
      rating: 5.0,
      reviewsCount: 1,
      featured: false,
      newArrival: true,
      sku: '',
    });

    setImageItems([]);
    setSelectedMainImageIndex(0);
    setNewImageUrlInput('');
    setVideoFile(null);
    setVideoPreviewUrl('');
    setVideoUrlInput('');
    setVideoPreviewError(false);
    setSizesInput('');
    setColorsInput('');
    setProductReviews([]);
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open "Edit Product" Clean Form with prefilled data
  const handleOpenEdit = (p: Product) => {
    setEditingProduct({ ...p });

    // Populate images
    const existingImgs = p.images && p.images.length > 0 
      ? [...p.images] 
      : (p.image ? [p.image] : []);

    const loadedItems: ImageItem[] = existingImgs.map((url, idx) => ({
      id: `existing_${idx}_${Date.now()}`,
      previewUrl: url,
      isExistingUrl: true,
    }));

    setImageItems(loadedItems);
    const mainIdx = existingImgs.indexOf(p.image);
    setSelectedMainImageIndex(mainIdx >= 0 ? mainIdx : 0);

    setNewImageUrlInput('');
    setVideoFile(null);
    setVideoPreviewUrl(p.video || '');
    setVideoUrlInput(p.video || '');
    setVideoPreviewError(false);
    setSizesInput((p.sizes || []).join(', '));
    setColorsInput((p.colors || []).join(', '));
    setProductReviews(p.reviews ? [...p.reviews] : []);
    setFormError(null);
    setIsFormOpen(true);
  };

  // Handle multiple image file selection & preview
  const handleImageFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: ImageItem[] = Array.from(files).map((file, idx) => ({
      id: `file_${Date.now()}_${idx}`,
      previewUrl: URL.createObjectURL(file),
      file: file,
      isExistingUrl: false,
    }));

    setImageItems(prev => [...prev, ...newItems]);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Add image by URL
  const handleAddImageUrl = () => {
    const url = newImageUrlInput.trim();
    if (!url) return;

    setImageItems(prev => [
      ...prev,
      {
        id: `url_${Date.now()}`,
        previewUrl: url,
        isExistingUrl: true,
      }
    ]);
    setNewImageUrlInput('');
  };

  // Remove an image preview
  const handleRemoveImage = (indexToRemove: number) => {
    setImageItems(prev => {
      const removed = prev[indexToRemove];
      if (removed && removed.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      const next = prev.filter((_, idx) => idx !== indexToRemove);
      if (selectedMainImageIndex >= next.length) {
        setSelectedMainImageIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  // Handle video file upload
  const handleVideoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert("Video file size is larger than 50MB. Please select a smaller video or enter a direct streaming URL.");
      return;
    }

    if (videoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreviewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoPreviewUrl(objectUrl);
    setVideoUrlInput('');
    setVideoPreviewError(false);

    if (videoFileInputRef.current) videoFileInputRef.current.value = '';
  };

  // Handle removing video
  const handleRemoveVideo = () => {
    if (videoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoFile(null);
    setVideoPreviewUrl('');
    setVideoUrlInput('');
    setVideoPreviewError(false);
  };

  // Copy product link with feedback
  const handleCopyLink = (p: Product) => {
    const url = getProductShareUrl(p);
    navigator.clipboard.writeText(url).then(() => {
      showToast("Product link copied!");
    }).catch(() => {
      prompt("Product link copied! Share URL:", url);
    });
  };

  // Save / Update Product
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editingProduct || !editingProduct.name?.trim() || !editingProduct.id?.trim()) {
      setFormError('Please provide Product Name and Product ID.');
      return;
    }

    setIsSaving(true);
    setSaveStatusText('Validating product details...');

    try {
      const productId = editingProduct.id.trim();

      // 1. Process Images
      setSaveStatusText('Processing product images...');
      const finalImageUrls: string[] = [];

      for (let i = 0; i < imageItems.length; i++) {
        const item = imageItems[i];
        if (item.file) {
          setSaveStatusText(`Uploading image ${i + 1} of ${imageItems.length}...`);
          try {
            // Attempt upload to Firebase Storage
            const downloadUrl = await uploadMediaFileToStorage(item.file, 'images', productId);
            finalImageUrls.push(downloadUrl);
          } catch (storageErr: any) {
            console.warn("Storage upload notice, optimizing image fallback:", storageErr.message);
            // If Storage bucket is not enabled yet in Firebase Console, compress down to web size (<35KB)
            // so Firestore's 1MB document limit is never exceeded!
            const safeDataUrl = await compressImageToSafeSize(item.file, 800, 0.7);
            finalImageUrls.push(safeDataUrl);
          }
        } else {
          finalImageUrls.push(item.previewUrl);
        }
      }

      if (finalImageUrls.length === 0) {
        finalImageUrls.push(IMAGE_UNAVAILABLE_FALLBACK);
      }

      const mainImage = finalImageUrls[selectedMainImageIndex] || finalImageUrls[0];

      // 2. Process Video
      let finalVideoUrl: string | null = null;

      if (videoFile) {
        setSaveStatusText('Uploading video to Firebase Storage (0%)...');
        try {
          const downloadUrl = await uploadMediaFileToStorage(
            videoFile,
            'videos',
            productId,
            (percent) => {
              setSaveStatusText(`Uploading video to Firebase Storage (${percent}%)...`);
            }
          );
          finalVideoUrl = downloadUrl;
        } catch (videoErr: any) {
          // If storage bucket is not activated, notify admin clearly and abort!
          throw new Error(
            `Video upload failed: ${videoErr?.message || 'Storage error'}. If you don't have Storage enabled in Firebase Console, you can enter a direct streaming video URL instead.`
          );
        }
      } else if (videoUrlInput.trim()) {
        finalVideoUrl = videoUrlInput.trim();
      } else if (editingProduct.video && !videoFile && videoPreviewUrl === editingProduct.video) {
        finalVideoUrl = editingProduct.video;
      }

      // 3. Prepare product data
      setSaveStatusText('Saving product to shared database...');

      const price = Number(editingProduct.price) || 0;
      const salePrice = editingProduct.salePrice !== undefined && editingProduct.salePrice !== null && Number(editingProduct.salePrice) > 0 
        ? Number(editingProduct.salePrice) 
        : price;
      const discountPercent = price > salePrice
        ? Math.round(((price - salePrice) / price) * 100)
        : 0;

      const stock = Number(editingProduct.stock) || 0;
      const status: 'in_stock' | 'low_stock' | 'out_of_stock' =
        stock <= 0 ? 'out_of_stock' : stock <= 5 ? 'low_stock' : 'in_stock';

      // Parse sizes and colors
      const parsedSizes = sizesInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const parsedColors = colorsInput
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      const completeProduct: Product = {
        id: productId,
        name: editingProduct.name.trim(),
        category: normalizeCategoryName(editingProduct.category),
        description: editingProduct.description?.trim() || `${editingProduct.name} - high quality item from Batool Market.`,
        shortDescription: editingProduct.shortDescription?.trim() || '',
        image: mainImage,
        images: finalImageUrls,
        video: finalVideoUrl || undefined,
        price,
        salePrice,
        discountPercent,
        stock,
        status,
        sizes: parsedSizes.length > 0 ? parsedSizes : [],
        colors: parsedColors.length > 0 ? parsedColors : [],
        rating: Number(editingProduct.rating) || 5.0,
        reviewsCount: productReviews.length > 0 ? productReviews.length : (Number(editingProduct.reviewsCount) || 1),
        reviews: productReviews.length > 0 ? productReviews : [],
        featured: Boolean(editingProduct.featured),
        newArrival: Boolean(editingProduct.newArrival),
        sku: editingProduct.sku?.trim() || productId,
        createdAt: editingProduct.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 4. Save and verify write in Firestore
      await onSaveProduct(completeProduct);

      setIsFormOpen(false);
      showToast(`Product "${completeProduct.name}" saved successfully.`);
    } catch (err: any) {
      console.error("Error saving product:", err);
      setFormError(err?.message || "Unable to save product. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm delete single product
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteProduct(productToDelete.id);
      showToast(`Deleted "${productToDelete.name}"`);
      setProductToDelete(null);
    } catch (err: any) {
      alert("Error deleting product: " + (err?.message || err));
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      (p.name || '').toLowerCase().includes(adminSearch.toLowerCase()) ||
      (p.id || '').toLowerCase().includes(adminSearch.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(adminSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(adminSearch.toLowerCase()));

    const matchesCategory = 
      adminCategoryFilter === 'all' || 
      normalizeCategoryName(p.category) === normalizeCategoryName(adminCategoryFilter);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-80 bg-stone-900 text-[#FAF9F5] px-4 py-2.5 rounded-xl shadow-xl border border-amber-600/40 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-[#FAF9F5] border border-stone-300 w-full max-w-6xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="bg-stone-900 text-[#FAF9F5] px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 border-b border-stone-800">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Batool Market</span>
                <span className="text-amber-500 text-xs font-sans px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-700/50">
                  Admin Portal
                </span>
              </h2>
              <p className="text-[11px] text-stone-400">
                Single source of truth product management & shared Firestore database
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-stone-300 hover:text-white px-3 py-1.5 rounded-lg border border-stone-700 hover:bg-stone-800 transition-colors flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-stone-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Banner */}
        {authNotice && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{authNotice}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF9F5]">
          {!isAuthenticated ? (
            /* Store Owner Login Form */
            <div className="max-w-md mx-auto py-8 sm:py-14 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">
                Store Owner Authorization
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mb-6 leading-relaxed">
                Only authorized store managers can create, modify, or delete products and media in the shared database.
              </p>

              <form onSubmit={handleLogin} className="space-y-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-md text-left">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    placeholder="Email"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 bg-stone-50/50"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Admin Password
                    </label>
                  </div>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    placeholder="Password"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 bg-stone-50/50"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                 
                  </p>
                </div>

                {authError && (
                  <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Access Product Management</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Authenticated Admin Product Panel */
            <div className="space-y-5">
              {/* Top Controls: Add Product, Search, Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
                {/* Prominent Add Product Button */}
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="bg-amber-700 hover:bg-amber-800 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Product</span>
                </button>

                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, SKU, category..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-600 bg-stone-50"
                  />
                  {adminSearch && (
                    <button
                      type="button"
                      onClick={() => setAdminSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <select
                  value={adminCategoryFilter}
                  onChange={(e) => setAdminCategoryFilter(e.target.value)}
                  className="text-xs py-2 px-3 rounded-xl border border-stone-300 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-amber-600 shrink-0"
                >
                  <option value="all">All Categories ({products.length})</option>
                  {EXACT_CATEGORIES.map((cat: string) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Products Table / Cards */}
              <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
                <div className="p-3 sm:px-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs text-stone-600">
                  <span className="font-semibold">
                    Catalogue: {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Shared in Cloud • Visible to all shoppers
                  </span>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-stone-500 text-sm mb-3">No products match your current filter.</p>
                    <button
                      type="button"
                      onClick={handleOpenAdd}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add your first product now</span>
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {filteredProducts.map((product) => {
                      const isOutOfStock = product.stock <= 0;
                      return (
                        <div
                          key={product.id}
                          className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-stone-50/70 transition-colors"
                        >
                          {/* Left: Thumbnail & Info */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-14 h-14 rounded-xl overflow-hidden border border-stone-200 bg-[#F5F2EA] shrink-0 relative">
                              <SafeProductImage
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                              {product.video && (
                                <div className="absolute bottom-0.5 right-0.5 bg-stone-900/80 p-0.5 rounded text-amber-400">
                                  <Video className="w-2.5 h-2.5" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  {product.id}
                                </span>
                                <span className="text-[11px] text-stone-500 font-medium">
                                  {product.category}
                                </span>
                                {product.video && (
                                  <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1 rounded font-medium flex items-center gap-0.5">
                                    <Video className="w-2.5 h-2.5" /> Video Available
                                  </span>
                                )}
                              </div>

                              <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                                {product.name}
                              </h4>

                              <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-0.5">
                                <span className="font-semibold text-stone-800">
                                  Rs. {(Number(product.salePrice) || Number(product.price) || 0).toLocaleString()}
                                </span>
                                {product.price > product.salePrice && (
                                  <span className="line-through text-stone-400">
                                    Rs. {(Number(product.price) || 0).toLocaleString()}
                                  </span>
                                )}
                                <span className={isOutOfStock ? "text-red-600 font-bold" : "text-emerald-700 font-medium"}>
                                  Stock: {product.stock}
                                </span>
                                <span className="text-amber-600 flex items-center gap-0.5 font-medium">
                                  <Star className="w-3 h-3 fill-current" /> {product.rating ?? 5.0} ({product.reviews?.length || product.reviewsCount || 1})
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                            {/* Copy Link */}
                            <button
                              type="button"
                              onClick={() => handleCopyLink(product)}
                              className="text-xs text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-2xs font-medium cursor-pointer"
                              title="Copy unique product link"
                            >
                              <Copy className="w-3.5 h-3.5 text-stone-500" />
                              <span className="hidden sm:inline">Copy Product Link</span>
                              <span className="sm:hidden">Copy</span>
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(product)}
                              className="text-xs text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-2xs font-semibold cursor-pointer"
                              title="Edit product"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setProductToDelete(product)}
                              className="text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-2xs font-semibold cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-6 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <span>Batool Market E-Commerce</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-stone-700 hover:text-stone-950 px-3 py-1 bg-white border border-stone-300 rounded-lg cursor-pointer"
          >
            Back to Store
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 1. SIMPLE & CLEAN ADD / EDIT PRODUCT MODAL */}
      {/* ========================================================================= */}
      {isFormOpen && editingProduct && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF9F5] border border-stone-300 w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="bg-stone-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <h3 className="font-serif text-base sm:text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{editingProduct.createdAt ? 'Edit Product' : 'Add New Product'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-stone-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Error Banner */}
            {formError && (
              <div className="bg-red-50 border-b border-red-200 px-5 py-2.5 text-xs text-red-700 flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form Body */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              {/* Row 1: Product Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Product Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="e.g., Luxury Organza Embroidered 3-Piece"
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Category <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={editingProduct.category || 'Cosmetics'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as CategoryName })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-600"
                  >
                    {EXACT_CATEGORIES.map((cat: string) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Price, Sale Price, Stock, Product ID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Price (PKR) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.price ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    placeholder="2500"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Discount Price (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.salePrice ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, salePrice: Number(e.target.value) })}
                    placeholder="Optional sale price"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Stock Quantity <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.stock ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    placeholder="10"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Product ID / SKU <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.id || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, id: e.target.value })}
                    placeholder="BM001"
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>
              </div>

              {/* Row 3: Description */}
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Describe material, quality, features, guarantees, packaging..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>

              {/* Row 4: Optional Sizes & Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-stone-200">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-amber-700" />
                    <span>Sizes (Optional, comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={sizesInput}
                    onChange={(e) => setSizesInput(e.target.value)}
                    placeholder="Small, Medium, Large, XL"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-amber-700" />
                    <span>Colors (Optional, comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={colorsInput}
                    onChange={(e) => setColorsInput(e.target.value)}
                    placeholder="Black, Maroon, Gold, Emerald"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>
              </div>

              {/* Row 5: UNLIMITED PRODUCT IMAGES (UPLOAD MULTIPLE, PREVIEW, REMOVE, SET MAIN) */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                    <ImageIcon className="w-4 h-4 text-amber-700" />
                    <span>Product Images (Multiple Image Upload)</span>
                  </label>
                  <span className="text-[11px] text-stone-500">
                    {imageItems.length} {imageItems.length === 1 ? 'image' : 'images'} added
                  </span>
                </div>

                {/* Upload Buttons and URL Input */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image Files (Multiple)</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageFilesSelected}
                    className="hidden"
                  />

                  <div className="flex-1 flex gap-2">
                    <input
                      type="url"
                      placeholder="Or paste image URL..."
                      value={newImageUrlInput}
                      onChange={(e) => setNewImageUrlInput(e.target.value)}
                      className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="bg-stone-200 hover:bg-stone-300 text-stone-800 px-3 py-1.5 rounded-xl font-semibold shrink-0 cursor-pointer"
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                {/* Previews Grid */}
                {imageItems.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 pt-2">
                    {imageItems.map((item, idx) => {
                      const isMain = selectedMainImageIndex === idx;
                      return (
                        <div
                          key={item.id}
                          className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all bg-[#F5F2EA] ${
                            isMain
                              ? 'border-amber-700 ring-2 ring-amber-700/20 shadow-sm'
                              : 'border-stone-200'
                          }`}
                        >
                          <SafeProductImage
                            src={item.previewUrl}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Main badge */}
                          {isMain && (
                            <span className="absolute top-1 left-1 bg-amber-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                              MAIN
                            </span>
                          )}

                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                            {!isMain && (
                              <button
                                type="button"
                                onClick={() => setSelectedMainImageIndex(idx)}
                                className="text-[10px] bg-white text-stone-900 font-bold px-2 py-0.5 rounded shadow-xs hover:bg-amber-100 cursor-pointer"
                              >
                                Set Main
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded shadow-xs hover:bg-red-700 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-stone-400 text-[11px] italic bg-stone-50 p-2.5 rounded-xl text-center border border-dashed border-stone-200">
                    No images added yet. Upload files or paste URLs above.
                  </p>
                )}
              </div>

              {/* Row 6: PRODUCT VIDEO (UPLOAD OR URL, EMBEDDED STREAMING, PREVIEW) */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                    <Video className="w-4 h-4 text-amber-700" />
                    <span>Product Video (Optional)</span>
                  </label>
                  <span className="text-[11px] text-stone-500">
                    Protected playback on product page
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    className="bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Video File (MP4/WebM)</span>
                  </button>

                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileSelected}
                    className="hidden"
                  />

                  <div className="flex-1 flex gap-2">
                    <input
                      type="url"
                      placeholder="Or paste streaming video URL (MP4, Cloudinary)..."
                      value={videoUrlInput}
                      onChange={(e) => {
                        setVideoUrlInput(e.target.value);
                        setVideoPreviewUrl(e.target.value);
                        setVideoFile(null);
                        setVideoPreviewError(false);
                      }}
                      className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                    {videoPreviewUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-xl font-semibold shrink-0 cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Video Preview */}
                {videoPreviewUrl && (
                  <div className="mt-2 p-2 bg-stone-900 rounded-xl max-w-sm">
                    <video
                      src={videoPreviewUrl}
                      controls
                      controlsList="nodownload nofullscreen noremoteplayback"
                      disablePictureInPicture
                      onContextMenu={(e) => e.preventDefault()}
                      onError={() => setVideoPreviewError(true)}
                      className="w-full max-h-48 rounded-lg object-contain bg-black"
                      playsInline
                    />
                    {videoPreviewError && (
                      <p className="text-red-400 text-[10px] mt-1">
                        Could not load video preview. Please verify URL format.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Row 7: Rating & Reviews Management */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Rating & Reviews Management</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-stone-500">Displayed Rating:</span>
                    <select
                      value={editingProduct.rating ?? 5.0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, rating: Number(e.target.value) })}
                      className="text-xs px-2 py-1 rounded border border-stone-300 bg-stone-50"
                    >
                      <option value={5.0}>5.0 ⭐⭐⭐⭐⭐</option>
                      <option value={4.8}>4.8 ⭐⭐⭐⭐⭐</option>
                      <option value={4.5}>4.5 ⭐⭐⭐⭐</option>
                      <option value={4.0}>4.0 ⭐⭐⭐⭐</option>
                      <option value={3.5}>3.5 ⭐⭐⭐</option>
                    </select>
                  </div>
                </div>

                {/* List existing reviews with delete button for admin */}
                {productReviews.length > 0 ? (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {productReviews.map((rev, rIdx) => (
                      <div key={rev.id || rIdx} className="flex items-center justify-between bg-stone-50 p-2 rounded-lg border border-stone-200 text-[11px]">
                        <div>
                          <span className="font-bold text-stone-800">{rev.author}</span>
                          <span className="text-amber-600 font-bold ml-1.5">({rev.rating}★)</span>:
                          <span className="text-stone-600 ml-1 italic">"{rev.comment}"</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProductReviews(prev => prev.filter((_, idx) => idx !== rIdx))}
                          className="text-red-600 hover:text-red-800 text-[10px] font-semibold ml-2 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-stone-400 text-[11px] italic">
                    No customer reviews on this product yet.
                  </p>
                )}
              </div>

              {/* Row 8: Flags */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.featured)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                    className="rounded text-amber-700 focus:ring-amber-600"
                  />
                  <span>Featured Product</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.newArrival)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, newArrival: e.target.checked })}
                    className="rounded text-amber-700 focus:ring-amber-600"
                  />
                  <span>New Arrival</span>
                </label>
              </div>

              {/* Actions Footer inside modal */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-700 bg-stone-100 hover:bg-stone-200 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl text-white bg-amber-700 hover:bg-amber-800 font-semibold shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{saveStatusText}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Product</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CONFIRM DELETE MODAL */}
      {/* ========================================================================= */}
      {productToDelete && (
        <div className="fixed inset-0 z-70 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-lg font-bold text-stone-900">
                Delete Product
              </h4>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-stone-900">"{productToDelete.name}"</span> ({productToDelete.id})? This will remove it from the shared cloud database for all customers.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl text-stone-600 bg-stone-100 hover:bg-stone-200 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
