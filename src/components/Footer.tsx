import React from 'react';
import { ActivePage, CategoryName } from '../types';
import { WHATSAPP_NUMBER_DISPLAY } from '../utils/whatsapp';
import { Logo } from './Logo';
import { 
  ShoppingBag, 
  MessageCircle, 
  Truck, 
  Banknote, 
  ShieldCheck, 
  Lock,
  Heart
} from 'lucide-react';

interface FooterProps {
  setActivePage: (page: ActivePage) => void;
  onSelectCategory: (category: CategoryName | null) => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  setActivePage,
  onSelectCategory,
  onOpenAdmin,
}) => {
  const handleNav = (page: ActivePage) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCatClick = (cat: CategoryName) => {
    onSelectCategory(cat);
    setActivePage('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#141412] text-[#E5E2D9] pt-14 pb-8 border-t border-[#26241E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-12 border-b border-stone-800">
          
          {/* Brand Column (Col 1-4) */}
          <div className="lg:col-span-4 space-y-4">
            <button
              onClick={() => handleNav('home')}
              className="text-left group flex items-center focus:outline-none"
              aria-label="Batool Market Home"
            >
              <Logo variant="dark" size="lg" />
            </button>

            <p className="text-stone-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              “Your trusted online shopping destination.” Curated fashion, jewellery, unstitched & stitched collections, and home essentials with nationwide Free Delivery & Cash on Delivery across Pakistan.
            </p>

            <div className="pt-2">
              <a
                href={`https://wa.me/923015954967?text=${encodeURIComponent('Assalam o Alaikum Batool Market, I would like to order or ask a question.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Quick Links (Col 5-6) */}
          <div className="lg:col-span-2 space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] font-sans">
              Quick Links
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button onClick={() => handleNav('home')} className="hover:text-amber-400 transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('shop')} className="hover:text-amber-400 transition-colors">
                  Shop All Products
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('categories')} className="hover:text-amber-400 transition-colors">
                  Browse 31 Categories
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('about')} className="hover:text-amber-400 transition-colors">
                  About Batool Market
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('contact')} className="hover:text-amber-400 transition-colors">
                  Contact & Support
                </button>
              </li>
            </ul>
          </div>

          {/* Popular Categories (Col 7-9) */}
          <div className="lg:col-span-3 space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] font-sans">
              Featured Departments
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button onClick={() => handleCatClick("Women's Unstitched")} className="hover:text-amber-400 transition-colors text-left">
                  Women's Unstitched Suits
                </button>
              </li>
              <li>
                <button onClick={() => handleCatClick("Cosmetics")} className="hover:text-amber-400 transition-colors text-left">
                  Cosmetics & Lipsticks
                </button>
              </li>
              <li>
                <button onClick={() => handleCatClick("Jewellery")} className="hover:text-amber-400 transition-colors text-left">
                  Royal Kundan Jewellery
                </button>
              </li>
              <li>
                <button onClick={() => handleCatClick("Women's Handbags")} className="hover:text-amber-400 transition-colors text-left">
                  Luxury Handbags & Totes
                </button>
              </li>
              <li>
                <button onClick={() => handleCatClick("Perfumes")} className="hover:text-amber-400 transition-colors text-left">
                  Long-lasting Oriental Perfumes
                </button>
              </li>
              <li>
                <button onClick={() => handleCatClick("Home Decor")} className="hover:text-amber-400 transition-colors text-left">
                  Home Decor & Accents
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Support & Trust (Col 10-12) */}
          <div className="lg:col-span-3 space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] font-sans">
              Customer Support & Delivery
            </h4>
            <ul className="space-y-2.5 text-stone-400">
              <li className="flex items-center gap-2 text-stone-300">
                <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Free Delivery All Over Pakistan</span>
              </li>
              <li className="flex items-center gap-2 text-stone-300">
                <Banknote className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cash on Delivery (Pay at Door)</span>
              </li>
              <li className="flex items-center gap-2 text-stone-300">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant WhatsApp Support</span>
              </li>
              <li className="flex items-center gap-2 text-stone-300">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Quality Product</span>
              </li>
            </ul>

            {/* Social Media placeholders */}
            <div className="pt-2">
              <p className="text-[11px] text-stone-500 mb-1.5">Follow Our Updates:</p>
              <div className="flex items-center gap-2 text-stone-400">
                <span className="text-xs px-2.5 py-1 bg-stone-900 rounded border border-stone-800 hover:text-white transition-colors cursor-pointer">
                  Instagram
                </span>
                <span className="text-xs px-2.5 py-1 bg-stone-900 rounded border border-stone-800 hover:text-white transition-colors cursor-pointer">
                  Facebook
                </span>
                <a
                  href="https://www.tiktok.com/@easyshoping.official512?is_from_webapp=1&sender_device=pc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2.5 py-1 bg-stone-900 rounded border border-stone-800 hover:text-white hover:border-stone-700 transition-colors inline-block"
                >
                  TikTok
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            <p>© 2026 Batool Market. All Rights Reserved.</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] text-stone-600">Pakistan Online Shopping</span>
            <span>·</span>
            {/* Discreet admin entry point */}
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-300 transition-colors"
              title="Store Owner Admin Portal"
            >
              <Lock className="w-3 h-3" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
