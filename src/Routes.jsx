import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './CartContext';
import { Toaster } from 'react-hot-toast';
import { WishlistProvider } from './WishlistContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import Loading from './components/common/Loading';

// Lazy loaded components
const UniversalCollection = lazy(() => import('./pages/UniversalCollection'));
const MensCollection = lazy(() => import('./pages/Men/MensCollection'));
const Womenscollection = lazy(() => import('./pages/Page2/Womens'));
const AllFragrancesSection = lazy(() => import('./pages/AllFregrances'));
const ProductCartSection = lazy(() => import('./pages/ProductCartSection'));
const Checkout = lazy(() => import('./pages/Checkout'));
const HomePage = lazy(() => import('./pages/Home'));
const UnisexCollection = lazy(() => import('./pages/UnisexCollection'));
const GiftCollection = lazy(() => import('./pages/GiftCollection'));
const Wishlist = lazy(() => import('./components/common/Wishlist'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const TrendingCollection = lazy(() => import('./pages/TrendingCollection'));
const BestSellersCollection = lazy(() => import('./pages/BestSellersCollection'));
const WomensSignatureCollection = lazy(() => import('./pages/WomensSignatureCollection'));
const RoseGardenEssenceCollection = lazy(() => import('./pages/RoseGardenEssenceCollection'));
const MensSignatureCollection = lazy(() => import('./pages/MensSignatureCollection'));
const OrangeMarmaladeCollection = lazy(() => import('./pages/OrangeMarmaladeCollection'));
// Unisex collection pages
const GenderFreeFragranceCollection = lazy(() => import('./pages/GenderFreeFragranceCollection'));
const ScentsWithoutLimitsCollection = lazy(() => import('./pages/ScentsWithoutLimitsCollection'));
// NEW: Import the new gift collection pages
const PerfectDiscoverGiftsCollection = lazy(() => import('./pages/PerfectDiscoverGiftsCollection'));
const PerfectGiftsPremiumCollection = lazy(() => import('./pages/PerfectGiftsPremiumCollection'));
const PerfectGiftsLuxuryCollection = lazy(() => import('./pages/PerfectGiftsLuxuryCollection'));
const HomeDecorGiftsCollection = lazy(() => import('./pages/HomeDecorGiftsCollection'));

const VerifyEmail = lazy(() => import('./components/common/VerifyEmail'));
const Login = lazy(() => import('./components/common/Login'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
const Orders = lazy(() => import('./components/Orders'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const AboutPage = lazy(() => import('./components/common/AboutPage'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const DiscoverCollection = lazy(() => import('./pages/DiscoverTheCollection'));
const SignatureCollection = lazy(() => import('./pages/SignatureCollection'));
const FragrantFavoritesCollection = lazy(() => import('./pages/FragrantFavoritesCollection'));

const AppRoutes = ({ darkMode, setDarkMode }) => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Suspense fallback={<Loading />}>
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/"
                  element={<HomePage darkMode={darkMode} setDarkMode={setDarkMode} />}
                />
                <Route path="/universal-collection" element={<UniversalCollection />} />
                <Route path="/discover-collection" element={<DiscoverCollection />} />
                <Route path="/mens-collection" element={<MensCollection />} />
                <Route path="/womens-collection" element={<Womenscollection />} />
                <Route path="/signature-collection" element={<SignatureCollection />} />
                <Route path="/fragrant-favorites-collection" element={<FragrantFavoritesCollection />} />
                <Route path="/all-fragrances" element={<AllFragrancesSection />} />
                <Route path="/unisex-collection" element={<UnisexCollection />} />
                <Route path="/gift-collection" element={<GiftCollection />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/about-page" element={<AboutPage />} />

                {/* Collection Routes */}
                <Route path="/trending-collection" element={<TrendingCollection />} />
                <Route path="/best-sellers-collection" element={<BestSellersCollection />} />

                {/* Women's Collection Routes */}
                <Route path="/womens-signature-collection" element={<WomensSignatureCollection />} />
                <Route path="/rose-garden-essence-collection" element={<RoseGardenEssenceCollection />} />

                {/* Men's Collection Routes */}
                <Route path="/mens-signature-collection" element={<MensSignatureCollection />} />
                <Route path="/orange-marmalade-collection" element={<OrangeMarmaladeCollection />} />

                {/* Unisex Collection Routes */}
                <Route path="/gender-free-fragrance-collection" element={<GenderFreeFragranceCollection />} />
                <Route path="/scents-without-limits-collection" element={<ScentsWithoutLimitsCollection />} />

                {/* NEW: Gift Collection Routes */}
                <Route path="/perfect-discover-gifts-collection" element={<PerfectDiscoverGiftsCollection />} />
                <Route path="/perfect-gifts-premium-collection" element={<PerfectGiftsPremiumCollection />} />
                <Route path="/perfect-gifts-luxury-collection" element={<PerfectGiftsLuxuryCollection />} />
                <Route path="/home-decor-gifts-collection" element={<HomeDecorGiftsCollection />} />

                {/* IMPORTANT: Static routes BEFORE dynamic routes */}
                <Route path="/product-perfume" element={<ProductPage />} />

                {/* Dynamic product route - MUST come after static routes */}
                <Route path="/product/:id" element={<ProductDetailPage />} />
                {/* Dynamic scent route for new collection items */}
                <Route path="/scent/:id" element={<ProductDetailPage />} />

                {/* Authentication Routes */}
                <Route
                  path="/login"
                  element={<Login isOpen={true} onClose={() => window.history.back()} />}
                />
                <Route path="/verify-email" element={<VerifyEmail />} />

                {/* Protected Routes - Require Authentication */}
                <Route
                  path="/product-cart"
                  element={
                    <ProtectedRoute>
                      <ProductCartSection />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout darkMode={darkMode} setDarkMode={setDarkMode} />
                    </ProtectedRoute>
                  }
                />

               <Route path="/wishlist-collection" element={<Wishlist />} />

                 <Route path='/userProfile' element={<UserProfile/>}/>
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders darkMode={darkMode} setDarkMode={setDarkMode} />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Only Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminPanel />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/panel"
                  element={
                    <AdminRoute>
                      <AdminPanel />
                    </AdminRoute>
                  }
                />

                {/* Catch all route - 404 Page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Toaster position="top-center" />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

// 404 Not Found Component
const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
        <a 
          href="/" 
          className="inline-block bg-gradient-to-r from-[#79300f] to-[#b14527] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
        >
          Go Back Home
        </a>
      </div>
    </div>
  );
};

export default AppRoutes;