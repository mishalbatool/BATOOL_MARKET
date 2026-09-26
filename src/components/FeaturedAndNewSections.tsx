import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { Flame, ArrowRight, PackageOpen, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface SectionProps {
  products: Product[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onViewDetails: (product: Product) => void;
  onOrderWhatsApp: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onViewAll: () => void;
}

export const FeaturedProducts: React.FC<SectionProps> = ({
  products,
  isLoading = false,
  error = null,
  onRetry,
  onViewDetails,
  onOrderWhatsApp,
  onAddToCart,
  onViewAll,
}) => {
  // Loading state
  if (isLoading && products.length === 0) {
    return (
      <section className="py-12 lg:py-16 bg-[#FAF9F5] border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12 bg-white rounded-3xl border border-stone-200 shadow-2xs space-y-3">
          <Loader2 className="w-8 h-8 text-amber-700 animate-spin mx-auto" />
          <p className="text-sm font-medium text-stone-700">Loading live products from database...</p>
        </div>
      </section>
    );
  }

  // Error state
  if (error && products.length === 0) {
    return (
      <section className="py-12 lg:py-16 bg-[#FAF9F5] border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-10 bg-white rounded-3xl border border-red-200 shadow-2xs space-y-3">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-stone-900">Database Connection Notice</h3>
          <p className="text-xs text-stone-600 max-w-md mx-auto">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-stone-900 text-white px-4 py-2 rounded-xl hover:bg-stone-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Fetching</span>
            </button>
          )}
        </div>
      </section>
    );
  }

  // If no products exist overall
  if (products.length === 0) {
    return (
      <section className="py-12 lg:py-16 bg-[#FAF9F5] border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-10 bg-white rounded-3xl border border-stone-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto">
            <PackageOpen className="w-6 h-6 stroke-1" />
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
            No products available yet.
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
            Our online store catalogue is being updated with fresh arrivals and essentials.
          </p>
        </div>
      </section>
    );
  }

  const displayProducts = products.slice(0, 4);

  return (
    <section className="py-12 lg:py-16 bg-[#FAF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>Handpicked Highlights</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight">
              Featured Collections
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm mt-1">
              Top trending items loved by our Pakistani shoppers with nationwide Free Delivery.
            </p>
          </div>

          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-stone-900 hover:text-amber-700 transition-colors group cursor-pointer"
          >
            <span>View All Products</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={onViewDetails}
              onOrderWhatsApp={onOrderWhatsApp}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>

      </div>
    </section>
  );
};
