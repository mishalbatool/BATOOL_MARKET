import React, { useState } from 'react';
import { ShoppingBag, Search, Menu, X, MessageCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { ActivePage, CategoryName } from '../types';
import { WHATSAPP_NUMBER_DISPLAY } from '../utils/whatsapp';
import { Logo } from './Logo';

interface HeaderProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  cartCount: number;
  openCart: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  selectedCategory: CategoryName | null;
  onSelectCategory: (cat: CategoryName | null) => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  setActivePage,
  cartCount,
  openCart,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onOpenAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleNavClick = (page: ActivePage) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit(searchQuery);
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-2 text-stone-700 hover:text-stone-900 rounded-md focus:outline-none"
              aria-label="Open mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand / Logo */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavClick('home')}
              className="text-left group flex items-center focus:outline-none"
              aria-label="Batool Market Home"
            >
              <Logo variant="light" size="md" />
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8">
            <button
              onClick={() => handleNavClick('home')}
              className={`text-sm font-medium tracking-wide transition-colors py-1 relative ${
                activePage === 'home'
                  ? 'text-stone-950 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-600'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('shop')}
              className={`text-sm font-medium tracking-wide transition-colors py-1 relative ${
                activePage === 'shop'
                  ? 'text-stone-950 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-600'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              Shop
            </button>
            <button
              onClick={() => handleNavClick('categories')}
              className={`text-sm font-medium tracking-wide transition-colors py-1 relative ${
                activePage === 'categories'
                  ? 'text-stone-950 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-600'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className={`text-sm font-medium tracking-wide transition-colors py-1 relative ${
                activePage === 'about'
                  ? 'text-stone-950 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-600'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              About
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className={`text-sm font-medium tracking-wide transition-colors py-1 relative ${
                activePage === 'contact'
                  ? 'text-stone-950 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-600'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              Contact
            </button>
          </nav>

          {/* Right Action Icons: Search, WhatsApp Direct, Cart */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Search Box / Toggle */}
            <div className="relative hidden md:block">
              <div className="flex items-center border border-stone-300 rounded-full px-3 py-1.5 bg-white shadow-xs focus-within:border-amber-600 focus-within:ring-1 focus-within:ring-amber-600 transition-all w-52 lg:w-64">
                <Search className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyPress}
                  className="w-full text-xs text-stone-800 placeholder-stone-400 bg-transparent focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      if (activePage === 'shop') onSearchSubmit('');
                    }}
                    className="text-xs text-stone-400 hover:text-stone-600 ml-1"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Search Button */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-stone-700 hover:text-stone-900 rounded-full hover:bg-stone-100 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* WhatsApp Quick Order Direct Button */}
            <a
              href={`https://wa.me/923015954967?text=${encodeURIComponent('Assalam o Alaikum Batool Market, I would like to order a product.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-full transition-all shadow-xs hover:shadow-sm"
              title="Order on WhatsApp: 03015954967"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>WhatsApp Order</span>
            </a>

            {/* Cart Icon Button */}
            <button
              onClick={openCart}
              className="relative p-2.5 text-stone-800 hover:text-stone-950 rounded-full hover:bg-stone-200/60 transition-colors focus:outline-none"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-amber-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Input expander */}
        {isSearchOpen && (
          <div className="md:hidden pb-3 pt-1">
            <div className="flex items-center border border-amber-600 rounded-lg px-3 py-2 bg-white shadow-xs">
              <Search className="w-4 h-4 text-amber-700 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search products or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSearchSubmit(searchQuery);
                    setIsSearchOpen(false);
                  }
                }}
                autoFocus
                className="w-full text-sm text-stone-800 placeholder-stone-400 bg-transparent focus:outline-none"
              />
              <button
                onClick={() => {
                  onSearchSubmit(searchQuery);
                  setIsSearchOpen(false);
                }}
                className="bg-stone-900 text-white text-xs px-2.5 py-1 rounded font-medium ml-2"
              >
                Find
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#FAF9F5] shadow-2xl z-10 border-r border-stone-200 p-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <button
                onClick={() => handleNavClick('home')}
                className="text-left group focus:outline-none"
                aria-label="Batool Market Home"
              >
                <Logo variant="light" size="sm" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-stone-500 hover:text-stone-800 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <div className="py-6 space-y-3">
              <button
                onClick={() => handleNavClick('home')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors ${
                  activePage === 'home' ? 'bg-amber-100/80 text-amber-900 font-semibold' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span>Home</span>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </button>
              <button
                onClick={() => handleNavClick('shop')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors ${
                  activePage === 'shop' ? 'bg-amber-100/80 text-amber-900 font-semibold' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span>Shop All Products</span>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </button>
              <button
                onClick={() => handleNavClick('categories')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors ${
                  activePage === 'categories' ? 'bg-amber-100/80 text-amber-900 font-semibold' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span>All 31 Categories</span>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </button>
              <button
                onClick={() => handleNavClick('about')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors ${
                  activePage === 'about' ? 'bg-amber-100/80 text-amber-900 font-semibold' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span>About Batool Market</span>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </button>
              <button
                onClick={() => handleNavClick('contact')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors ${
                  activePage === 'contact' ? 'bg-amber-100/80 text-amber-900 font-semibold' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span>Customer Support & Contact</span>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </button>
            </div>

            {/* Pakistan COD badge in mobile menu */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 my-2 text-xs text-amber-950 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Shop With Trust in Pakistan</span>
              </div>
              <p className="text-stone-600 text-[11px] leading-relaxed">
                🚚 Free delivery on all orders nationwide. Pay cash when your parcel reaches your doorstep.
              </p>
            </div>

            {/* Quick WhatsApp Action Button in Drawer */}
            <div className="pt-4 mt-auto border-t border-stone-200">
              <a
                href={`https://wa.me/923015954967?text=${encodeURIComponent('Assalam o Alaikum Batool Market, I would like to place an order.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-md"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>Chat on WhatsApp</span>
              </a>

              {/* Discreet admin portal button */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
                >
                  Admin Portal Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
