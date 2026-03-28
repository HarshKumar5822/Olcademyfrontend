import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useCart } from '../CartContext';
import { useWishlist } from '../WishlistContext';
import ScentService from '../services/scentService';
import ProductCartSection from '../pages/ProductCartSection';

import {
  ShoppingCart,
  Heart,
  Star,
  RefreshCw,
  Gift,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const PerfectDiscoverGiftsCollection = () => {
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [scents, setScents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;

  // Cart sidebar open state (new)
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addNotification = useCallback((message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const fetchPerfectDiscoverGifts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        isActive: true
      };
      const response = await ScentService.getPerfectDiscoverGiftsScents(params);
      if (response?.success) {
        setScents(response.data || []);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
        }
      } else {
        setError(response?.message || 'Failed to fetch perfect discover gifts');
        setScents([]);
      }
    } catch {
      setError('Failed to load perfect discover gifts');
      setScents([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchPerfectDiscoverGifts();
  }, [fetchPerfectDiscoverGifts]);

  const handleAddToCartBase = async (scent, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const cartItem = {
      id: scent._id?.toString(),
      name: scent.name,
      price: Number(scent.price),
      image: scent.images?.[0] || '/images/default-scent.png',
      quantity: 1,
      selectedSize: scent.sizes?.[0]?.size || null,
      personalization: null,
      brand: scent.brand || '',
      sku: scent.sku || ''
    };

    try {
      const success = await addToCart(cartItem);
      addNotification(
        success ? `Added ${scent.name} to cart!` : 'Failed to add item to cart',
        success ? 'success' : 'error'
      );
      // do NOT auto-open cart on add; user wants explicit View Cart to open sidebar
      return success;
    } catch {
      addNotification('Something went wrong.', 'error');
      return false;
    }
  };

  const handleWishlistToggleBase = (scent, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const wasInWishlist = isInWishlist(scent._id);
    const wishlistProduct = {
      id: scent._id?.toString(),
      name: scent.name,
      price: scent.price,
      image: scent.images?.[0] || '/images/default-scent.png',
      description: scent.description || '',
      category: scent.category || '',
      brand: scent.brand || '',
      selectedSize: null
    };

    toggleWishlist(wishlistProduct);
    addNotification(
      wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist!',
      'success'
    );
  };

  const ScentCard = memo(({ scent }) => {
    const selectedSize = scent.sizes?.[0]?.size ?? null;
    const productInCart = isInCart(scent._id?.toString(), selectedSize);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleAddToCart = async (e) => {
      setIsAddingToCart(true);
      await handleAddToCartBase(scent, e);
      setIsAddingToCart(false);
    };

    const handleProductClick = () => {
      if (scent._id) navigate(`/scent/${scent._id}`);
    };

    const getStars = (rating = 0) => (
      <div className="flex items-center justify-center gap-1 mb-1">
        {[...Array(5)].map((_, idx) => (
          <Star
            key={idx}
            size={16}
            style={{
              color: idx < Math.floor(rating) ? "#5A2408" : "#cfc6be",
              opacity: idx < Math.floor(rating) ? 1 : 0.3
            }}
            fill={idx < Math.floor(rating) ? "#5A2408" : "transparent"}
          />
        ))}
      </div>
    );

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
        className="bg-white shadow-md hover:shadow-xl transition-all duration-300 w-full max-w-[290px] min-h-0 sm:min-h-[420px] flex flex-col justify-between"
        style={{ borderRadius: '0px' }}
        onClick={handleProductClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* PRODUCT IMAGE */}
        <div className="relative w-full aspect-[290/240] flex items-center justify-center bg-white p-3">
          <img
            src={scent.images?.[0] || "/images/default-scent.png"}
            className="object-contain w-full h-full max-w-[248px] max-h-[248px]"
            alt={scent.name}
          />

          {/* only wishlist button */}
          <div className="absolute top-2.5 right-2.5">
            <motion.button
              whileHover={{ scale: 1.15 }}
              onClick={(e) => handleWishlistToggleBase(scent, e)}
              className="bg-white rounded-full p-1.5 "
            >
              <Heart
                size={14}
                className={isInWishlist(scent._id) ? "fill-red-600 text-red-600" : "text-gray-700"}
              />
            </motion.button>
          </div>
        </div>

        {/* PRODUCT DETAILS */}
        <div className="px-3.5 pt-3.5 pb-1 flex flex-col gap-3">
          <h3 className="font-bold uppercase text-center text-lg" style={{ fontFamily: 'Playfair Display', color: '#5A2408' }}>
            {scent.name}
          </h3>

          {getStars(scent.rating)}

          <p className="text-center line-clamp-2 text-sm" style={{ color: '#7E513A' }}>
            {scent.description}
          </p>

          <p className="font-bold text-center text-lg" style={{ color: '#431A06' }}>
            ${Number(scent.price).toFixed(2)}
          </p>
        </div>

        {/* ADD / VIEW CART BUTTON */}
        <div className="w-full flex flex-col items-center pb-6">
          <motion.button
            onClick={handleAddToCart}
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-center gap-2 text-white font-bold uppercase w-full h-[54px] rounded-none"
            style={{
              backgroundColor: "#431A06",
              fontFamily: "Manrope, sans-serif",
              letterSpacing: "0.05em"
            }}
          >
            {isAddingToCart ? (
              <RefreshCw size={20} className="animate-spin" />
            ) : (
              <ShoppingCart size={20} />
            )}

            <span>
              {isAddingToCart ? "Adding..." : "Add to Cart"}
            </span>
          </motion.button>
        </div>
      </motion.div>
    );
  });

  const NotificationSystem = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`p-4 rounded-xl shadow-lg backdrop-blur-sm max-w-sm ${n.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              } text-white`}
          >
            <div className="flex items-center space-x-3">
              {n.type === 'success' ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <span>{n.message}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-F8F6F3 text-79300f">
      <Header />
      <NotificationSystem />

      {/* CART SIDEBAR (right side) */}
      <ProductCartSection isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* HERO SECTION (unchanged) */}
      <section className="relative overflow-hidden w-full bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100">
        <div className="relative w-full h-[400px] flex items-center justify-center">
          <img
            src="/images/unisex.png"
            className="w-full h-full object-cover"
            alt="Perfect Discover Gifts"
          />
          <div className="absolute inset-0 bg-black/50"></div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Gift className="w-20 h-20 mx-auto text-purple-300" />
              <h1 className="text-6xl text-white font-bold mt-4 tracking-widest">
                Perfect Discover Gifts
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS GRID */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-32 w-32 border-b-2 border-purple-500 rounded-full"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <p className="text-gray-600">{error}</p>
              <button
                onClick={fetchPerfectDiscoverGifts}
                className="mt-4 bg-purple-500 text-white px-6 py-3 rounded-xl"
              >
                Try Again
              </button>
            </div>
          ) : scents.length === 0 ? (
            <div className="text-center py-16">
              <Gift size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No products found.</p>
            </div>
          ) : (
            <>
              <p className="text-center text-gray-600 mb-6">
                Showing {scents.length} gift options
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {scents.map((scent) => (
                  <ScentCard key={scent._id} scent={scent} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-12">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>

                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1 rounded ${currentPage === i + 1
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-300'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PerfectDiscoverGiftsCollection;
