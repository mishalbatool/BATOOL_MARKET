import React, { useState, useRef } from 'react';
import { Product, CategoryName, ImportPreviewItem, ImportReport } from '../types';
import { EXACT_CATEGORIES, CATEGORIES, normalizeCategoryName } from '../data/categories';
import { ADMIN_PASSWORD_DEFAULT, IMAGE_UNAVAILABLE_FALLBACK } from '../utils/storage';
import { 
  downloadImportTemplate, 
  parseImportFile, 
  processRawRowsForPreview, 
  convertPreviewItemToProduct 
} from '../utils/productImport';
import { SafeProductImage } from './SafeProductImage';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Lock, 
  Unlock, 
  Save, 
  X, 
  Upload, 
  FileSpreadsheet,
  Download, 
  Sparkles,
  Check,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface AdminDashboardProps {
  products: Product[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteMultipleProducts: (productIds: string[]) => void;
  onImportProducts: (newProducts: Product[], mode: 'add' | 'replace') => void;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  onSaveProduct,
  onDeleteProduct,
  onDeleteMultipleProducts,
  onImportProducts,
  onClose,
}) => {
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Selected products for batch delete
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Search & Filter
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit / Add Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [extraImagesInput, setExtraImagesInput] = useState<string>('');

  // Import flow state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'report'>('upload');
  const [previewItems, setPreviewItems] = useState<ImportPreviewItem[]>([]);
  const [importErrors, setImportErrors] = useState<{ rowNumber: number; id?: string; name?: string; message: string }[]>([]);
  const [importOption, setImportOption] = useState<'add' | 'replace'>('add');
  const [duplicateResolution, setDuplicateResolution] = useState<'update' | 'skip'>('update');
  const [isConfirmingReplace, setIsConfirmingReplace] = useState(false);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === ADMIN_PASSWORD_DEFAULT) {
      setIsAuthenticated(true);
      setAuthError('');
      showToast('Admin access granted');
    } else {
      setAuthError(`Incorrect password. Default is: ${ADMIN_PASSWORD_DEFAULT}`);
    }
  };

  // Open Add Product
  const handleOpenAdd = () => {
    const newId = 'BM' + (products.length + 1).toString().padStart(3, '0');
    setEditingProduct({
      id: newId,
      name: '',
      category: 'Cosmetics',
      price: 2500,
      salePrice: 1999,
      discountPercent: 20,
      image: '',
      images: [],
      shortDescription: '',
      description: '',
      stock: 10,
      status: 'in_stock',
      featured: false,
      newArrival: true,
      sku: '',
      rating: 5.0,
      reviewsCount: 1,
    });
    setExtraImagesInput('');
    setIsFormOpen(true);
  };

  // Open Edit Product
  const handleOpenEdit = (p: Product) => {
    setEditingProduct({ ...p });
    setExtraImagesInput((p.images || []).filter(img => img !== p.image).join('\n'));
    setIsFormOpen(true);
  };

  // Save product form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || !editingProduct.id) {
      alert('Please fill out Product ID and Product Name.');
      return;
    }

    const price = Number(editingProduct.price) || 0;
    const salePrice = Number(editingProduct.salePrice) || price;
    const discountPercent = price > salePrice
      ? Math.round(((price - salePrice) / price) * 100)
      : 0;

    const stock = Number(editingProduct.stock) || 0;
    const status: 'in_stock' | 'low_stock' | 'out_of_stock' =
      stock <= 0 ? 'out_of_stock' : stock <= 5 ? 'low_stock' : 'in_stock';

    // Parse extra images from textarea
    const parsedImages = extraImagesInput
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const primaryImage = editingProduct.image?.trim() || IMAGE_UNAVAILABLE_FALLBACK;
    const combinedImages = [primaryImage, ...parsedImages.filter(img => img !== primaryImage)];

    const completeProduct: Product = {
      id: editingProduct.id.trim(),
      name: editingProduct.name.trim(),
      category: (editingProduct.category as CategoryName) || 'Other',
      description: editingProduct.description || `${editingProduct.name} available at Batool Market.`,
      shortDescription: editingProduct.shortDescription || '',
      image: primaryImage,
      images: combinedImages,
      price,
      salePrice,
      discountPercent,
      stock,
      status,
      featured: !!editingProduct.featured,
      newArrival: !!editingProduct.newArrival,
      sku: editingProduct.sku?.trim() || undefined,
      rating: editingProduct.rating || 5.0,
      reviewsCount: editingProduct.reviewsCount || 1,
      createdAt: editingProduct.createdAt || new Date().toISOString()
    };

    onSaveProduct(completeProduct);
    setIsFormOpen(false);
    showToast(`Saved product "${completeProduct.name}"`);
  };

  // Delete product with confirmation
  const handleDeleteWithConfirm = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete product "${product.name}" (${product.id})?`)) {
      onDeleteProduct(product.id);
      setSelectedProductIds(prev => prev.filter(id => id !== product.id));
      showToast(`Deleted ${product.name}`);
    }
  };

  // Batch delete with confirmation
  const handleBatchDelete = () => {
    if (selectedProductIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete all ${selectedProductIds.length} selected products?`)) {
      onDeleteMultipleProducts(selectedProductIds);
      setSelectedProductIds([]);
      showToast(`Deleted ${selectedProductIds.length} products`);
    }
  };

  // Toggle selection
  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (filteredList: Product[]) => {
    if (selectedProductIds.length === filteredList.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredList.map(p => p.id));
    }
  };

  // File upload for image (convert to data URL safely)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Selected image is larger than 2MB. Please choose a smaller image or use an image URL.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditingProduct(prev => ({
          ...prev,
          image: reader.result as string
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // ==========================================
  // BULK IMPORT LOGIC
  // ==========================================
  const handleOpenImport = () => {
    setImportStep('upload');
    setPreviewItems([]);
    setImportErrors([]);
    setImportOption('add');
    setDuplicateResolution('update');
    setIsConfirmingReplace(false);
    setImportReport(null);
    setIsImportModalOpen(true);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingFile(true);
    try {
      const rawRows = await parseImportFile(file);
      if (rawRows.length === 0) {
        alert("The uploaded file does not contain any product data rows.");
        setIsReadingFile(false);
        return;
      }

      const { items, errors } = processRawRowsForPreview(rawRows, products);
      setPreviewItems(items);
      setImportErrors(errors);
      setImportStep('preview');
    } catch (err: any) {
      console.error(err);
      alert(`Failed to read file: ${err.message || 'Unknown format'}`);
    } finally {
      setIsReadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const executeImport = () => {
    if (previewItems.length === 0) {
      alert("No valid products to import.");
      return;
    }

    let successCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const executionErrors: { rowNumber: number; id?: string; name?: string; message: string }[] = [...importErrors];

    const existingMap = new Map(products.map(p => [p.id.toLowerCase(), p]));
    const finalProductsMap = new Map<string, Product>();

    if (importOption === 'add') {
      // Keep existing products
      products.forEach(p => finalProductsMap.set(p.id.toLowerCase(), p));

      // Process new ones
      previewItems.forEach((item, idx) => {
        const key = item.id.toLowerCase();
        const product = convertPreviewItemToProduct(item);

        if (existingMap.has(key)) {
          if (duplicateResolution === 'update') {
            finalProductsMap.set(key, product);
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          finalProductsMap.set(key, product);
          successCount++;
        }
      });
    } else {
      // 'replace': completely replace all products
      previewItems.forEach((item, idx) => {
        const key = item.id.toLowerCase();
        const product = convertPreviewItemToProduct(item);
        if (finalProductsMap.has(key)) {
          if (duplicateResolution === 'update') {
            finalProductsMap.set(key, product);
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          finalProductsMap.set(key, product);
          successCount++;
        }
      });
    }

    const finalProductList = Array.from(finalProductsMap.values());
    onImportProducts(finalProductList, importOption);

    const report: ImportReport = {
      totalParsed: previewItems.length + importErrors.length,
      successCount,
      updatedCount,
      skippedCount,
      errorCount: executionErrors.length,
      errors: executionErrors
    };

    setImportReport(report);
    setImportStep('report');
    setIsConfirmingReplace(false);
    showToast(`Successfully processed import (${finalProductList.length} total products)`);
  };

  // Filtered Products in Admin Table
  const filteredAdminProducts = products.filter(p => {
    const matchesSearch = adminSearch.trim() === '' || 
      (p.name || '').toLowerCase().includes(adminSearch.toLowerCase()) ||
      (p.id || '').toLowerCase().includes(adminSearch.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(adminSearch.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(adminSearch.toLowerCase());

    const matchesCategory = adminCategoryFilter === 'all' || p.category === adminCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-60 bg-stone-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-stone-700 animate-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-[#FAF9F5] border border-stone-300 w-full max-w-7xl h-[92vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-900 flex items-center justify-center font-bold">
              {isAuthenticated ? <Unlock className="w-5 h-5 text-amber-700" /> : <Lock className="w-5 h-5 text-amber-700" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
                  Batool Market Product Management
                </h2>
                <span className="text-[10px] bg-stone-100 text-stone-700 font-mono px-2 py-0.5 rounded-full border border-stone-200">
                  {products.length} Products
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Bulk import catalogues via CSV/Excel, manage stock, categories &amp; pricing without editing code.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-100 transition-colors"
            aria-label="Close admin dashboard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Screen if not logged in */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-[#F5F2EA]">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-md max-w-md w-full space-y-5 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Store Owner Login
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Enter your store management password to access inventory and bulk product import.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-3 text-left">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-amber-600"
                    autoFocus
                  />
                  {authError && (
                    <p className="text-[11px] text-red-600 mt-1">{authError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#181816] hover:bg-stone-800 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-xs"
                >
                  Unlock Admin Portal
                </button>
              </form>

              <div className="pt-2 text-[11px] text-stone-400 border-t border-stone-100">
                Default password: <span className="font-mono text-stone-600 font-bold">{ADMIN_PASSWORD_DEFAULT}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard Content */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Action Bar: Search, Category Filter, Buttons */}
            <div className="p-3 sm:p-4 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
              
              {/* Search & Filter */}
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                <div className="relative flex-1 min-w-[160px] max-w-xs">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by ID, SKU, title, category..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-amber-600"
                  />
                </div>

                <select
                  value={adminCategoryFilter}
                  onChange={(e) => setAdminCategoryFilter(e.target.value)}
                  className="text-xs bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-2 text-stone-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories ({products.length})</option>
                  {EXACT_CATEGORIES.map(c => {
                    const count = products.filter(p => p.category === c).length;
                    return (
                      <option key={c} value={c}>{c} ({count})</option>
                    );
                  })}
                </select>

                {selectedProductIds.length > 0 && (
                  <button
                    onClick={handleBatchDelete}
                    className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedProductIds.length})</span>
                  </button>
                )}
              </div>

              {/* Action Buttons: Add, Import, Download Template */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => downloadImportTemplate('csv')}
                  className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all border border-stone-300"
                  title="Download CSV template format for importing products"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Import Template</span>
                </button>

                <button
                  onClick={handleOpenImport}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Products</span>
                </button>

                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 bg-[#181816] hover:bg-stone-800 text-[#FAF9F5] text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>

            </div>

            {/* Product Table */}
            <div className="flex-1 overflow-auto bg-[#FAF9F5] p-3 sm:p-4">
              {filteredAdminProducts.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4 bg-white rounded-2xl border border-stone-200">
                  <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-800">
                      {products.length === 0 ? "No products available yet." : "No matching products found"}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 max-w-sm">
                      {products.length === 0 
                        ? "Click 'Import Products' to upload your CSV/Excel catalogue, or click 'Add Product' to create your first item." 
                        : "Try clearing your search query or choosing another category filter."}
                    </p>
                  </div>
                  {products.length === 0 && (
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={handleOpenImport}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Import Products Now</span>
                      </button>
                      <button
                        onClick={handleOpenAdd}
                        className="bg-[#181816] hover:bg-stone-800 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Manually</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-100/90 text-stone-700 font-bold border-b border-stone-200">
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.length === filteredAdminProducts.length && filteredAdminProducts.length > 0}
                            onChange={() => handleSelectAll(filteredAdminProducts)}
                            className="w-3.5 h-3.5 accent-amber-700 cursor-pointer"
                          />
                        </th>
                        <th className="p-3">Image</th>
                        <th className="p-3">Product</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredAdminProducts.map((p) => {
                        const isSelected = selectedProductIds.includes(p.id);
                        return (
                          <tr key={p.id} className={`hover:bg-amber-50/40 transition-colors ${isSelected ? 'bg-amber-50/70' : ''}`}>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectProduct(p.id)}
                                className="w-3.5 h-3.5 accent-amber-700 cursor-pointer"
                              />
                            </td>
                            <td className="p-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                                <SafeProductImage
                                  src={p.image}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-stone-900 line-clamp-1 max-w-xs sm:max-w-md">
                                {p.name}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-stone-400 font-mono mt-0.5">
                                <span>ID: {p.id}</span>
                                {p.sku && <span>· SKU: {p.sku}</span>}
                                {p.featured && <span className="text-amber-700 font-bold bg-amber-100/60 px-1 rounded">Featured</span>}
                                {p.newArrival && <span className="text-stone-700 font-bold bg-stone-200/80 px-1 rounded">New</span>}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded text-[11px] truncate max-w-[140px] inline-block">
                                {p.category}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-stone-900 font-mono">
                                Rs. {p.salePrice.toLocaleString()}
                              </div>
                              {p.price > p.salePrice && (
                                <div className="text-[10px] text-stone-400 line-through">
                                  Rs. {p.price.toLocaleString()}
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <span className="font-mono font-medium text-stone-800">
                                {p.stock}
                              </span>
                            </td>
                            <td className="p-3">
                              {p.stock <= 0 || p.status === 'out_of_stock' ? (
                                <span className="text-red-700 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[10px]">
                                  Out of Stock
                                </span>
                              ) : p.stock <= 5 || p.status === 'low_stock' ? (
                                <span className="text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px]">
                                  Low Stock ({p.stock})
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
                                  In Stock
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEdit(p)}
                                  className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-amber-100/60 rounded-lg transition-colors"
                                  title="Edit product"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteWithConfirm(p)}
                                  className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT PRODUCT MODAL */}
      {/* ========================================================================= */}
      {isFormOpen && editingProduct && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="relative bg-[#FAF9F5] border border-stone-300 w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-6">
            
            <div className="p-4 sm:p-5 bg-white border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {editingProduct.id && products.some(p => p.id === editingProduct.id) ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Product ID *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.id || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, id: e.target.value })}
                    placeholder="e.g. BM001"
                    className="w-full p-2.5 bg-white rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">SKU (Optional)</label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    placeholder="e.g. BM-LIP-01"
                    className="w-full p-2.5 bg-white rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="e.g. Velvet Matte Long-Wear Lipstick"
                  className="w-full p-2.5 bg-white rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Category *</label>
                  <select
                    value={editingProduct.category || 'Other'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as CategoryName })}
                    className="w-full p-2.5 bg-white rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600 cursor-pointer"
                  >
                    {EXACT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.stock ?? 10}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-white rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Original Price (PKR) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.price ?? 2500}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-white rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Sale Price (PKR) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.salePrice ?? 1999}
                    onChange={(e) => setEditingProduct({ ...editingProduct, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-white rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Image Input & Preview */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Primary Image URL or Local Upload</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingProduct.image || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                    placeholder="https://... image URL"
                    className="flex-1 p-2.5 bg-white rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600"
                  />
                  <label className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-2.5 rounded-xl border border-stone-300 cursor-pointer inline-flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {editingProduct.image && (
                  <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-stone-300 bg-white">
                    <SafeProductImage
                      src={editingProduct.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Multiple Images */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Additional Images (One URL per line)
                </label>
                <textarea
                  rows={2}
                  value={extraImagesInput}
                  onChange={(e) => setExtraImagesInput(e.target.value)}
                  placeholder="https://... image 2&#10;https://... image 3"
                  className="w-full p-2.5 bg-white rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600 font-mono text-[11px]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Product Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Detailed product information, specifications, fabric, usage..."
                  className="w-full p-2.5 bg-white rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600 leading-relaxed"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingProduct.featured}
                    onChange={(e) => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                    className="w-4 h-4 accent-amber-700 rounded"
                  />
                  <span className="font-semibold text-stone-800">Featured Product</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingProduct.newArrival}
                    onChange={(e) => setEditingProduct({ ...editingProduct, newArrival: e.target.checked })}
                    className="w-4 h-4 accent-amber-700 rounded"
                  />
                  <span className="font-semibold text-stone-800">New Arrival</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#181816] hover:bg-stone-800 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BULK IMPORT MODAL (Upload, Preview, Confirm, Report) */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="relative bg-[#FAF9F5] border border-stone-300 w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-white border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
                  Bulk Product Import (CSV / Excel)
                </h3>
                <p className="text-xs text-stone-500">
                  Import your complete catalogue automatically into Batool Market.
                </p>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              
              {/* STEP 1: Upload */}
              {importStep === 'upload' && (
                <div className="space-y-6 max-w-xl mx-auto py-6">
                  
                  {/* Drag/Drop & File Input */}
                  <div className="border-2 border-dashed border-stone-300 rounded-2xl p-8 text-center bg-white space-y-4 hover:border-amber-600 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-serif text-base font-bold text-stone-900">
                        Select a CSV or Excel (.xlsx) file
                      </h4>
                      <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                        Expected columns: Product ID, Product Name, Category, Description, Image, Original Price, Sale Price, Stock, Featured, New Arrival, SKU.
                      </p>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      onChange={handleFileSelected}
                      className="hidden"
                      id="bulkImportFileInput"
                    />

                    <label
                      htmlFor="bulkImportFileInput"
                      className="inline-flex items-center gap-2 bg-[#181816] hover:bg-stone-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-xs transition-all"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isReadingFile ? 'Reading file...' : 'Choose CSV / Excel File'}</span>
                    </label>
                  </div>

                  {/* Template download banner */}
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-amber-900 block">Need the exact Excel format?</span>
                      <span className="text-amber-800">Download the pre-filled template with all recognized categories and headers.</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadImportTemplate('csv')}
                        className="bg-white hover:bg-amber-100 text-amber-900 font-bold px-3 py-1.5 rounded-lg border border-amber-300 text-xs shrink-0"
                      >
                        Download CSV
                      </button>
                      <button
                        onClick={() => downloadImportTemplate('xlsx')}
                        className="bg-white hover:bg-amber-100 text-amber-900 font-bold px-3 py-1.5 rounded-lg border border-amber-300 text-xs shrink-0"
                      >
                        Download Excel
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* STEP 2: Preview & Configuration */}
              {importStep === 'preview' && (
                <div className="space-y-5">
                  
                  {/* Status Banner */}
                  <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-serif text-base font-bold text-stone-900">
                        {previewItems.length} products ready to import
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Please review the parsed rows and choose your import options below before confirming.
                      </p>
                    </div>

                    <button
                      onClick={() => setImportStep('upload')}
                      className="text-xs text-stone-500 hover:text-stone-900 underline"
                    >
                      Upload a different file
                    </button>
                  </div>

                  {/* Import Mode Options (Add vs Replace All) */}
                  <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-4">
                    <h5 className="font-serif text-sm font-bold text-stone-900">
                      Import Mode
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <label className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        importOption === 'add' ? 'border-amber-700 bg-amber-50/50' : 'border-stone-200 hover:border-stone-300'
                      }`}>
                        <div className="flex items-center gap-2 font-bold text-stone-900 mb-1">
                          <input
                            type="radio"
                            name="importOption"
                            value="add"
                            checked={importOption === 'add'}
                            onChange={() => {
                              setImportOption('add');
                              setIsConfirmingReplace(false);
                            }}
                            className="accent-amber-700"
                          />
                          <span>Option A — Add Products</span>
                        </div>
                        <p className="text-stone-600 text-[11px] pl-5">
                          Keep existing products and add the newly imported products to the catalogue.
                        </p>
                      </label>

                      <label className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        importOption === 'replace' ? 'border-red-600 bg-red-50/50' : 'border-stone-200 hover:border-stone-300'
                      }`}>
                        <div className="flex items-center gap-2 font-bold text-red-900 mb-1">
                          <input
                            type="radio"
                            name="importOption"
                            value="replace"
                            checked={importOption === 'replace'}
                            onChange={() => setImportOption('replace')}
                            className="accent-red-600"
                          />
                          <span>Option B — Replace All Products</span>
                        </div>
                        <p className="text-stone-600 text-[11px] pl-5">
                          Permanently delete all existing/sample products and replace them with the imported catalogue.
                        </p>
                      </label>
                    </div>

                    {/* Duplicate resolution rule if 'add' */}
                    {importOption === 'add' && (
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-700">If a Product ID already exists:</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="dupRes"
                              checked={duplicateResolution === 'update'}
                              onChange={() => setDuplicateResolution('update')}
                              className="accent-amber-700"
                            />
                            <span>Update existing product</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="dupRes"
                              checked={duplicateResolution === 'skip'}
                              onChange={() => setDuplicateResolution('skip')}
                              className="accent-amber-700"
                            />
                            <span>Skip product</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Warning Confirmation when Replace All Products is selected */}
                  {importOption === 'replace' && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 text-xs text-red-900 space-y-2 animate-in fade-in">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Confirmation Required</span>
                      </div>
                      <p>
                        “Are you sure? This will permanently remove all currently stored products and replace them with the imported catalogue.”
                      </p>
                      <label className="flex items-center gap-2 font-bold text-stone-900 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isConfirmingReplace}
                          onChange={(e) => setIsConfirmingReplace(e.target.checked)}
                          className="w-4 h-4 accent-red-600 rounded"
                        />
                        <span>I confirm that I want to delete all current products and import this new list.</span>
                      </label>
                    </div>
                  )}

                  {/* Parse Errors banner if any rows failed validation */}
                  {importErrors.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-700" />
                        <span>{importErrors.length} row(s) had missing information and will be skipped:</span>
                      </div>
                      <ul className="list-disc pl-5 text-[11px] text-amber-800 space-y-0.5">
                        {importErrors.map((err, i) => (
                          <li key={i}>Row {err.rowNumber}: {err.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
                    <div className="p-3 bg-stone-100 border-b border-stone-200 font-bold text-xs text-stone-800 flex justify-between items-center">
                      <span>Import Preview Table ({previewItems.length} items)</span>
                      <span className="text-[11px] font-normal text-stone-500">Broken images will fall back safely to "Image unavailable"</span>
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 sticky top-0">
                          <tr>
                            <th className="p-2.5">Image</th>
                            <th className="p-2.5">Product Name</th>
                            <th className="p-2.5">Category</th>
                            <th className="p-2.5">Original Price</th>
                            <th className="p-2.5">Sale Price</th>
                            <th className="p-2.5">Stock</th>
                            <th className="p-2.5">Featured</th>
                            <th className="p-2.5">New Arrival</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {previewItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-stone-50">
                              <td className="p-2.5">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
                                  <SafeProductImage
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </td>
                              <td className="p-2.5">
                                <div className="font-bold text-stone-900 max-w-xs truncate">{item.name}</div>
                                <div className="text-[10px] text-stone-400 font-mono">ID: {item.id}</div>
                              </td>
                              <td className="p-2.5">
                                <span className="bg-stone-100 px-2 py-0.5 rounded text-[11px] text-stone-700">
                                  {item.category}
                                </span>
                              </td>
                              <td className="p-2.5 font-mono">Rs. {item.price.toLocaleString()}</td>
                              <td className="p-2.5 font-mono font-bold text-stone-900">Rs. {item.salePrice.toLocaleString()}</td>
                              <td className="p-2.5 font-mono">{item.stock}</td>
                              <td className="p-2.5">{item.featured ? 'Yes' : 'No'}</td>
                              <td className="p-2.5">{item.newArrival ? 'Yes' : 'No'}</td>
                              <td className="p-2.5">
                                {item.statusConflict === 'exists' ? (
                                  <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                    Product already exists
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                    New Item
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* STEP 3: Report */}
              {importStep === 'report' && importReport && (
                <div className="space-y-6 max-w-lg mx-auto py-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <h4 className="font-serif text-xl font-bold text-stone-900">
                      Import Complete!
                    </h4>
                    <p className="text-xs text-stone-500 mt-1">
                      Your store catalogue has been updated and is immediately visible to visitors.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-stone-200 p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-2 bg-stone-50 rounded-xl">
                      <span className="text-xs text-stone-500 block">Created</span>
                      <span className="font-serif text-xl font-bold text-emerald-700">{importReport.successCount}</span>
                    </div>
                    <div className="p-2 bg-stone-50 rounded-xl">
                      <span className="text-xs text-stone-500 block">Updated</span>
                      <span className="font-serif text-xl font-bold text-amber-700">{importReport.updatedCount}</span>
                    </div>
                    <div className="p-2 bg-stone-50 rounded-xl">
                      <span className="text-xs text-stone-500 block">Skipped</span>
                      <span className="font-serif text-xl font-bold text-stone-600">{importReport.skippedCount}</span>
                    </div>
                    <div className="p-2 bg-stone-50 rounded-xl">
                      <span className="text-xs text-stone-500 block">Errors</span>
                      <span className="font-serif text-xl font-bold text-red-600">{importReport.errorCount}</span>
                    </div>
                  </div>

                  {importReport.errors.length > 0 && (
                    <div className="text-left bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
                      <span className="font-bold text-stone-800 block mb-1">Issue Details:</span>
                      <ul className="space-y-1 text-stone-600 text-[11px]">
                        {importReport.errors.map((err, i) => (
                          <li key={i}>• Row {err.rowNumber}: {err.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setIsImportModalOpen(false);
                      setImportStep('upload');
                    }}
                    className="bg-[#181816] hover:bg-stone-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs"
                  >
                    Done &amp; View Products
                  </button>
                </div>
              )}

            </div>

            {/* Footer Buttons for Step 2 (Preview) */}
            {importStep === 'preview' && (
              <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between gap-3">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
                >
                  Cancel Import
                </button>

                <button
                  onClick={executeImport}
                  disabled={importOption === 'replace' && !isConfirmingReplace}
                  className={`px-6 py-2.5 text-white font-bold text-xs rounded-xl shadow-xs transition-all ${
                    importOption === 'replace' && !isConfirmingReplace
                      ? 'bg-stone-300 cursor-not-allowed text-stone-500'
                      : importOption === 'replace'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  Confirm Import ({previewItems.length} Products)
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
