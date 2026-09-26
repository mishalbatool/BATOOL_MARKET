import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { 
  X, 
  MessageCircle, 
  ShoppingBag, 
  Truck, 
  Banknote, 
  Check, 
  Share2, 
  Layers, 
  Palette
} from 'lucide-react';
import { SafeProductImage } from './SafeProductImage';
import { getProductShareUrl } from '../services/productService';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, selectedSize?: string, selectedColor?: string) => void;
  onOrderWhatsApp: (product: Product, quantity: number, selectedSize?: string, selectedColor?: string) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onOrderWhatsApp,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.image);
      setSelectedSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : '');
      setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0] : '');
      setQuantity(1);
      setAddedToast(false);
      setCopiedLink(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const allImages = Array.isArray(product.images) && product.images.length > 0 
    ? product.images 
    : [product.image || ''];

  const stock = Number(product.stock) || 0;
  const isOutOfStock = stock <= 0 || product.status === 'out_of_stock';
  const isLowStock = !isOutOfStock && (stock <= 5 || product.status === 'low_stock');
  const price = Number(product.price) || 0;
  const hasDiscount = product.discountPrice !== undefined && product.discountPrice !== null && Number(product.discountPrice) > 0;
  const salePrice = hasDiscount ? Number(product.discountPrice) : (Number(product.salePrice) > 0 ? Number(product.salePrice) : price);
  const discountPercent = typeof product.discountPercent === 'number'
    ? product.discountPercent
    : (price > salePrice && price > 0 ? Math.round(((price - salePrice) / price) * 100) : 0);

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedSize, selectedColor);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleCopyLink = () => {
    const url = getProductShareUrl(product);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }).catch(() => {
      // Fallback
      prompt("Copy Product Link:", url);
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative bg-[#FAF9F5] border border-stone-300 w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-4">
        
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-2 text-stone-500 hover:text-stone-900 bg-white/90 hover:bg-white rounded-full shadow-md transition-all focus:outline-none"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-y-auto">
          {/* Left Column: Product Gallery & Media */}
          <div className="p-5 sm:p-6 bg-[#F5F2EA] flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-200">
            <div>
              {/* Main Media Viewport */}
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
              </div>

              {/* Thumbnails Row */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-2 scrollbar-thin">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        selectedImage === img
                          ? 'border-amber-700 ring-2 ring-amber-700/20 scale-102 shadow-xs'
                          : 'border-stone-300 opacity-70 hover:opacity-100 bg-white'
                      }`}
                    >
                      <SafeProductImage
                        src={img}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Benefits Guarantees */}
            <div className="mt-4 pt-4 border-t border-stone-300/60 grid grid-cols-2 gap-3 text-xs text-stone-600">
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

          {/* Right Column: Details, Options, & Actions */}
          <div className="p-5 sm:p-7 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Category, Status & Share */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="font-bold tracking-widest text-amber-800 uppercase bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  {product.category}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 px-2.5 py-1 rounded-md transition-colors text-[11px] font-semibold shadow-2xs"
                    title="Copy shareable product link"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-stone-600" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  {isOutOfStock ? (
                    <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Only {product.stock} left
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      In Stock ({product.stock})
                    </span>
                  )}
                </div>
              </div>

              {/* Product Title */}
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
                {product.name}
              </h1>

              {product.sku && (
                <div className="text-xs text-stone-500 font-mono">
                  SKU: {product.sku}
                </div>
              )}

              {/* Price Banner */}
              <div className="p-4 bg-stone-100 rounded-2xl border border-stone-200 flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] text-stone-500 block uppercase tracking-wider font-semibold">
                    Special Offer Price
                  </span>
                  <div className="flex items-baseline gap-3 mt-0.5">
                    <span className="font-serif text-3xl font-bold text-stone-950">
                      Rs. {salePrice.toLocaleString()}
                    </span>
                    {price > salePrice && (
                      <span className="text-sm text-stone-400 line-through">
                        Rs. {price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider block">
                    Zero Delivery Fee
                  </span>
                </div>
              </div>

              {/* Optional Sizes Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-700" />
                      <span>Select Size:</span>
                    </span>
                    <span className="text-amber-800 font-semibold">{selectedSize}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                          selectedSize === size
                            ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Colors Selector */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                    <span className="flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-amber-700" />
                      <span>Select Color:</span>
                    </span>
                    <span className="text-amber-800 font-semibold">{selectedColor}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {product.colors.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setSelectedColor(col)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                          selectedColor === col
                            ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                        }`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="pt-2 text-stone-700 text-xs sm:text-sm leading-relaxed space-y-1.5">
                <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                  Product Description
                </h3>
                <p className="whitespace-pre-line text-stone-600">
                  {product.description || product.shortDescription}
                </p>
              </div>

            </div>

            {/* Sticky Action Footer */}
            <div className="pt-4 mt-4 border-t border-stone-200 space-y-3">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => onOrderWhatsApp(product, quantity, selectedSize, selectedColor)}
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

              <p className="text-[11px] text-center text-stone-500">
                Nationwide Free Delivery • Inspect Parcel on Arrival • Cash on Delivery (COD)
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
