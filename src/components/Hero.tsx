import React from 'react';
import { ShoppingBag, MessageCircle, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { WHATSAPP_NUMBER_DISPLAY } from '../utils/whatsapp';

interface HeroProps {
  onShopNow: () => void;
  onExploreCategories: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onShopNow, onExploreCategories }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F5F2EA] via-[#FAF9F5] to-[#FAF9F5] py-10 lg:py-16 border-b border-stone-200/60">
      {/* Subtle gold glow & decorative elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-stone-300/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/70 border border-amber-300/60 text-amber-900 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Pakistani Online Lifestyle Market</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-stone-900 font-bold tracking-tight leading-[1.15]">
              Everything You Love, <br className="hidden sm:inline" />
              <span className="italic font-normal font-serif text-amber-700">All in One Place</span>
            </h1>

            <p className="text-stone-600 text-sm sm:text-base lg:text-lg max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              At Batool Market, we make online shopping simple and convenient by bringing a wide variety of fashion, beauty, home, lifestyle, kids, electronics, and everyday essentials together in one place. Shop with ease, order through WhatsApp, and enjoy Cash on Delivery with Free Delivery across Pakistan.
            </p>

            {/* Pakistan Store Trust Highlights */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1 text-xs text-stone-700 font-medium">
              <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-md border border-stone-200/70 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cash on Delivery (COD)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-md border border-stone-200/70 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                <span>100% Free Nationwide Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-md border border-stone-200/70 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Instant WhatsApp Orders</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-3">
              <button
                onClick={onShopNow}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#181816] hover:bg-stone-800 text-[#FAF9F5] px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow group"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Shop All Collections</span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href={`https://wa.me/923015954967?text=${encodeURIComponent('Assalam o Alaikum Batool Market, I would like to explore products and place an order on WhatsApp.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Order on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Right Hero Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Luxury Image Frame */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-white aspect-4/5 bg-stone-100">
                <img
                  src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80"
                  alt="Batool Market Luxury Festive Collection"
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Overlay Badge */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-amber-800">
                    Festive 2026 Collection
                  </span>
                </div>

                {/* Floating Bottom Card: Cash on Delivery & Free Delivery */}
                <div className="absolute bottom-4 inset-x-4 bg-stone-950/90 backdrop-blur-md text-white p-3.5 rounded-xl border border-white/10 shadow-lg flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">
                      Pakistan Nationwide
                    </p>
                    <p className="text-xs font-semibold text-white">
                      Free Home Delivery & COD
                    </p>
                  </div>
                  <button
                    onClick={onExploreCategories}
                    className="text-xs font-semibold text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 group"
                  >
                    <span>Categories</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Secondary decorative badge */}
              <div className="absolute -bottom-4 -left-4 hidden sm:block bg-amber-50 border border-amber-200/90 rounded-xl p-3 shadow-md">
                <p className="text-[11px] font-bold text-amber-950">31+ Categories</p>
                <p className="text-[10px] text-stone-600">Curated Reseller Quality</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
