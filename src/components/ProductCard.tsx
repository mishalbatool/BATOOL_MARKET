import React from 'react';
import { Product } from '../types';
import { ShoppingBag, MessageCircle, Eye, Star, Video } from 'lucide-react';
import { SafeProductImage } from './SafeProductImage';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onOrderWhatsApp: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
  onOrderWhatsApp,
  onAddToCart,
}) => {
  const isOutOfStock = (product.stock ?? 0) <= 0 || product.status === 'out_of_stock';
  const isLowStock = !isOutOfStock && ((product.stock ?? 0) <= 5 || product.status === 'low_stock');
  const price = Number(product.price) || 0;
  const salePrice = Number(product.salePrice) || price;
  const discountPercent = typeof product.discountPercent === 'number'
    ? product.discountPercent
    : (price > salePrice && price > 0 ? Math.round(((price - salePrice) / price) * 100) : 0);

  const reviewsCount = product.reviewsCount ?? (product.reviews?.length || 1);
  const ratingValue = Number(product.rating ?? 5.0).toFixed(1);

  return (
    <div className="group relative bg-white rounded-2xl border border-stone-200/90 hover:border-amber-400 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      {/* Top Image Container */}
      <div 
        onClick={() => onViewDetails(product)}
        className="relative w-full aspect-square bg-[#F5F2EA] overflow-hidden cursor-pointer"
      >
        <SafeProductImage
          src={product.image || product.images?.[0] || ''}
          alt={product.name || 'Batool Market Product'}
          className={`w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 ${
            isOutOfStock ? 'grayscale opacity-75' : ''
          }`}
          loading="lazy"
        />

        {/* Badges Overlay Top-Left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
          {salePrice < price && (
            <span className="bg-amber-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs tracking-wider uppercase">
              {discountPercent > 0 ? `${discountPercent}% OFF` : 'SALE'}
            </span>
          )}
          {product.newArrival && (
            <span className="bg-stone-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs tracking-wider uppercase">
              New
            </span>
          )}
          {product.featured && !product.newArrival && (
            <span className="bg-amber-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs tracking-wider uppercase">
              Featured
            </span>
          )}
        </div>

        {/* Video Badge Indicator if product has video */}
        {Boolean(product.video) && (
          <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none">
            <span className="bg-stone-900/85 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs border border-white/20">
              <Video className="w-3 h-3 text-amber-400" />
              <span>Video</span>
            </span>
          </div>
        )}

        {/* Stock Status Pill Top-Right */}
        <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
          {isOutOfStock ? (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
              Only {product.stock} Left
            </span>
          ) : null}
        </div>

        {/* Quick View Button on Hover */}
        <div className="absolute inset-0 bg-stone-900/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
            className="bg-white/95 hover:bg-white text-stone-900 text-xs font-semibold py-2 px-3.5 rounded-full shadow-md transition-transform transform scale-95 group-hover:scale-100 flex items-center gap-1.5 active:scale-95"
            aria-label={`View details of ${product.name}`}
          >
            <Eye className="w-3.5 h-3.5 text-amber-700" />
            <span>View Product</span>
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between gap-1 text-[11px] text-stone-500 mb-1.5">
            <span className="truncate uppercase tracking-wider font-semibold text-amber-800">
              {product.category}
            </span>
            <div className="flex items-center gap-1 shrink-0 text-amber-600" title={`${ratingValue} stars out of ${reviewsCount} reviews`}>
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span className="font-bold text-stone-700">{ratingValue}</span>
              <span className="text-[10px] text-stone-400">({reviewsCount})</span>
            </div>
          </div>

          {/* Title */}
          <h3 
            onClick={() => onViewDetails(product)}
            className="font-serif text-sm font-bold text-stone-900 line-clamp-2 hover:text-amber-800 cursor-pointer transition-colors leading-snug"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Description snippet */}
          <p className="text-stone-500 text-xs line-clamp-1 mt-1 font-light">
            {product.shortDescription || product.description}
          </p>

          {/* Sizes or Colors preview pills if available */}
          {(product.sizes && product.sizes.length > 0) || (product.colors && product.colors.length > 0) ? (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px] text-stone-600">
              {product.sizes && product.sizes.length > 0 && (
                <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600 font-medium">
                  {product.sizes.slice(0, 3).join(', ')}{product.sizes.length > 3 ? '...' : ''}
                </span>
              )}
              {product.colors && product.colors.length > 0 && (
                <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                  {product.colors.length} {product.colors.length === 1 ? 'Color' : 'Colors'}
                </span>
              )}
            </div>
          ) : null}
        </div>

        {/* Price & Action Area */}
        <div className="pt-3 mt-3 border-t border-stone-100">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-serif text-lg font-bold text-stone-950">
              Rs. {salePrice.toLocaleString()}
            </span>
            {price > salePrice && (
              <span className="text-xs text-stone-400 line-through">
                Rs. {price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onOrderWhatsApp(product)}
              className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-2.5 rounded-xl transition-all shadow-2xs hover:shadow-xs active:scale-98"
              title="Order this product directly on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white shrink-0" />
              <span className="truncate">WhatsApp</span>
            </button>

            <button
              onClick={() => onAddToCart(product)}
              disabled={isOutOfStock}
              className={`inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-2.5 rounded-xl transition-all shadow-2xs active:scale-98 ${
                isOutOfStock
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-[#181816] hover:bg-stone-800 text-[#FAF9F5]'
              }`}
              title={isOutOfStock ? "Product is out of stock" : "Add to shopping cart"}
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{isOutOfStock ? 'Sold Out' : 'Add'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
