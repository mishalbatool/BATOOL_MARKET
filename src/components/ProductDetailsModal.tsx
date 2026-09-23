import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { 
  X, 
  MessageCircle, 
  ShoppingBag, 
  Truck, 
  Banknote, 
  ShieldCheck, 
  Star, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { SafeProductImage } from './SafeProductImage';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOrderWhatsApp: (product: Product, quantity: number) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onOrderWhatsApp,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.image);
      setQuantity(1);
      setAddedToast(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const allImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image];

  const isOutOfStock = product.stock <= 0 || product.status === 'out_of_stock';
  const isLowStock = !isOutOfStock && (product.stock <= 5 || product.status === 'low_stock');
  const discountPercent = product.discountPercent ?? (
    product.price > product.salePrice
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : 0
  );

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-[#FAF9F5] border border-stone-300 w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 p-2 text-stone-500 hover:text-stone-900 bg-white/80 hover:bg-white rounded-full shadow-sm transition-all focus:outline-none"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-y-auto">
          {/* Left Column: Product Gallery */}
          <div className="p-6 bg-[#F5F2EA] flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-200">
            <div>
              {/* Main Image */}
              <div className="w-full aspect-square rounded-2xl overflow-hidden border border-stone-300/80 bg-white relative shadow-inner">
                <SafeProductImage
                  src={selectedImage || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                />

                {discountPercent > 0 && (
                  <span className="absolute top-3 left-3 bg-amber-700 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-xs">
                    {discountPercent}% OFF
                  </span>
                )}

                {product.newArrival && (
                  <span className="absolute top-3 right-3 bg-stone-900 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-xs">
                    NEW ARRIVAL
                  </span>
                )}
              </div>

              {/* Thumbnails if multiple images */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        selectedImage === img
                          ? 'border-amber-700 ring-2 ring-amber-700/20 scale-102'
                          : 'border-stone-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <SafeProductImage
                        src={img}
                        alt={`${product.name} preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Guarantees Pill */}
            <div className="mt-6 pt-4 border-t border-stone-300/60 grid grid-cols-2 gap-3 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Free Delivery in Pakistan</span>
              </div>
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Cash on Delivery (COD)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Actions */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Category & Status & SKU */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="font-bold tracking-widest text-amber-800 uppercase bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  {product.category}
                </span>

                <div className="flex items-center gap-2">
                  {product.sku && (
                    <span className="text-stone-400 font-mono text-[11px]">
                      SKU: {product.sku}
                    </span>
                  )}
                  {isOutOfStock ? (
                    <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Only {product.stock} items left
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      In Stock ({product.stock} units)
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className="font-bold text-stone-700">{product.rating ?? 5.0}</span>
                <span className="text-stone-400">({product.reviewsCount ?? 1} customer reviews)</span>
                <span className="text-stone-300">|</span>
                <span className="text-stone-500">ID: <span className="font-mono text-stone-700">{product.id}</span></span>
              </div>

              {/* Price Banner */}
              <div className="p-4 bg-stone-100 rounded-2xl border border-stone-200/90 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-stone-500 block">Current Special Price:</span>
                  <div className="flex items-baseline gap-3">
                    <span className="font-serif text-3xl font-bold text-stone-950">
                      Rs. {product.salePrice.toLocaleString()}
                    </span>
                    {product.price > product.salePrice && (
                      <span className="text-sm text-stone-400 line-through">
                        Rs. {product.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider block">
                    Zero Delivery Fee
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="pt-2 text-stone-700 text-xs sm:text-sm leading-relaxed space-y-2">
                <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                  Product Details
                </h3>
                <p className="whitespace-pre-line text-stone-600">
                  {product.description || product.shortDescription}
                </p>
              </div>

              {/* Security Points */}
              <div className="space-y-1.5 pt-2 text-xs text-stone-600 border-t border-stone-200">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Cash on Delivery available nationwide in all cities of Pakistan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Inspect your parcel safely upon arrival</span>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="pt-6 mt-6 border-t border-stone-200 space-y-3">
              {/* Quantity selector */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">Quantity:</span>
                <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden shadow-2xs">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-30 text-sm font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-xs font-bold text-stone-900 min-w-10 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={isOutOfStock || (product.stock > 0 && quantity >= product.stock)}
                    className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-30 text-sm font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => onOrderWhatsApp(product, quantity)}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-98"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Order on WhatsApp</span>
                </button>

                <button
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                  className={`w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-98 ${
                    isOutOfStock
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      : addedToast
                      ? 'bg-amber-700 text-white'
                      : 'bg-[#181816] hover:bg-stone-800 text-[#FAF9F5]'
                  }`}
                >
                  {addedToast ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-center text-stone-400">
                Direct WhatsApp booking available 24/7 with zero advance payment.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
