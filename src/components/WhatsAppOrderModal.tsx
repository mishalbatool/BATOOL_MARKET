import React, { useState, useEffect } from 'react';
import { Product, CustomerDetails } from '../types';
import { getSingleProductWhatsAppLink, WHATSAPP_NUMBER_DISPLAY } from '../utils/whatsapp';
import { loadCustomerFromStorage, saveCustomerToStorage } from '../utils/storage';
import { X, MessageCircle, Truck, CheckCircle2 } from 'lucide-react';

interface WhatsAppOrderModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  initialQuantity?: number;
}

const MAJOR_PAK_CITIES = [
  "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad",
  "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
  "Hyderabad", "Bahawalpur", "Sargodha", "Abbottabad", "Other City"
];

export const WhatsAppOrderModal: React.FC<WhatsAppOrderModalProps> = ({
  product,
  isOpen,
  onClose,
  initialQuantity = 1,
}) => {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: '',
    phone: '',
    city: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      setQuantity(initialQuantity || 1);
      const saved = loadCustomerFromStorage();
      setCustomer(saved);
    }
  }, [isOpen, initialQuantity]);

  if (!isOpen || !product) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleSendOrder = () => {
    // Save details to localStorage so they don't have to retype next time
    saveCustomerToStorage(customer);
    const link = getSingleProductWhatsAppLink(product, quantity, customer);
    window.open(link, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleDirectQuickSend = () => {
    // Send without filling form (user can fill in WhatsApp)
    const link = getSingleProductWhatsAppLink(product, quantity, customer);
    window.open(link, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const lineTotal = product.salePrice * quantity;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-[#FAF9F5] border border-stone-300 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#181816] text-[#FAF9F5] p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 fill-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Order on WhatsApp</h3>
              <p className="text-[11px] text-stone-400">Cash on Delivery · WhatsApp: {WHATSAPP_NUMBER_DISPLAY}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Product Summary Row */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
            <img
              src={product.image}
              alt={product.name}
              className="w-16 h-16 object-cover rounded-lg border border-stone-100 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-amber-700 font-semibold">{product.category}</p>
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">{product.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-stone-950">Rs. {product.salePrice.toLocaleString()}</span>
                {product.price > product.salePrice && (
                  <span className="text-xs text-stone-400 line-through">Rs. {product.price.toLocaleString()}</span>
                )}
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-stone-50">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-2 py-1 text-stone-600 hover:bg-stone-200 text-xs font-bold"
              >
                -
              </button>
              <span className="px-2.5 py-1 text-xs font-bold text-stone-900">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(product.stock || 50, quantity + 1))}
                className="px-2 py-1 text-stone-600 hover:bg-stone-200 text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Pricing Highlight Banner */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-stone-700">
              <Truck className="w-4 h-4 text-amber-600" />
              <span>Free Delivery in Pakistan</span>
            </div>
            <div className="text-right">
              <span className="text-stone-500 mr-1.5">Total:</span>
              <span className="text-base font-bold text-amber-950">Rs. {lineTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Quick Address Form for 1-Click Complete Dispatch */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                Delivery Details (Cash on Delivery)
              </span>
              <span className="text-[11px] text-stone-500">Optional · Can also fill in WhatsApp</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">Your Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={customer.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Ayesha Khan"
                  className="w-full text-xs p-2.5 bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">WhatsApp / Mobile Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={customer.phone}
                  onChange={handleInputChange}
                  placeholder="e.g. 0300 1234567"
                  className="w-full text-xs p-2.5 bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">City</label>
                <select
                  name="city"
                  value={customer.city}
                  onChange={handleInputChange}
                  className="w-full text-xs p-2.5 bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600 shadow-2xs"
                >
                  <option value="">Select City...</option>
                  {MAJOR_PAK_CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">Complete Address / Street</label>
                <input
                  type="text"
                  name="address"
                  value={customer.address}
                  onChange={handleInputChange}
                  placeholder="House #, Street, Area / Sector"
                  className="w-full text-xs p-2.5 bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1">Special Order Note (Optional)</label>
              <textarea
                name="notes"
                value={customer.notes}
                onChange={handleInputChange}
                rows={1}
                placeholder="e.g. Prefer afternoon delivery, ring bell twice..."
                className="w-full text-xs p-2 bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600 shadow-2xs resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Cash on Delivery is available across all cities and towns in Pakistan.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDirectQuickSend}
            className="w-full sm:w-auto text-xs text-stone-600 hover:text-stone-900 font-medium py-2 px-3 order-2 sm:order-1 text-center"
          >
            Direct WhatsApp Chat without Form →
          </button>

          <button
            type="button"
            onClick={handleSendOrder}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm py-3 px-6 rounded-xl transition-all shadow-sm hover:shadow order-1 sm:order-2"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Confirm & Open WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  );
};
