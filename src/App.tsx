import React, { useState, useEffect, useMemo } from 'react';
import { Product, CartItem, CategoryName, ActivePage } from './types';
import { 
  loadProductsFromStorage, 
  saveProductsToStorage, 
  loadCartFromStorage, 
  saveCartToStorage
} from './utils/storage';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Benefits } from './components/Benefits';
import { CategorySection } from './components/CategorySection';
import { FeaturedProducts, NewArrivalsSection } from './components/FeaturedAndNewSections';
import { FreeDeliveryBanner, WhatsAppShoppingBanner } from './components/PromoBanners';
import { WhyChooseUs } from './components/WhyChooseUs';
import { ProductGrid } from './components/ProductGrid';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { CartDrawer } from './components/CartDrawer';
import { WhatsAppOrderModal } from './components/WhatsAppOrderModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { Check } from 'lucide-react';

export default function App() {
  // 1. Core State
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryName | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Modals & Drawers
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [whatsAppModalProduct, setWhatsAppModalProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [toastText, setToastText] = useState<string | null>(null);

  // Initialize from storage
  useEffect(() => {
    const loadedProducts = loadProductsFromStorage();
    setProducts(loadedProducts);

    const loadedCart = loadCartFromStorage();
    setCart(loadedCart);
  }, []);

  // Sync cart changes to storage
  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  // Toast trigger
  const triggerToast = (msg: string) => {
    setToastText(msg);
    setTimeout(() => {
      setToastText(null);
    }, 2500);
  };

  // Product Counts by category for badge indicators
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    triggerToast(`Added "${product.name}" to cart`);
  };

  const handleUpdateCartQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    triggerToast('Item removed from cart');
  };

  const handleClearCart = () => {
    setCart([]);
    triggerToast('Cart cleared');
  };

  const totalCartCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Navigation handlers
  const handleSelectCategory = (cat: CategoryName | null) => {
    setSelectedCategory(cat);
    setActivePage('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
    setActivePage('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShopNow = () => {
    setSelectedCategory(null);
    setActivePage('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreCategories = () => {
    setActivePage('categories');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // WhatsApp Single Product Order
  const handleOpenWhatsAppOrder = (product: Product) => {
    setWhatsAppModalProduct(product);
  };

  // Admin Actions
  const handleSaveProduct = (product: Product) => {
    setProducts(prev => {
      const exists = prev.some(p => p.id === product.id);
      let updated: Product[];
      if (exists) {
        updated = prev.map(p => p.id === product.id ? product : p);
      } else {
        updated = [product, ...prev];
      }
      saveProductsToStorage(updated);
      return updated;
    });
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== productId);
      saveProductsToStorage(updated);
      return updated;
    });
  };

  const handleDeleteMultipleProducts = (productIds: string[]) => {
    const idSet = new Set(productIds);
    setProducts(prev => {
      const updated = prev.filter(p => !idSet.has(p.id));
      saveProductsToStorage(updated);
      return updated;
    });
  };

  const handleImportProducts = (newProductList: Product[], mode: 'add' | 'replace') => {
    setProducts(newProductList);
    saveProductsToStorage(newProductList);
    triggerToast(
      mode === 'replace' 
        ? `Replaced catalogue with ${newProductList.length} products` 
        : `Catalogue updated (${newProductList.length} total products)`
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-stone-900 selection:bg-amber-100 selection:text-amber-900 font-sans">
      
      {/* 1. Top Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Main Header */}
      <Header
        activePage={activePage}
        setActivePage={setActivePage}
        cartCount={totalCartCount}
        openCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Floating Global Toast Notification */}
      {toastText && (
        <div className="fixed bottom-5 right-5 z-60 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom duration-200 border border-stone-700">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastText}</span>
        </div>
      )}

      {/* 3. Page Content Switching */}
      <main className="flex-1">
        {activePage === 'home' && (
          <>
            {/* Hero Section */}
            <Hero
              onShopNow={handleShopNow}
              onExploreCategories={handleExploreCategories}
            />

            {/* Store Benefits Bar */}
            <Benefits />

            {/* Featured Categories (All 31 supported) */}
            <CategorySection
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              productCounts={productCounts}
            />

            {/* Featured Products */}
            <FeaturedProducts
              products={products}
              onViewDetails={setDetailsProduct}
              onOrderWhatsApp={handleOpenWhatsAppOrder}
              onAddToCart={handleAddToCart}
              onViewAll={handleShopNow}
            />

            {/* Free Delivery Promotional Banner */}
            <FreeDeliveryBanner onShopNow={handleShopNow} />

            {/* New Arrivals Section */}
            <NewArrivalsSection
              products={products}
              onViewDetails={setDetailsProduct}
              onOrderWhatsApp={handleOpenWhatsAppOrder}
              onAddToCart={handleAddToCart}
              onViewAll={handleShopNow}
            />

            {/* WhatsApp Shopping Promo Banner */}
            <WhatsAppShoppingBanner />

            {/* Why Choose Batool Market */}
            <WhyChooseUs />
          </>
        )}

        {activePage === 'shop' && (
          <ProductGrid
            products={products}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onViewDetails={setDetailsProduct}
            onOrderWhatsApp={handleOpenWhatsAppOrder}
            onAddToCart={handleAddToCart}
            onOpenAdmin={() => setIsAdminOpen(true)}
          />
        )}

        {activePage === 'categories' && (
          <div>
            <div className="bg-[#F5F2EA] py-10 border-b border-stone-200/80 text-center px-4">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-widest block mb-1">
                Full Department Directory
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
                All 31 Product Categories
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto mt-2">
                Click any category below to instantly view available items with nationwide Free Delivery and Cash on Delivery.
              </p>
            </div>

            <CategorySection
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              productCounts={productCounts}
            />
          </div>
        )}

        {activePage === 'about' && (
          <AboutSection onShopNow={handleShopNow} />
        )}

        {activePage === 'contact' && (
          <ContactSection />
        )}
      </main>

      {/* 4. Global Luxury Footer */}
      <Footer
        onSelectCategory={handleSelectCategory}
        onNavigate={setActivePage}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* 5. Modals and Slide-overs */}
      {/* Product Details Modal */}
      <ProductDetailsModal
        product={detailsProduct}
        isOpen={Boolean(detailsProduct)}
        onClose={() => setDetailsProduct(null)}
        onAddToCart={handleAddToCart}
        onOrderWhatsApp={(prod) => {
          setDetailsProduct(null);
          setWhatsAppModalProduct(prod);
        }}
      />

      {/* WhatsApp Quick Order & Address Modal */}
      <WhatsAppOrderModal
        product={whatsAppModalProduct}
        isOpen={Boolean(whatsAppModalProduct)}
        onClose={() => setWhatsAppModalProduct(null)}
      />

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onExploreShop={() => {
          setIsCartOpen(false);
          handleShopNow();
        }}
      />

      {/* Admin Dashboard */}
      {isAdminOpen && (
        <AdminDashboard
          products={products}
          onSaveProduct={handleSaveProduct}
          onDeleteProduct={handleDeleteProduct}
          onDeleteMultipleProducts={handleDeleteMultipleProducts}
          onImportProducts={handleImportProducts}
          onClose={() => setIsAdminOpen(false)}
        />
      )}

    </div>
  );
}
