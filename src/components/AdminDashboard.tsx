import React, { useState, useRef, useEffect } from 'react';
import { Product, CategoryName } from '../types';
import { EXACT_CATEGORIES, normalizeCategoryName } from '../data/categories';
import { 
  loginAdmin, 
  logoutAdmin, 
  isCurrentlyAdmin, 
  subscribeToAdminAuth,
  ADMIN_EMAIL 
} from '../services/authService';
import { uploadImageToStorage, compressProductImage } from '../services/mediaService';
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
  Check, 
  AlertCircle, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Save, 
  Copy, 
  Layers, 
  Palette, 
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
  originalSize?: number;
  compressedSize?: number;
  isExistingUrl?: boolean;
}

// Format bytes into readable KB/MB string
function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [isCompressingImages, setIsCompressingImages] = useState(false);
  const [compressionProgressText, setCompressionProgressText] = useState('');

  // Sizes & Colors string inputs (comma separated)
  const [sizesInput, setSizesInput] = useState('');
  const [colorsInput, setColorsInput] = useState('');

  // Delete modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync with real Supabase Auth session state
  useEffect(() => {
    return subscribeToAdminAuth((status) => {
      setIsAuthenticated(status);
    });
  }, []);

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
      discountPrice: null,
      salePrice: undefined,
      stock: 15,
      sku: '',
    });

    setImageItems([]);
    setSelectedMainImageIndex(0);
    setNewImageUrlInput('');
    setSizesInput('');
    setColorsInput('');
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open "Edit Product" Clean Form with prefilled data
  const handleOpenEdit = (p: Product) => {
    const existingDiscount =
      p.discountPrice !== undefined && p.discountPrice !== null && Number(p.discountPrice) > 0
        ? Number(p.discountPrice)
        : p.salePrice && p.salePrice < p.price
          ? Number(p.salePrice)
          : null;

    setEditingProduct({
      ...p,
      discountPrice: existingDiscount,
    });

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
    setSizesInput((p.sizes || []).join(', '));
    setColorsInput((p.colors || []).join(', '));
    setFormError(null);
    setIsFormOpen(true);
  };

  /**
   * Helper function that resizes and compresses user-selected image files
   * before storing and uploading them, ensuring optimized file sizes.
   */
  const processAndCompressSelectedImages = async (selectedFiles: File[]) => {
    setIsCompressingImages(true);
    setFormError(null);

    const processedItems: ImageItem[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const rawFile = selectedFiles[i];
      setCompressionProgressText(`Optimizing image ${i + 1} of ${selectedFiles.length}...`);

      try {
        // Compress and resize using browser-image-compression
        const compressedFile = await compressProductImage(rawFile, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          initialQuality: 0.82,
        });

        const previewBlobUrl = URL.createObjectURL(compressedFile);

        processedItems.push({
          id: `file_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          previewUrl: previewBlobUrl,
          file: compressedFile,
          originalSize: rawFile.size,
          compressedSize: compressedFile.size,
          isExistingUrl: false,
        });
      } catch (compressionErr) {
        console.warn(`Direct compression issue on ${rawFile.name}, using original:`, compressionErr);
        processedItems.push({
          id: `file_${Date.now()}_${i}`,
          previewUrl: URL.createObjectURL(rawFile),
          file: rawFile,
          originalSize: rawFile.size,
          compressedSize: rawFile.size,
          isExistingUrl: false,
        });
      }
    }

    setImageItems(prev => [...prev, ...processedItems]);
    setIsCompressingImages(false);
    setCompressionProgressText('');
  };

  // Handle multiple image file selection & automatic compression
  const handleImageFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    // Reset input so re-selecting same file works
    if (fileInputRef.current) fileInputRef.current.value = '';

    await processAndCompressSelectedImages(fileList);
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

    // Prevent duplicate submission if clicked more than once
    if (isSubmittingRef.current || isSaving) {
      return;
    }

    if (!editingProduct || !editingProduct.name?.trim()) {
      setFormError('Please provide Product Name.');
      return;
    }

    isSubmittingRef.current = true;
    setIsSaving(true);
    setSaveStatusText('Validating product details...');

    try {
      const fallbackId = 'BM' + (products.length + 1).toString().padStart(3, '0');
      const productId = (editingProduct.id || fallbackId).trim();

      // 1. Process Images: Compress client-side & Upload to Supabase Storage
      setSaveStatusText('Processing product images...');
      const finalImageUrls: string[] = [];

      for (let i = 0; i < imageItems.length; i++) {
        const item = imageItems[i];
        if (item.file) {
          setSaveStatusText(`Uploading image ${i + 1} of ${imageItems.length}...`);
          const downloadUrl = await uploadImageToStorage(
            item.file,
            productId,
            (status) => setSaveStatusText(`Image ${i + 1}/${imageItems.length}: ${status}`)
          );
          finalImageUrls.push(downloadUrl);
        } else if (item.previewUrl) {
          finalImageUrls.push(item.previewUrl);
        }
      }

      if (finalImageUrls.length === 0) {
        finalImageUrls.push(IMAGE_UNAVAILABLE_FALLBACK);
      }

      const mainImage = finalImageUrls[selectedMainImageIndex] || finalImageUrls[0];

      // 2. Prepare product data for Supabase
      setSaveStatusText('Saving product to Supabase...');

      const price = Number(editingProduct.price) || 0;
      const rawDiscount = editingProduct.discountPrice;
      const hasDiscount =
        rawDiscount !== undefined &&
        rawDiscount !== null &&
        String(rawDiscount).trim() !== '' &&
        Number(rawDiscount) > 0;
      const discountPrice = hasDiscount ? Number(rawDiscount) : null;
      const salePrice = discountPrice !== null ? discountPrice : price;
      const discountPercent = price > salePrice && price > 0
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
        price,
        discountPrice,
        salePrice,
        discountPercent,
        stock,
        status,
        sizes: parsedSizes.length > 0 ? parsedSizes : [],
        colors: parsedColors.length > 0 ? parsedColors : [],
        sku: editingProduct.sku?.trim() || productId,
        createdAt: editingProduct.createdAt,
        updatedAt: new Date().toISOString(),
      };

      // 3. Save to Supabase products table
      await onSaveProduct(completeProduct);

      setIsFormOpen(false);
      showToast(`Product "${completeProduct.name}" saved successfully.`);
    } catch (err: any) {
      console.error("Error saving product:", err);
      setFormError(err?.message || "Unable to save product. Please try again.");
    } finally {
      setIsSaving(false);
      isSubmittingRef.current = false;
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
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  {product.id}
                                </span>
                                <span className="text-[11px] text-stone-500 font-medium">
                                  {product.category}
                                </span>
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

              {/* Row 2: Price, Discount Price, Stock, Product ID */}
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
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: e.target.value === '' ? ('' as any) : Number(e.target.value),
                      })
                    }
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
                    value={editingProduct.discountPrice ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const numVal = raw === '' ? null : Number(raw);
                      setEditingProduct({
                        ...editingProduct,
                        discountPrice: numVal,
                        salePrice: numVal !== null && numVal > 0 ? numVal : undefined,
                      });
                    }}
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
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock: e.target.value === '' ? ('' as any) : Number(e.target.value),
                      })
                    }
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

                {/* Compression Progress Notification */}
                {isCompressingImages && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 text-xs font-medium animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-700 shrink-0" />
                    <span>{compressionProgressText || 'Compressing and resizing images with browser-image-compression...'}</span>
                  </div>
                )}

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
                            <span className="absolute top-1 left-1 bg-amber-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs z-10">
                              MAIN
                            </span>
                          )}

                          {/* File size badge if compressed */}
                          {item.compressedSize && (
                            <span className="absolute bottom-1 right-1 bg-stone-900/85 backdrop-blur-xs text-white text-[8px] font-mono px-1 py-0.2 rounded shadow-xs z-10">
                              {formatBytes(item.compressedSize)}
                            </span>
                          )}

                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1 z-20">
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
                  disabled={isSaving || isCompressingImages}
                  className="px-6 py-2 rounded-xl text-white bg-amber-700 hover:bg-amber-800 font-semibold shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{saveStatusText}</span>
                    </>
                  ) : isCompressingImages ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Optimizing Images...</span>
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
