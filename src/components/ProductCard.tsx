import React from 'react';
import { Product } from '../types';
import { ShoppingBag, MessageCircle, Eye, Star } from 'lucide-react';
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
  const isOutOfStock = product.stock <= 0 || product.status === 'out_of_stock';
  const isLowStock = !isOutOfStock && (product.stock <= 5 || product.status === 'low_stock');
  const discountPercent = product.discountPercent ?? (
    product.price > product.salePrice
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : 0
  );

  return (
    <div className="group relative bg-white rounded-2xl border border-stone-200/90 hover:border-amber-400 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-lg">
      {/* Top Image Container */}
      <div className="relative w-full aspect-square bg-[#F5F2EA] overflow-hidden">
        <SafeProductImage
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108 ${
            isOutOfStock ? 'grayscale opacity-75' : ''
          }`}
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.salePrice < product.price && (
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

        {/* Stock Status Pill */}
        <div className="absolute top-2.5 right-2.5 z-10">
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
            onClick={() => onViewDetails(product)}
            className="bg-white/95 hover:bg-white text-stone-900 text-xs font-semibold py-2 px-3.5 rounded-full shadow-md transition-transform transform scale-95 group-hover:scale-100 flex items-center gap-1.5"
            aria-label={`View details of ${product.name}`}
          >
            <Eye className="w-3.5 h-3.5 text-amber-700" />
            <span>Quick View</span>
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
            <div className="flex items-center gap-1 shrink-0 text-amber-600">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span className="font-bold text-stone-700">{product.rating ?? 5.0}</span>
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
        </div>

        {/* Price & Action Area */}
        <div className="pt-3 mt-3 border-t border-stone-100">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-serif text-lg font-bold text-stone-950">
              Rs. {product.salePrice.toLocaleString()}
            </span>
            {product.price > product.salePrice && (
              <span className="text-xs text-stone-400 line-through">
                Rs. {product.price.toLocaleString()}
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
