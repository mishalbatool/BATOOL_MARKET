import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, CartItem, CategoryName, ActivePage } from './types';
import { 
  loadCartFromStorage, 
  saveCartToStorage
} from './utils/storage';
import { 
  subscribeToProducts, 
  saveProductToSupabase, 
  deleteProductFromSupabase, 
  fetchAllProductsOnce,
  fetchProductByIdFromSupabase,
  extractProductIdFromUrl,
  getProductShareUrl
} from './services/productService';
import { normalizeCategoryName } from './data/categories';
import { testFirebaseConnection } from './firebase/config';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Benefits } from './components/Benefits';
import { CategorySection } from './components/CategorySection';
import { FeaturedProducts } from './components/FeaturedAndNewSections';
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
import { Check, AlertCircle, X, Plus, Shield } from 'lucide-react';
import { subscribeToAdminAuth, isCurrentlyAdmin, logoutAdmin } from './services/authService';

export default function App() {
  // 1. Core State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [productsFetchError, setProductsFetchError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryName | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Modals & Drawers
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [productNotFoundId, setProductNotFoundId] = useState<string | null>(null);
  const [isLoadingDirectProduct, setIsLoadingDirectProduct] = useState<boolean>(() => Boolean(extractProductIdFromUrl()));
  const [whatsAppModalProduct, setWhatsAppModalProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => isCurrentlyAdmin());
  const [adminInitialOpenAdd, setAdminInitialOpenAdd] = useState(false);
  const [toastText, setToastText] = useState<string | null>(null);

  // Subscribe to reactive admin auth state
  useEffect(() => {
    return subscribeToAdminAuth((status) => {
      setIsAdmin(status);
    });
  }, []);

  // Listen to /admin URL direct access
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      setIsAdminOpen(true);
    }
  }, []);

  // URL-driven navigation handlers
  const handleOpenProductDetails = useCallback((product: Product) => {
    setDetailsProduct(product);
    setProductNotFoundId(null);
    if (typeof window !== 'undefined') {
      const targetUrl = `/product/${encodeURIComponent(product.id)}`;
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({ productId: product.id }, '', targetUrl);
      }
    }
  }, []);

  const handleCloseProductDetails = useCallback(() => {
    setDetailsProduct(null);
    setProductNotFoundId(null);
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/product/') || window.location.search.includes('product=')) {
        window.history.pushState({}, '', '/');
      }
    }
  }, []);

  // Retry fetch manually if needed
  const handleRetryFetch = () => {
    setIsLoadingProducts(true);
    setProductsFetchError(null);
    fetchAllProductsOnce()
      .then((items) => {
        setProducts(items);
        setIsLoadingProducts(false);
      })
      .catch((err) => {
        setProductsFetchError(err?.message || "Failed to load products from database");
        setIsLoadingProducts(false);
      });
  };

  // Initialize and subscribe to Supabase products in real-time
  useEffect(() => {
    // Subscribe to shared Supabase products table
    const unsubscribe = subscribeToProducts(
      (loadedProducts) => {
        setProducts(loadedProducts);
        setIsLoadingProducts(false);
        setProductsFetchError(null);
      },
      (err) => {
        console.error("Products subscription error:", err);
        setProductsFetchError(err.message || "Failed to sync products from Supabase.");
        setIsLoadingProducts(false);
      }
    );

    // Load Cart from storage
    const loadedCart = loadCartFromStorage();
    setCart(loadedCart);

    return () => unsubscribe();
  }, []);

  // Direct Product URL Routing & Refresh Handling
  // When a customer opens /product/BM001877554 directly or refreshes the page
  useEffect(() => {
    const urlProductId = extractProductIdFromUrl();
    if (!urlProductId) {
      return;
    }

    // If currently displaying this product, nothing to do
    if (detailsProduct && detailsProduct.id.toLowerCase() === urlProductId.toLowerCase()) {
      return;
    }

    // 1. Try finding in loaded products state
    const match = products.find(p => 
      p.id.toLowerCase() === urlProductId.toLowerCase() ||
      (p.slug && p.slug.toLowerCase() === urlProductId.toLowerCase())
    );

    if (match) {
      setDetailsProduct(match);
      setProductNotFoundId(null);
      setIsLoadingDirectProduct(false);
      return;
    }

    // 2. Fetch directly from Supabase by ID (guarantees product loads on cold refresh)
    let isCancelled = false;
    setIsLoadingDirectProduct(true);

    fetchProductByIdFromSupabase(urlProductId)
      .then((fetchedProduct) => {
        if (isCancelled) return;
        if (fetchedProduct) {
          setDetailsProduct(fetchedProduct);
          setProductNotFoundId(null);
          setProducts(prev => {
            if (prev.some(p => p.id === fetchedProduct.id)) return prev;
            return [fetchedProduct, ...prev];
          });
        } else if (!isLoadingProducts) {
          setDetailsProduct(null);
          setProductNotFoundId(urlProductId);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error("Direct product fetch error:", err);
        setDetailsProduct(null);
        setProductNotFoundId(urlProductId);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingDirectProduct(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [products, isLoadingProducts, detailsProduct]);

  // Handle browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const urlProductId = extractProductIdFromUrl();
      if (!urlProductId) {
        setDetailsProduct(null);
        setProductNotFoundId(null);
      } else {
        const match = products.find(p => p.id.toLowerCase() === urlProductId.toLowerCase());
        if (match) {
          setDetailsProduct(match);
          setProductNotFoundId(null);
        } else {
          fetchProductByIdFromSupabase(urlProductId).then((fetched) => {
            if (fetched) {
              setDetailsProduct(fetched);
              setProductNotFoundId(null);
            } else {
              setDetailsProduct(null);
              setProductNotFoundId(urlProductId);
            }
          });
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

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
      const normalized = normalizeCategoryName(p.category);
      counts[normalized] = (counts[normalized] || 0) + 1;
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1, selectedSize?: string, selectedColor?: string) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => 
        item.product.id === product.id && 
        item.selectedSize === selectedSize && 
        item.selectedColor === selectedColor
      );

      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, selectedSize, selectedColor }];
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
  const handleOpenWhatsAppOrder = (product: Product, quantity: number = 1) => {
    setWhatsAppModalProduct(product);
  };

  // Admin Actions to Supabase Database
  const handleSaveProduct = async (product: Product) => {
    // 1. Persist in Supabase products table FIRST.
    const savedProduct = await saveProductToSupabase(product);

    // 2. Update React state immediately upon confirmed write
    setProducts(prev => {
      const exists = prev.some(p => p.id === savedProduct.id || p.id === product.id);
      if (exists) {
        return prev.map(p => (p.id === savedProduct.id || p.id === product.id) ? savedProduct : p);
      }
      return [savedProduct, ...prev];
    });

    triggerToast(`Product saved successfully.`);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (detailsProduct && detailsProduct.id === productId) {
      handleCloseProductDetails();
    }

    // 1. Delete from Supabase database
    await deleteProductFromSupabase(productId);

    // 2. Remove from React state
    setProducts(prev => prev.filter(p => p.id !== productId));
    triggerToast("Product removed successfully");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-stone-900 selection:bg-amber-100 selection:text-amber-900 font-sans">
      
      {/* Admin Utility Bar - ONLY shown to authenticated store manager */}
      {isAdmin && (
        <div className="bg-stone-900 text-stone-200 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-amber-600/40 z-30 sticky top-0 shadow-md">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">Store Admin:</span>
            <span className="text-stone-400 font-mono text-[11px]">mishalbatool572@gmail.com</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAdminInitialOpenAdd(true);
                setIsAdminOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Product</span>
            </button>
            <button
              onClick={() => {
                setAdminInitialOpenAdd(false);
                setIsAdminOpen(true);
              }}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
            >
              Manage Products ({products.length})
            </button>
            <button
              onClick={async () => {
                await logoutAdmin();
                triggerToast("Admin session logged out");
              }}
              className="text-stone-400 hover:text-white px-2 py-1.5 text-xs transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      )}

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
              isLoading={isLoadingProducts}
              error={productsFetchError}
              onRetry={handleRetryFetch}
              onViewDetails={handleOpenProductDetails}
              onOrderWhatsApp={handleOpenWhatsAppOrder}
              onAddToCart={handleAddToCart}
              onViewAll={handleShopNow}
            />

            {/* Free Delivery Promotional Banner */}
            <FreeDeliveryBanner onShopNow={handleShopNow} />

            {/* WhatsApp Shopping Promo Banner */}
            <WhatsAppShoppingBanner />

            {/* Why Choose Batool Market */}
            <WhyChooseUs />
          </>
        )}

        {activePage === 'shop' && (
          <ProductGrid
            products={products}
            isLoading={isLoadingProducts}
            fetchError={productsFetchError}
            onRetry={handleRetryFetch}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onViewDetails={handleOpenProductDetails}
            onOrderWhatsApp={handleOpenWhatsAppOrder}
            onAddToCart={handleAddToCart}
            onOpenAdmin={isAdmin ? () => setIsAdminOpen(true) : undefined}
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
        setActivePage={setActivePage}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* 5. Modals and Slide-overs */}
      {/* Product Details Modal with Video, Link Sharing */}
      <ProductDetailsModal
        product={detailsProduct}
        isOpen={Boolean(detailsProduct)}
        onClose={handleCloseProductDetails}
        onAddToCart={handleAddToCart}
        onOrderWhatsApp={(prod) => {
          handleCloseProductDetails();
          setWhatsAppModalProduct(prod);
        }}
      />

      {/* Loading overlay for direct product link */}
      {isLoadingDirectProduct && !detailsProduct && !productNotFoundId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex items-center gap-3 border border-stone-200">
            <div className="w-5 h-5 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs sm:text-sm font-semibold text-stone-800">
              Loading Product Details...
            </span>
          </div>
        </div>
      )}

      {/* Product Not Found Modal for removed or invalid product URLs */}
      {productNotFoundId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-stone-200 relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={handleCloseProductDetails}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-800">
              <AlertCircle className="w-7 h-7" />
            </div>

            <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mb-2">
              Product Not Found
            </h3>

            <p className="text-xs sm:text-sm text-stone-600 mb-6 leading-relaxed">
              The product you are looking for (<span className="font-mono font-semibold text-stone-800">{productNotFoundId}</span>) is not available or has been removed from our collection.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  handleCloseProductDetails();
                  handleShopNow();
                }}
                className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 px-5 rounded-xl text-xs sm:text-sm transition-all shadow-md hover:shadow-lg"
              >
                Browse All Products
              </button>
              <button
                type="button"
                onClick={handleCloseProductDetails}
                className="sm:w-auto bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-3 px-5 rounded-xl text-xs sm:text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Simple Admin Product Management Panel */}
      {isAdminOpen && (
        <AdminDashboard
          products={products}
          onSaveProduct={handleSaveProduct}
          onDeleteProduct={handleDeleteProduct}
          onClose={() => {
            setIsAdminOpen(false);
            setAdminInitialOpenAdd(false);
          }}
          initialOpenAdd={adminInitialOpenAdd}
        />
      )}

    </div>
  );
}
