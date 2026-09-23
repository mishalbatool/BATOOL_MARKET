import React from 'react';
import { Sparkles, HeartHandshake, ShieldCheck, Truck, Banknote, ArrowRight } from 'lucide-react';
import { WHATSAPP_NUMBER_DISPLAY } from '../utils/whatsapp';

interface AboutSectionProps {
  onShopNow: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ onShopNow }) => {
  return (
    <section className="py-14 sm:py-20 bg-[#FAF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-100/70 border border-amber-300/60 text-amber-900 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Our Journey & Heritage</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 leading-tight">
            About <span className="text-amber-800 italic">Batool Market</span>
          </h1>

          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            At Batool Market, we make online shopping simple and convenient by bringing a wide variety of fashion, beauty, home, lifestyle, kids, electronics, and everyday essentials together in one place. Shop with ease, order through WhatsApp, and enjoy Cash on Delivery with Free Delivery across Pakistan.
          </p>
        </div>

        {/* Story Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-5 text-stone-700 text-sm leading-relaxed">
            <h3 className="font-serif text-2xl font-bold text-stone-900">
              Your Trusted Independent Pakistani Online Shopping Destination
            </h3>
            <p>
              At <strong>Batool Market</strong>, we believe online shopping should be simple, convenient, and accessible to everyone across Pakistan. We bring together a wide variety of carefully selected products, from fashion and beauty to jewellery, home essentials, kids’ products, electronics, accessories, kitchenware, perfumes, and much more.
            </p>
            <p>
              We believe shopping online should be <strong>easy, transparent, and hassle-free</strong>. That’s why we keep the ordering process simple — browse our collections, choose your favorite products, and place your order directly through <strong>WhatsApp</strong>. With <strong>Cash on Delivery (COD)</strong> and <strong>Free Delivery all over Pakistan</strong>, you can shop with ease and have your order delivered right to your doorstep.
            </p>

            <div className="pt-2 grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl border border-stone-200">
                <p className="font-serif text-2xl font-bold text-amber-900">31+</p>
                <p className="text-xs text-stone-500 mt-0.5">Specialized Categories</p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-stone-200">
                <p className="font-serif text-2xl font-bold text-amber-900">100%</p>
                <p className="text-xs text-stone-500 mt-0.5">Free Nationwide Delivery</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-white aspect-4/3 bg-stone-200">
              <img
                src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80"
                alt="Batool Market Craftsmanship"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-stone-900">Personalized Customer Care</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              We treat every customer like family. Need real photos of unstitched suits or measurement details? Simply send us a message on WhatsApp for instant assistance.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-stone-900">Zero Risk Cash on Delivery</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Never worry about advance payments or credit card security. You only pay after you receive your package from our courier partner.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-stone-900">Nationwide Free Shipping</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Whether you are located in Karachi, Lahore, Islamabad, Peshawar, Quetta, or remote districts, our delivery is 100% free with no hidden charges.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 text-center">
          <button
            onClick={onShopNow}
            className="inline-flex items-center gap-2 bg-[#181816] hover:bg-stone-800 text-[#FAF9F5] font-bold py-3.5 px-8 rounded-xl text-sm transition-all shadow-sm group"
          >
            <span>Explore Batool Market Collections</span>
            <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </section>
  );
};
