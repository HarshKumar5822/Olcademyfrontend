import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ProductCartSection from '../pages/ProductCartSection';
import CollectionHero from '../components/common/CollectionHero';

import { useCart } from '../CartContext';
import { useWishlist } from '../WishlistContext';
import ScentService from '../services/scentService';
import {
  ShoppingBag,
  ShoppingCart,
  Heart,
  Eye,
  Star,
  RefreshCw,
  Award,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { FiHeart } from 'react-icons/fi';

const BestSellersCollection = () => {
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // State management
  const [scents, setScents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;

  // ADD THIS STATE FOR CART SIDEBAR
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Add notification helper
  const addNotification = useCallback((message, type = 'success', productName = null, actionType = 'general') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type, productName, actionType }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  // Fetch best seller scents
  const fetchBestSellerScents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        isActive: true
      };

      const response = await ScentService.getBestSellerScents(params);

      if (response.success) {
        setScents(response.data || []);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
        }
      } else {
        setError(response.message || 'Failed to fetch best seller scents');
        setScents([]);
      }
    } catch (err) {
      console.error('Error fetching best seller scents:', err);
      setError('Failed to load best seller scents');
      setScents([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  // Load scents on mount
  useEffect(() => {
    fetchBestSellerScents();
  }, [fetchBestSellerScents]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle add to cart
  const handleAddToCart = async (scent, e) => {
    e.stopPropagation();

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
      if (success) {
        addNotification(null, 'success', scent.name, 'cart');
      } else {
        addNotification('Failed to add item to cart', 'error');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      addNotification('Something went wrong. Please try again.', 'error');
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = (scent, e) => {
    e.stopPropagation();

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
        'success',
        scent.name,
        'wishlist'
      );
    } catch (error) {
      console.error('Wishlist toggle error:', error);
      addNotification('Failed to update wishlist', 'error');
    }
  };

  // Navigate to product detail
  const handleProductClick = (scent) => {
    if (scent._id) {
      navigate(`/scent/${scent._id}`);
    }
  };

  // Handle Quick View
  const handleQuickView = (scent, e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Quick View clicked for scent:', scent._id, scent.name);
    if (scent && scent._id) {
      setQuickViewProduct(scent);
    } else {
      console.error('Invalid scent for Quick View:', scent);
      addNotification('Unable to show quick view', 'error');
    }
  };

  const ScentCard = memo(({ scent, addToCart, isInCart, toggleWishlist, isInWishlist, navigate, addNotification, setIsCartOpen }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [imageError, setImageError] = useState({ primary: false, hover: false });
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    if (!scent) return null;

    const scentInCart = isInCart(
      scent._id?.toString(),
      scent.sizes && scent.sizes.length > 0 ? scent.sizes[0].size : null
    );

    const handleAddToCart = async (e) => {
      e.stopPropagation();
      setIsAddingToCart(true);

      const cartItem = {
        id: scent._id.toString(),
        name: scent.name,
        price: Number(scent.price),
        image:
          scent.images && scent.images.length > 0
            ? scent.images[0]
            : "/images/default-scent.png",
        quantity: 1,
        selectedSize:
          scent.sizes && scent.sizes.length > 0 ? scent.sizes[0].size : null,
        personalization: null,
      };

      try {
        const success = await addToCart(cartItem);
        if (success) {
          addNotification(null, 'success', scent.name, 'cart');
        } else {
          addNotification('Failed to add item to cart', 'error');
        }
      } catch (error) {
        console.error('Add to cart error:', error);
        addNotification('Something went wrong. Please try again.', 'error');
      } finally {
        setIsAddingToCart(false);
      }
    };

    const handleWishlistToggle = (e) => {
      e.stopPropagation();
      if (!scent._id) {
        addNotification('Unable to add to wishlist', 'error');
        return;
      }

      try {
        const wasInWishlist = isInWishlist(scent._id);

        const wishlistItem = {
          id: scent._id.toString(),
          name: scent.name,
          price: scent.price,
          image:
            scent.images && scent.images.length > 0
              ? scent.images[0]
              : "/images/default-scent.png",
          description: scent.description || "",
          category: scent.category || "",
          selectedSize: null,
        };

        toggleWishlist(wishlistItem);
        addNotification(
          wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist!',
          'success',
          scent.name,
          'wishlist'
        );
      } catch (error) {
        console.error('Wishlist toggle error:', error);
        addNotification('Failed to update wishlist', 'error');
      }
    };

    const handleCardClick = () => {
      if (!scent._id) {
        addNotification('Scent not available', 'error');
        return;
      }
      navigate(`/scent/${scent._id.toString()}`);
    };

    const getScentImage = () => {
      if (isHovered && scent.hoverImage && !imageError.hover) {
        return scent.hoverImage;
      }
      if (
        scent.images &&
        Array.isArray(scent.images) &&
        scent.images.length > 0 &&
        !imageError.primary
      ) {
        return scent.images[0];
      }
      return "/images/default-scent.png";
    };

    const handleImageError = (e, type = "primary") => {
      setImageError((prev) => ({ ...prev, [type]: true }));
      e.target.src = "/images/default-scent.png";
    };

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8, boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 w-full max-w-[290px] min-h-0 sm:min-h-[420px] flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Image Container */}
        <div className="relative bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden w-full aspect-[290/240] p-3">
          <motion.img
            src={getScentImage()}
            alt={scent.name || "Scent"}
            className="object-contain w-full h-full max-w-[248px] max-h-[248px]"
            onError={(e) => handleImageError(e, isHovered ? "hover" : "primary")}
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 0.4 }}
            loading="lazy"
          />

          {/* Wishlist Button */}
          <motion.button
            onClick={handleWishlistToggle}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-2.5 right-2.5 bg-white dark:bg-gray-800 rounded-full p-1.5  transition-all duration-200 z-10 w-[27px] h-[27px] flex items-center justify-center"
            aria-label={
              isInWishlist(scent._id) ? "Remove from wishlist" : "Add to wishlist"
            }
          >
            <FiHeart
              size={14}
              className={`transition-all duration-200 ${isInWishlist(scent._id)
                ? "fill-red-600 text-red-600"
                : "text-gray-700 dark:text-gray-300"
                }`}
            />
          </motion.button>
        </div>

        {/* Info Section */}
        <div className="px-3.5 py-3.5 flex flex-col gap-3.5">
          {/* Name */}
          <h3
            className="font-bold uppercase text-center line-clamp-1 text-lg sm:text-xl md:text-2xl"
            style={{
              fontFamily: "Playfair Display, serif",
              letterSpacing: "0.05em",
              color: "#5A2408",
              minHeight: "28px",
            }}
          >
            {scent.name || ""}
          </h3>

          {/* Rating */}
          <div
            className="flex items-center justify-center gap-1"
            style={{ minHeight: "18px" }}
          >
            {scent.rating ? (
              [...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  size={14}
                  style={{
                    color: "#5A2408",
                    fill:
                      index < Math.floor(scent.rating) ? "#5A2408" : "transparent",
                  }}
                  className={`${index < Math.floor(scent.rating) ? "" : "opacity-30"
                    }`}
                />
              ))
            ) : (
              <div className="h-3.5"></div>
            )}
          </div>

          {/* Description */}
          <p
            className="text-center line-clamp-2 text-sm sm:text-base"
            style={{
              fontFamily: "Manrope, sans-serif",
              fontWeight: "500",
              letterSpacing: "0.02em",
              color: "#7E513A",
              minHeight: "40px",
            }}
          >
            {scent.description || ""}
          </p>

          {/* Price */}
          <p
            className="font-bold text-center text-lg sm:text-xl"
            style={{
              fontFamily: "Manrope, sans-serif",
              letterSpacing: "0.02em",
              color: "#431A06",
              minHeight: "24px",
            }}
          >
            ${typeof scent.price === "number" ? scent.price.toFixed(2) : "0.00"}
          </p>

          {/* Add to Cart Button */}
          <motion.button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            whileHover={{ scale: 1.02, opacity: 0.9 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 sm:gap-2.5 text-white font-bold uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full h-[54px] sm:h-[60px] text-sm sm:text-base md:text-lg -mx-3.5 px-3.5"
            style={{
              backgroundColor: "#431A06",
              fontFamily: "Manrope, sans-serif",
              letterSpacing: "0.05em",
              width: "calc(100% + 28px)",
            }}
          >
            <ShoppingCart size={20} className="sm:w-[24px] sm:h-[24px]" />
            <span>
              {isAddingToCart ? "Adding..." : "Add to Cart"}
            </span>
          </motion.button>
        </div>
      </motion.div>
    );
  });


  ScentCard.displayName = 'ScentCard';

  // Quick View Modal
  const QuickViewModal = () => {
    if (!quickViewProduct) {
      return null;
    }

    const handleClose = () => {
      setQuickViewProduct(null);
    };

    const handleQuickViewWishlist = () => {
      if (quickViewProduct._id) {
        try {
          const wasInWishlist = isInWishlist(quickViewProduct._id);
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
            wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist!',
            'success',
            quickViewProduct.name,
            'wishlist'
          );
        } catch (error) {
          console.error('Wishlist toggle error:', error);
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
          addNotification(null, 'success', quickViewProduct.name, 'cart');
          handleClose();
        } else {
          addNotification('Failed to add item to cart', 'error');
        }
      } catch (error) {
        console.error('Quick View Add to cart error:', error);
        addNotification('Something went wrong. Please try again.', 'error');
      }
    };

    const productInQuickViewCart = isInCart(quickViewProduct._id?.toString(), quickViewProduct.sizes && quickViewProduct.sizes.length > 0 ? quickViewProduct.sizes[0].size : null);

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
              <h3 className="text-2xl font-bold text-[#79300f] dark:text-[#f6d110]">
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
                <p className="text-2xl font-bold text-[#79300f] dark:text-[#f6d110]">
                  ${quickViewProduct.price ? quickViewProduct.price.toFixed(2) : '0.00'}
                </p>

                {/* Scent Details */}
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
                    <button
                      onClick={handleQuickViewAddToCart}
                      className="flex-1 bg-gradient-to-r from-[#79300f] to-[#5a2408] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <ShoppingBag size={20} />
                      <span>Add to Cart</span>
                    </button>
                  <button
                    onClick={handleQuickViewWishlist}
                    className="px-4 py-3 border-2 border-[#79300f] text-[#79300f] rounded-xl hover:bg-[#79300f] hover:text-white transition-all duration-300"
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

  // Notification System
  const NotificationSystem = () => (
    <div className="fixed z-[9999] space-y-3" style={{ top: '40px', right: '20px' }}>
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 400, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 400, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'relative',
              width: '400px',
              height: '100px',
              backgroundColor: '#EDE4CF',
              overflow: 'hidden',
              boxShadow: '4px 6px 16px 0px rgba(0,0,0,0.1), 18px 24px 30px 0px rgba(0,0,0,0.09), 40px 53px 40px 0px rgba(0,0,0,0.05), 71px 95px 47px 0px rgba(0,0,0,0.01), 110px 149px 52px 0px rgba(0,0,0,0)',
              borderRadius: '4px'
            }}
          >
            {/* Left Vertical Bar */}
            <div
              style={{
                position: 'absolute',
                left: '16px',
                top: '0',
                width: '12px',
                height: '100%',
                backgroundColor: '#AC9157'
              }}
            />
            {/* Icon - Show correct icon based on actionType */}
            <div
              style={{
                position: 'absolute',
                top: '30px',
                left: '36px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {notification.type === 'error' ? (
                <AlertCircle size={40} style={{ color: '#AC9157' }} strokeWidth={1.5} />
              ) : notification.actionType === 'wishlist' ? (
                <Heart size={40} style={{ color: '#AC9157' }} strokeWidth={1.5} />
              ) : notification.actionType === 'cart' ? (
                <ShoppingCart size={40} style={{ color: '#AC9157' }} strokeWidth={1.5} />
              ) : (
                <CheckCircle size={40} style={{ color: '#AC9157' }} strokeWidth={1.5} />
              )}
            </div>
            {/* Close Icon */}
            <button
              onClick={() => {
                setNotifications(prev => prev.filter(n => n.id !== notification.id));
              }}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
              aria-label="Close notification"
            >
              <X size={24} style={{ color: '#242122' }} strokeWidth={2} />
            </button>
            {/* Title Text - Show correct title based on actionType */}
            <div
              style={{
                position: 'absolute',
                top: '22px',
                left: '96px',
                fontFamily: 'Playfair Display, serif',
                fontWeight: 700,
                fontSize: '22px',
                lineHeight: '26px',
                color: '#242122',
                whiteSpace: 'nowrap'
              }}
            >
              {notification.type === 'error'
                ? 'Error'
                : notification.actionType === 'wishlist'
                  ? (notification.message && notification.message.includes('Removed') ? 'Removed from Wishlist' : 'Added to Wishlist')
                  : notification.actionType === 'cart'
                    ? 'Added to Cart'
                    : 'Success'
              }
            </div>
            {/* Product Name or Message */}
            <div
              style={{
                position: 'absolute',
                top: '56px',
                left: '96px',
                width: '271px',
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: '22px',
                color: '#5B5C5B',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {notification.productName || notification.message}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5F0] dark:bg-gray-900">
      <Header />
      <NotificationSystem />
      <QuickViewModal />
      {/* CART SIDEBAR */}
      <ProductCartSection isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="flex-1">
        <CollectionHero
          banner={{
            title: "Best Sellers",
            titleHighlight: "Collection",
            description: "Discover our most-loved fragrances, curated by our community and experts.",
            backgroundImage: "/images/don1.png",
            buttonText: "Shop Best Sellers",
            buttonLink: "#just_arrived"
          }}
          fallbackImage="/images/don1.png"
        />


        {/* Products Grid */}
        < section className="py-12 px-6" >
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Something went wrong
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                <button
                  onClick={fetchBestSellerScents}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Try Again
                </button>
              </div>
            ) : scents.length === 0 ? (
              <div className="text-center py-16">
                <Award size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No best sellers found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Please try again later.
                </p>
              </div>
            ) : (
              <>
                {/* <div className="mb-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    Showing {scents.length} of {totalPages * itemsPerPage} best seller scents
                  </p>
                </div> */}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {scents.map((scent) => {
                    if (!scent || !scent._id) {
                      console.warn('Invalid scent:', scent);
                      return null;
                    }
                    return (
                      <ScentCard
                        key={scent._id}
                        scent={scent}
                        addToCart={addToCart}
                        isInCart={isInCart}
                        toggleWishlist={toggleWishlist}
                        isInWishlist={isInWishlist}
                        navigate={navigate}
                        addNotification={addNotification}
                        setIsCartOpen={setIsCartOpen}
                      />
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-4 mt-12">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Previous
                    </button>

                    {/* Page numbers */}
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
                              ? 'bg-yellow-500 text-white'
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
        </section >
      </main >

      <Footer />
    </div >
  );
};

export default BestSellersCollection;