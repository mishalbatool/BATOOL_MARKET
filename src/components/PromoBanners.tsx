import React from 'react';
import { Truck, MessageCircle, ArrowRight, ShieldCheck, Banknote } from 'lucide-react';
import { WHATSAPP_NUMBER_DISPLAY } from '../utils/whatsapp';

interface PromoBannerProps {
  onShopNow: () => void;
}

export const FreeDeliveryBanner: React.FC<PromoBannerProps> = ({ onShopNow }) => {
  return (
    <section className="py-8 bg-gradient-to-r from-stone-900 via-[#1F1E1A] to-stone-900 text-white relative overflow-hidden border-y border-amber-500/20">
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-amber-500/10 blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 mx-auto md:mx-0">
              <Truck className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <span className="text-amber-400 text-xs font-bold uppercase tracking-widest block">
                Exclusive Nationwide Offer
              </span>
              <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold mt-0.5">
                Free Delivery All Over Pakistan
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-xl">
                No delivery charges on any order! Plus inspect your parcel at your doorstep with Cash on Delivery.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onShopNow}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-6 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-md hover:shadow-lg"
            >
              <span>Shop Collections</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export const WhatsAppShoppingBanner: React.FC = () => {
  return (
    <section className="py-10 bg-[#FAF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-emerald-900 via-stone-900 to-emerald-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-emerald-800/40">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <MessageCircle className="w-3.5 h-3.5 fill-emerald-300" />
              <span>Personalized Concierge Shopping</span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
              Shop Easily — Order Directly on WhatsApp
            </h3>

            <p className="text-stone-200 text-xs sm:text-sm leading-relaxed">
              Enjoy a simple and convenient shopping experience at Batool Market. Browse our carefully selected collection, choose your favorite products, and place your order directly through WhatsApp. We’ll handle the rest and deliver your order right to your doorstep.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-300 pt-2">
              <div className="flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-400" />
                <span>Cash on Delivery</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>Nationwide Shipping</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Customer Support 24/7</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href={`https://wa.me/923015954967?text=${encodeURIComponent('Assalam o Alaikum Batool Market, I would like assistance with choosing products and placing an order.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold px-7 py-3.5 rounded-xl text-sm transition-all shadow-md"
              >
                <MessageCircle className="w-4 h-4 fill-stone-950" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Decorative WhatsApp bubble icon */}
          <div className="hidden lg:block absolute right-8 bottom-6 opacity-15 pointer-events-none">
            <MessageCircle className="w-72 h-72 fill-white" />
          </div>
        </div>
      </div>
    </section>
  );
};
