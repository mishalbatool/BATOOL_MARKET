import React, { useState, useEffect } from 'react';
import { CartItem, CustomerDetails } from '../types';
import { getCartWhatsAppLink } from '../utils/whatsapp';
import { loadCustomerFromStorage, saveCustomerToStorage } from '../utils/storage';
import { SafeProductImage } from './SafeProductImage';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  Truck, 
  MessageCircle, 
  ArrowRight, 
  Banknote,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onExploreShop: () => void;
}

const MAJOR_PAK_CITIES = [
  "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad",
  "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
  "Hyderabad", "Bahawalpur", "Sargodha", "Abbottabad", "Other City"
];

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onExploreShop,
}) => {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: '',
    phone: '',
    city: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      const saved = loadCustomerFromStorage();
      setCustomer(saved);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalAmount = cart.reduce((acc, item) => acc + item.product.salePrice * item.quantity, 0);
  const totalOriginal = cart.reduce((acc, item) => acc + (item.product.price || item.product.salePrice) * item.quantity, 0);
  const totalSavings = totalOriginal > totalAmount ? totalOriginal - totalAmount : 0;
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckoutWhatsApp = () => {
    saveCustomerToStorage(customer);
    const link = getCartWhatsAppLink(cart, customer);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#FAF9F5] h-full shadow-2xl flex flex-col justify-between border-l border-stone-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-800" />
            <h2 className="font-serif text-lg font-bold text-stone-900">
              Your Shopping Cart
            </h2>
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
              {totalItemsCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-xs text-stone-400 hover:text-red-600 transition-colors p-1"
                title="Clear all cart items"
              >
                Clear Cart
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-100 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Free Delivery Banner inside Cart */}
        <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-1.5 font-medium">
            <Truck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>Free Delivery across Pakistan applied!</span>
          </div>
          <span className="font-bold text-emerald-700">Rs. 0</span>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-800">
                  Your cart is empty
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-xs">
                  Discover trending cosmetics, jewellery, stitched collections, and essentials with Cash on Delivery.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onExploreShop();
                }}
                className="bg-[#181816] hover:bg-stone-800 text-[#FAF9F5] text-xs font-semibold py-2.5 px-6 rounded-xl transition-all shadow-xs"
              >
                Start Shopping Now
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="bg-white p-3 rounded-xl border border-stone-200/90 shadow-2xs flex gap-3 items-center"
              >
                {/* Product Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                  <SafeProductImage
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-amber-800 uppercase font-semibold block truncate">
                    {item.product.category}
                  </span>
                  <h4 className="text-xs font-bold text-stone-900 truncate">
                    {item.product.name}
                  </h4>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xs font-bold text-stone-900">
                      Rs. {item.product.salePrice.toLocaleString()}
                    </span>
                    {item.product.price > item.product.salePrice && (
                      <span className="text-[10px] text-stone-400 line-through">
                        Rs. {item.product.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="text-stone-300 hover:text-red-500 transition-colors"
                    aria-label={`Remove ${item.product.name} from cart`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 overflow-hidden text-xs">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="px-2 py-0.5 text-stone-600 hover:bg-stone-200"
                    >
                      -
                    </button>
                    <span className="px-2 font-bold text-stone-800 text-[11px] min-w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      className="px-2 py-0.5 text-stone-600 hover:bg-stone-200"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Area with WhatsApp Checkout */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 bg-white border-t border-stone-200 space-y-3">
            
            {/* Delivery address toggle */}
            <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="w-full flex items-center justify-between p-2.5 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium transition-colors"
              >
                <span>Add Delivery Address (Optional)</span>
                {showAddressForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAddressForm && (
                <div className="p-3 bg-white space-y-2 border-t border-stone-100 animate-in slide-in-from-top-2">
                  <input
                    type="text"
                    placeholder="Your Full Name"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="w-full p-2 text-xs bg-stone-50 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="tel"
                      placeholder="WhatsApp Mobile #"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full p-2 text-xs bg-stone-50 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600"
                    />
                    <select
                      value={customer.city}
                      onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                      className="w-full p-2 text-xs bg-stone-50 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600"
                    >
                      <option value="">Select City</option>
                      {MAJOR_PAK_CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Complete Street Address & Area"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    className="w-full p-2 text-xs bg-stone-50 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600"
                  />
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-stone-600 pt-1">
              <div className="flex justify-between">
                <span>Subtotal ({totalItemsCount} items):</span>
                <span className="font-semibold text-stone-900">Rs. {totalAmount.toLocaleString()}</span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Store Discount:</span>
                  <span className="font-semibold">-Rs. {totalSavings.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charges:</span>
                <span className="font-bold text-emerald-700 uppercase text-[11px]">Free Delivery</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold text-stone-800">Cash on Delivery (COD)</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
                <span>Total Payable:</span>
                <span className="text-base font-serif text-amber-950">Rs. {totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckoutWhatsApp}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-98"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Checkout via WhatsApp</span>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500 text-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Order will open pre-filled on WhatsApp. No advance card needed.</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
