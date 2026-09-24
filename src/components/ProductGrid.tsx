import React, { useState, useMemo, useEffect } from 'react';
import { Product, CategoryName } from '../types';
import { CATEGORIES, normalizeCategoryName } from '../data/categories';
import { ProductCard } from './ProductCard';
import { 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  X, 
  Sparkles, 
  Filter, 
  PackageOpen, 
  Loader2, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  fetchError?: string | null;
  onRetry?: () => void;
  selectedCategory: CategoryName | null;
  onSelectCategory: (cat: CategoryName | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onViewDetails: (product: Product) => void;
  onOrderWhatsApp: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOpenAdmin?: () => void;
}

type SortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc';

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  fetchError = null,
  onRetry,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  setSearchQuery,
  onViewDetails,
  onOrderWhatsApp,
  onAddToCart,
  onOpenAdmin,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(100000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState<boolean>(false);

  // Highest price calculation for price slider
  const highestPrice = useMemo(() => {
    if (products.length === 0) return 20000;
    return Math.max(...products.map(p => Number(p.salePrice) || Number(p.price) || 0), 10000);
  }, [products]);

  // Adjust max price if products exceed default
  useEffect(() => {
    if (highestPrice > maxPriceFilter) {
      setMaxPriceFilter(highestPrice);
    }
  }, [highestPrice]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter - robust normalized comparison
      if (selectedCategory) {
        const pCat = normalizeCategoryName(p.category);
        const selCat = normalizeCategoryName(selectedCategory);
        if (pCat !== selCat && p.category !== selectedCategory) {
          return false;
        }
      }

      // Search query filter (name, category, description, sku, id)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = (p.name || '').toLowerCase().includes(query);
        const matchesCat = (p.category || '').toLowerCase().includes(query);
        const matchesDesc = (p.description || '').toLowerCase().includes(query) || 
                            (p.shortDescription || '').toLowerCase().includes(query);
        const matchesSku = (p.sku || '').toLowerCase().includes(query);
        const matchesId = (p.id || '').toLowerCase().includes(query);

        if (!matchesName && !matchesCat && !matchesDesc && !matchesSku && !matchesId) {
          return false;
        }
      }

      // Max price filter
      const pSalePrice = Number(p.salePrice) || Number(p.price) || 0;
      if (pSalePrice > maxPriceFilter) {
        return false;
      }

      // In stock only filter
      const pStock = Number(p.stock) || 0;
      if (inStockOnly && (pStock <= 0 || p.status === 'out_of_stock')) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const aSalePrice = Number(a.salePrice) || Number(a.price) || 0;
      const bSalePrice = Number(b.salePrice) || Number(b.price) || 0;

      if (sortBy === 'newest') {
        return (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0);
      }
      if (sortBy === 'price-asc') {
        return aSalePrice - bSalePrice;
      }
      if (sortBy === 'price-desc') {
        return bSalePrice - aSalePrice;
      }
      // 'featured'
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }, [products, selectedCategory, searchQuery, maxPriceFilter, inStockOnly, sortBy]);

  const resetAllFilters = () => {
    onSelectCategory(null);
    setSearchQuery('');
    setMaxPriceFilter(Math.max(highestPrice, 10000));
    setInStockOnly(false);
    setSortBy('featured');
  };

  return (
    <section id="shop-catalog" className="py-10 lg:py-14 bg-[#FAF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-stone-200/80 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Batool Market Catalogue
              </span>
              {selectedCategory && (
                <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>{selectedCategory}</span>
                  <button onClick={() => onSelectCategory(null)} className="hover:text-amber-950 font-bold ml-1">×</button>
                </span>
              )}
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              {selectedCategory ? selectedCategory : 'Explore All Collections'}
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
              Showing {filteredProducts.length} of {products.length} products available for nationwide Free COD.
            </p>
          </div>

          {/* Controls: Search, Sort, Filter Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input in Grid */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-7 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-amber-600 w-44 sm:w-56"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex items-center bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-500 mr-1.5 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-xs text-stone-700 bg-transparent focus:outline-none font-medium pr-2 cursor-pointer"
              >
                <option value="featured">Featured First</option>
                <option value="newest">New Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl text-xs font-semibold text-stone-800 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Main Layout: Sidebar Filters + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
          
          {/* Left Sidebar Filters (Desktop & Mobile Dropdown) */}
          <div className={`lg:block ${showFiltersMobile ? 'block' : 'hidden'} space-y-6`}>
            <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-6">
              
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="font-serif text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-amber-700" />
                  Filter Options
                </span>
                <button
                  onClick={resetAllFilters}
                  className="text-xs text-stone-400 hover:text-amber-800 transition-colors"
                >
                  Clear All
                </button>
              </div>

              {/* Price Range Filter */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-stone-700">Max Budget:</span>
                  <span className="font-bold text-amber-800">
                    Rs. {maxPriceFilter.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max={Math.max(highestPrice, 10000)}
                  step="500"
                  value={maxPriceFilter}
                  onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                  className="w-full accent-amber-700 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                  <span>Rs. 500</span>
                  <span>Rs. {Math.max(highestPrice, 10000).toLocaleString()}</span>
                </div>
              </div>

              {/* In Stock Only Toggle */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <label htmlFor="inStockToggle" className="text-xs font-semibold text-stone-700 cursor-pointer">
                  In-Stock Items Only
                </label>
                <input
                  type="checkbox"
                  id="inStockToggle"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 accent-amber-700 rounded cursor-pointer"
                />
              </div>

              {/* Categories Accordion/List */}
              <div className="pt-3 border-t border-stone-100">
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-2">
                  Categories ({CATEGORIES.length})
                </span>
                <div className="max-h-80 overflow-y-auto pr-1 space-y-1 text-xs">
                  <button
                    onClick={() => onSelectCategory(null)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                      selectedCategory === null
                        ? 'bg-amber-100/90 text-amber-950 font-bold'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span>All Categories</span>
                    <span className="text-[10px] text-stone-400">({products.length})</span>
                  </button>

                  {CATEGORIES.map((cat) => {
                    const count = products.filter(p => normalizeCategoryName(p.category) === cat.name || p.category === cat.name).length;
                    const isSelected = selectedCategory === cat.name;

                    return (
                      <button
                        key={cat.name}
                        onClick={() => onSelectCategory(isSelected ? null : cat.name)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-100/90 text-amber-950 font-bold'
                            : 'text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <span className="truncate pr-1">{cat.name}</span>
                        <span className="text-[10px] text-stone-400 shrink-0">
                          {count > 0 ? `(${count})` : '(0)'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Right Product Grid */}
          <div className="lg:col-span-3">
            {isLoading && products.length === 0 ? (
              <div className="text-center py-20 px-6 bg-white rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
                <Loader2 className="w-10 h-10 text-amber-700 animate-spin mx-auto" />
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Loading Products from Database...
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Connecting to shared cloud storage to fetch the live inventory.
                </p>
              </div>
            ) : fetchError && products.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white rounded-3xl border border-red-200 shadow-2xs space-y-4">
                <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Failed to Load Products
                </h3>
                <p className="text-xs text-stone-600 max-w-md mx-auto">
                  {fetchError}
                </p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-1.5 bg-[#181816] hover:bg-stone-800 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition-all shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Connection</span>
                  </button>
                )}
              </div>
            ) : products.length === 0 ? (
              /* If there are no products, show friendly empty state */
              <div className="text-center py-20 px-6 bg-white rounded-3xl border border-stone-200/90 shadow-2xs space-y-5">
                <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto">
                  <PackageOpen className="w-10 h-10 stroke-1" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                    No products available yet.
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500 mt-2 max-w-md mx-auto">
                    New items are arriving soon. Please check back shortly or browse our other collections.
                  </p>
                </div>
                {onOpenAdmin && (
                  <div className="pt-2">
                    <button
                      onClick={onOpenAdmin}
                      className="bg-[#181816] hover:bg-stone-800 text-[#FAF9F5] text-xs font-semibold py-3 px-6 rounded-xl transition-all shadow-xs"
                    >
                      Open Admin Portal & Add Products
                    </button>
                  </div>
                )}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onViewDetails={onViewDetails}
                    onOrderWhatsApp={onOrderWhatsApp}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
            ) : (
              /* Empty Search/Filter State */
              <div className="text-center py-16 px-6 bg-white rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-800">
                    {selectedCategory 
                      ? `No products found in "${selectedCategory}".` 
                      : "No products matched your criteria."}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500 mt-2 max-w-md mx-auto">
                    {searchQuery 
                      ? `We couldn't find matches for "${searchQuery}". Please check your spelling or clear filters.` 
                      : "Try adjusting your price range or clearing category filters."}
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={resetAllFilters}
                    className="bg-[#181816] hover:bg-stone-800 text-[#FAF9F5] text-xs font-semibold py-2.5 px-5 rounded-xl transition-all shadow-xs"
                  >
                    View All Products
                  </button>
                  <a
                    href={`https://wa.me/923015954967?text=${encodeURIComponent('Assalam o Alaikum Batool Market, I am looking for a specific item.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition-all shadow-xs"
                  >
                    Inquire on WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
};
