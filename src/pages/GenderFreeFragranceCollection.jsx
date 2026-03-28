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
  ShoppingBag,
  ShoppingCart,
  Heart,
  Eye,
  Star,
  RefreshCw,
  Users,
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { FiHeart } from 'react-icons/fi';

const GenderFreeFragranceCollection = () => {
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [scents, setScents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;

  // Cart sidebar state (NEW) — when true, opens right-side cart
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addNotification = useCallback((message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const fetchGenderFreeScents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page: currentPage, limit: itemsPerPage, isActive: true };
      const response = await ScentService.getGenderFreeScents(params);
      if (response.success) {
        setScents(response.data || []);
        if (response.pagination) setTotalPages(response.pagination.totalPages);
      } else {
        setError(response.message || 'Failed to fetch gender-free scents');
        setScents([]);
      }
    } catch (err) {
      setError('Failed to load gender-free scents');
      setScents([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchGenderFreeScents();
  }, [fetchGenderFreeScents]);

  const handleAddToCartBase = async (scent, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!scent._id) {
      addNotification('Product information is incomplete', 'error');
      return;
    }
    const cartItem = {
      id: scent._id.toString(),
      name: scent.name,
      price: Number(scent.price),
      image: scent.images && scent.images.length > 0 ? scent.images[0] : '/images/default-scent.png',
      quantity: 1,
      selectedSize: scent.sizes && scent.sizes.length > 0 ? scent.sizes[0].size : null,
      personalization: null,
      brand: scent.brand || '',
      sku: scent.sku || ''
    };
    try {
      const success = await addToCart(cartItem);
      addNotification(success ? `Added ${scent.name} to cart!` : 'Failed to add item to cart', success ? 'success' : 'error');
    } catch {
      addNotification('Something went wrong. Please try again.', 'error');
    }
  };

  const handleWishlistToggleBase = (scent, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!scent._id) {
      addNotification('Unable to add to wishlist', 'error');
      return;
    }
    try {
      const wasInWishlist = isInWishlist(scent._id);
      const wishlistProduct = {
        id: scent._id.toString(),
        name: scent.name,
        price: scent.price,
        image: scent.images && scent.images.length > 0 ? scent.images[0] : '/images/default-scent.png',
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
    } catch {
      addNotification('Failed to update wishlist', 'error');
    }
  };

  const handleQuickView = (scent, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (e && e.preventDefault) e.preventDefault();
    if (scent && scent._id) {
      setQuickViewProduct(scent);
    } else {
      addNotification('Unable to show quick view', 'error');
    }
  };

  // Scent Card component
  const ScentCard = memo(({ scent }) => {
    const selectedSize = scent.sizes?.[0]?.size ?? null;
    const productInCart = isInCart(scent._id?.toString(), selectedSize);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    if (!scent) return null;

    const handleWishlistToggle = (e) => handleWishlistToggleBase(scent, e);

    const handleAddToCart = async (e) => {
      setIsAddingToCart(true);
      await handleAddToCartBase(scent, e);
      setIsAddingToCart(false);
    };

    const handleProductClick = () => {
      if (scent._id) {
        navigate(`/scent/${scent._id}`);
      }
    };

    const getStars = (rating = 0) => (
      <div className="flex items-center justify-center gap-1 mb-1">
        {[...Array(5)].map((_, idx) =>
          <Star
            key={idx}
            size={16}
            style={{ color: idx < Math.floor(rating) ? "#5A2408" : "#cfc6be", opacity: idx < Math.floor(rating) ? 1 : 0.3 }}
            fill={idx < Math.floor(rating) ? "#5A2408" : "transparent"}
          />
        )}
      </div>
    );

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 w-full max-w-[290px] min-h-0 sm:min-h-[420px] flex flex-col justify-between border-none"
        style={{ borderRadius: '0px' }}
        onClick={handleProductClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div>
          <div
            className="relative bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden w-full aspect-[290/240] p-3"
            style={{ borderRadius: '0px' }}
          >
            <img
              src={scent.images?.[0] || "/images/default-scent.png"}
              alt={scent.name}
              className="object-contain w-full h-full max-w-[248px] max-h-[248px]"
              style={{ borderRadius: '0px' }}
            />

            <div className="absolute top-2.5 right-2.5 flex items-center gap-2 z-10">
              <AnimatePresence>
                {isHovered && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleQuickView(scent, e)}
                    className="bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full p-1.5 shadow-md transition-all duration-200"
                    aria-label="Quick view"
                  >
                    <Eye size={14} className="text-[#431A06]" />
                  </motion.button>
                )}
              </AnimatePresence>

              <motion.button
                onClick={handleWishlistToggle}
                whileHover={{ scale: 1.15 }}
                className="bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-lg"
                aria-label={isInWishlist(scent._id) ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart
                  size={14}
                  className={isInWishlist(scent._id) ? 'fill-red-600 text-red-600' : 'text-gray-700'}
                />
              </motion.button>
            </div>
          </div>

          <div className="px-3.5 pt-3.5 pb-1 flex flex-col gap-3">
            <h3
              className="font-bold uppercase text-center text-lg"
              style={{ fontFamily: 'Playfair Display, serif', color: '#5A2408' }}
            >
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
        </div>

        <div className="w-full flex flex-col items-center" style={{ paddingBottom: '1.5rem' }}>
          <motion.button
            onClick={(e) => {
              if (e && e.stopPropagation) e.stopPropagation();
              handleAddToCart(e);
            }}
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-center gap-2 text-white font-bold uppercase w-full h-[54px] rounded-none"
            style={{
              backgroundColor: "#431A06",
              fontFamily: "Manrope, sans-serif",
              letterSpacing: "0.05em",
              marginBottom: 0,
              borderRadius: "0px"
            }}
          >
            {isAddingToCart ? <RefreshCw size={20} className="animate-spin" /> : <ShoppingCart size={20} />}
            <span>{isAddingToCart ? "Adding..." : "Add to Cart"}</span>
          </motion.button>
        </div>
      </motion.div>
    );
  });

  // QuickView modal component
  const QuickViewModal = () => {
    if (!quickViewProduct) return null;

    const handleClose = () => {
      setQuickViewProduct(null);
    };

    const handleQuickViewWishlist = () => {
      if (quickViewProduct._id) {
        try {
          const wishlistProduct = {
            id: quickViewProduct._id.toString(),
            name: quickViewProduct.name,
            price: quickViewProduct.price,
            image: quickViewProduct.images && quickViewProduct.images.length > 0 ? quickViewProduct.images[0] : '/images/default-scent.png',
            description: quickViewProduct.description || '',
            category: quickViewProduct.category || '',
            brand: quickViewProduct.brand || '',
            selectedSize: null
          };
          toggleWishlist(wishlistProduct);
          addNotification(
            isInWishlist(quickViewProduct._id) ? 'Removed from wishlist' : 'Added to wishlist!',
            'success'
          );
        } catch {
          addNotification('Failed to update wishlist', 'error');
        }
      } else {
        addNotification('Unable to update wishlist', 'error');
      }
    };

    const handleQuickViewAddToCart = async () => {
      if (!quickViewProduct._id) {
        addNotification('Product not available', 'error');
        return;
      }
      const cartItem = {
        id: quickViewProduct._id.toString(),
        name: quickViewProduct.name,
        price: Number(quickViewProduct.price),
        image: quickViewProduct.images && quickViewProduct.images.length > 0 ? quickViewProduct.images[0] : '/images/default-scent.png',
        quantity: 1,
        selectedSize: quickViewProduct.sizes && quickViewProduct.sizes.length > 0 ? quickViewProduct.sizes[0].size : null,
        personalization: null,
        brand: quickViewProduct.brand || '',
        sku: quickViewProduct.sku || ''
      };
      try {
        const success = await addToCart(cartItem);
        if (success) {
          addNotification(`Added ${quickViewProduct.name} to cart!`, 'success');
          handleClose();
        } else {
          addNotification('Failed to add item to cart', 'error');
        }
      } catch {
        addNotification('Something went wrong. Please try again.', 'error');
      }
    };

    const productInQuickViewCart = isInCart(
      quickViewProduct._id?.toString(),
      quickViewProduct.sizes && quickViewProduct.sizes.length > 0 ? quickViewProduct.sizes[0].size : null
    );

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#431A06] dark:text-[#f6d110]">
                Quick View
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                aria-label="Close quick view"
              >
                ×
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <img
                  src={quickViewProduct.images?.[0] || '/images/default-scent.png'}
                  alt={quickViewProduct.name || 'Scent'}
                  className="w-full h-64 object-contain rounded-2xl bg-gray-100 dark:bg-gray-700"
                  onError={(e) => {
                    e.target.src = '/images/default-scent.png';
                  }}
                />
              </div>
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {quickViewProduct.name || 'Unnamed Scent'}
                </h4>
                {quickViewProduct.brand && (
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    by {quickViewProduct.brand}
                  </p>
                )}
                <p className="text-gray-600 dark:text-gray-400">
                  {quickViewProduct.description || 'No description available'}
                </p>
                <p className="text-2xl font-bold text-[#431A06] dark:text-[#f6d110]">
                  ${quickViewProduct.price ? quickViewProduct.price.toFixed(2) : '0.00'}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {quickViewProduct.scentFamily && (
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full capitalize">
                      {quickViewProduct.scentFamily}
                    </span>
                  )}
                  {quickViewProduct.intensity && (
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full capitalize">
                      {quickViewProduct.intensity}
                    </span>
                  )}
                  {quickViewProduct.concentration && (
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full capitalize">
                      {quickViewProduct.concentration}
                    </span>
                  )}
                </div>
                <div className="flex gap-4">
                  {productInQuickViewCart ? (
                    <button
                      onClick={() => {
                        // open cart sidebar instead of navigation
                        setIsCartOpen(true);
                        handleClose();
                      }}
                      className="flex-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 border border-emerald-400/30 shadow-emerald-500/20"
                    >
                      <ShoppingCart size={20} />
                      <span>View in Cart</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleQuickViewAddToCart}
                      className="flex-1 bg-gradient-to-r from-[#431A06] to-[#5A2408] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <ShoppingBag size={20} />
                      <span>Add to Cart</span>
                    </button>
                  )}
                  <button
                    onClick={handleQuickViewWishlist}
                    className="px-4 py-3 border-2 border-[#431A06] text-[#431A06] rounded-xl hover:bg-[#431A06] hover:text-white transition-all duration-300"
                    aria-label="Add to wishlist"
                  >
                    <Heart size={20} className={isInWishlist(quickViewProduct._id) ? 'fill-red-600 text-red-600' : ''} />
                  </button>
                  <button
                    onClick={() => {
                      if (quickViewProduct._id) {
                        navigate(`/scent/${quickViewProduct._id}`);
                        handleClose();
                      } else {
                        addNotification('Product details not available', 'error');
                      }
                    }}
                    className="px-4 py-3 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-300 hover:text-gray-800 transition-all duration-300"
                    aria-label="View full details"
                  >
                    <Eye size={20} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const NotificationSystem = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`p-4 rounded-2xl shadow-lg backdrop-blur-sm max-w-sm ${notification.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
              }`}
          >
            <div className="flex items-center space-x-3">
              {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{notification.message}</span>
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

      {/* Quick view modal */}
      <QuickViewModal />

      {/* CART SIDEBAR: opens from right side — same behavior as Mens/Womens */}
      <ProductCartSection isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden w-full bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
          <div className="relative w-full h-[400px] md:h-[400px] lg:h-[400px] flex items-center justify-center">
            <img
              src="/images/don1.png"
              alt="MA VESARII Gender-Free Fragrance Collection"
              className="w-full h-full object-cover object-center"
              style={{
                objectFit: 'cover',
                objectPosition: 'center'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="flex items-center justify-center w-full h-full bg-gradient-to-br from-purple-100 to-pink-100"><div class="text-center"><div class="mx-auto mb-4 text-purple-600"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/></svg></div><h2 class="text-4xl font-bold text-purple-900">Gender-Free Fragrance Collection</h2></div></div>';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20 pointer-events-none"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="mb-6"
                >
                  <Users className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold uppercase tracking-wider mb-6"
                  style={{
                    fontFamily: "Playfair Display, serif",
                    color: "#FFFFFF",
                    textShadow: "3px 3px 12px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)",
                    letterSpacing: "0.1em",
                    lineHeight: "1.2"
                  }}
                >
                  Gender-Free Fragrance
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="h-1.5 w-48 md:w-64 lg:w-80 bg-gradient-to-r from-transparent via-purple-400 to-transparent mx-auto rounded-full mb-6"
                  style={{
                    boxShadow: "0 0 20px rgba(168, 85, 247, 0.8)"
                  }}
                ></motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="text-xl md:text-2xl lg:text-3xl font-semibold"
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    color: "#FFF",
                    textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
                    letterSpacing: "0.08em"
                  }}
                >
                  Beyond Boundaries, Beyond Labels
                </motion.p>
                {/* <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1 }}
                  className="text-base md:text-lg lg:text-xl mt-4 text-purple-100 font-medium"
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    textShadow: "1px 1px 4px rgba(0,0,0,0.7)",
                    letterSpacing: "0.05em"
                  }}
                >
                  Discover Our Inclusive Scent Collection
                </motion.p> */}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Something went wrong
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                <button
                  onClick={fetchGenderFreeScents}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Try Again
                </button>
              </div>
            ) : scents.length === 0 ? (
              <div className="text-center py-16">
                <Users size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No gender-free scents found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Please try again later.
                </p>
              </div>
            ) : (
              <>
                {/* <div className="mb-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    Showing {scents.length} of {totalPages * itemsPerPage} gender-free scents
                  </p>
                </div> */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {scents.map((scent) => (
                    <ScentCard key={scent._id} scent={scent} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-4 mt-12">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex space-x-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 rounded ${currentPage === pageNum
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default GenderFreeFragranceCollection;
