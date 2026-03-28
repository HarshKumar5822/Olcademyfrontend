import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ProductCartSection from '@/pages/ProductCartSection';
import { useWishlist } from '@/WishlistContext';
import { useCart } from '@/CartContext';
import { FiHeart, FiX } from 'react-icons/fi';
import { ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const SORT_OPTIONS = [
  { value: '', label: 'Sort by' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Rating: High to Low' },
  { value: 'rating-asc', label: 'Rating: Low to High' },
];

const Wishlist = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  // State management for notifications and cart sidebar
  const [notifications, setNotifications] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { wishlistItems, removeFromWishlist, isInitialized, refreshWishlist, addToWishlist } = useWishlist();
  const { isInCart, addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  // Add notification helper
  const addNotification = useCallback((message, type = 'success', productName = null, actionType = 'general') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type, productName, actionType }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored) setDarkMode(JSON.parse(stored));
  }, []);
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (isInitialized && wishlistItems.length > 0) refreshWishlist();
  }, [isInitialized]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleProductClick = (item) => {
    if (!item || !item.id) return;
    if (
      item.source === 'scent' ||
      ['trending', 'best-seller', 'signature', 'limited-edition'].includes(item.collection)
    ) {
      navigate(`/scent/${item.id}`);
    } else if (item.source === 'product') {
      navigate(`/product/${item.id}`);
    } else {
      if (item.scentFamily || item.intensity || item.concentration || item.brand) {
        navigate(`/scent/${item.id}`);
      } else {
        navigate(`/product/${item.id}`);
      }
    }
  };

  const handleAddToCart = async (item, e) => {
    if (e) e.stopPropagation();
    if (isInCart(item.id, item.selectedSize)) {
      setIsCartOpen(true);
      return;
    }
    try {
      const success = await addToCart(item);
      if (success) {
        addNotification(null, 'success', item.name, 'cart');
      } else {
        addNotification('Failed to add item to cart', 'error');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      addNotification('Something went wrong. Please try again.', 'error');
    }
  };

  const handleRemoveFromWishlist = (item, e) => {
    if (e) e.stopPropagation();
    removeFromWishlist(item.id);
    addNotification('Removed from wishlist', 'success', item.name, 'wishlist');
  };

  const handleContinueShopping = () => navigate('/');

  let filteredItems = wishlistItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (sortBy === 'price-asc') {
    filteredItems = filteredItems.slice().sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortBy === 'price-desc') {
    filteredItems = filteredItems.slice().sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sortBy === 'rating-desc') {
    filteredItems = filteredItems.slice().sort((a, b) =>
      Number(b.rating || 0) < Number(a.rating || 0) ? 1 : -1
    );
  } else if (sortBy === 'rating-asc') {
    filteredItems = filteredItems.slice().sort((a, b) =>
      Number(a.rating || 0) - Number(b.rating || 0)
    );
  }

  useEffect(() => {
    if (isAuthenticated) {
      // Sync local storage wishlist to MongoDB
      const localWishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
      localWishlist.forEach(item => {
        addToWishlist(item);
      });
      localStorage.removeItem('wishlist'); // Clear local storage after syncing
      refreshWishlist();
    }
  }, [isAuthenticated]);

  if (!isInitialized) {
    return (
      <div className="bg-[#faf6f2] font-sans min-h-screen">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        <div className="flex items-center justify-center py-24 text-[#5A2408] text-xl font-medium">
          Loading wishlist...
        </div>
        <Footer />
      </div>
    );
  }

  // Notification System
  const NotificationSystem = () => (
    <div className="fixed z-[10000] space-y-3" style={{ top: '40px', right: '20px' }}>
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
                <FiHeart size={40} style={{ color: '#AC9157' }} />
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
              <FiX size={24} style={{ color: '#242122' }} />
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
                  ? 'Removed from Wishlist'
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
    <motion.div
      className="bg-[#FAF6F2] font-sans min-h-screen flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <NotificationSystem />
      {/* CART SIDEBAR */}
      <ProductCartSection isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="max-w-[1616px] w-full mx-auto text-center pt-12">
        <h2 className="text-[36px] font-playfair font-semibold tracking-[2px] uppercase text-[#5A2408] mb-10">
          User’s Wishlist
        </h2>

        <div className="flex flex-col sm:flex-row justify-center items-center mb-12 gap-4 px-4">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-[48px] w-full sm:w-[60%] md:w-[600px] bg-transparent border border-[#5A2408]  font-manrope font-medium text-[#5A2408] text-[16px] px-4 placeholder-[#5A2408] focus:outline-none"
          />

          <div
            className="relative w-full sm:w-[30%] md:w-[200px] select-none"
            ref={dropdownRef}
          >
            <button
              type="button"
              onClick={() => setDropdownOpen((open) => !open)}
              className="flex items-center justify-between w-full h-[48px] px-3 border border-[#5A2408]  font-manrope font-medium text-[#5A2408] text-[16px] bg-[#FAF6F2] transition duration-200 ease-in-out focus:outline-none"
            >
              {SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label || 'Sort by'}
              <svg
                className={`ml-2 h-5 w-5 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M6 8l4 4 4-4"
                  stroke="#5A2408"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 right-0 shadow-lg border border-t-0 border-[#5A2408]  bg-[#FAF6F2] overflow-hidden z-10 max-h-50 ">
                {SORT_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setDropdownOpen(false);
                    }}
                    className={`px-2 py-3 cursor-pointer font-manrope text-[14px] text-[#5A2408] transition-colors duration-200
                      hover:bg-[#fcf1e7] ${
                        sortBy === opt.value ? 'bg-[#ecdecb]' : ''
                      }`}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto flex-grow px-4">
        {!filteredItems.length ? (
          <div className="text-center py-24">
            <FiHeart className="mx-auto h-20 w-20 text-[#D7C9B7]" />
            <p className="text-[24px] font-semibold font-playfair text-[#5A2408] uppercase mt-4 mb-2">
              Nothing in Wishlist
            </p>
            <p className="text-[#5A2408] font-medium font-manrope text-[17px] mb-6">
              Start adding products you love to your wishlist!
            </p>
            <button
              onClick={handleContinueShopping}
              className="bg-[#5A2408] hover:bg-[#3B1505] text-white uppercase text-[15px] font-bold font-manrope px-8 py-3  transition"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center gap-x-8 gap-y-12 mb-16">
            {filteredItems.map((item) => (
              <motion.div
                key={`${item.id}-${item.selectedSize || 'default'}`}
                className="relative bg-white border border-[#E5E1DD]  flex flex-col justify-between shadow-sm pt-6 pb-0 w-[300px] min-h-[460px] transition duration-200"
                whileHover={{ scale: 1.02 }}
              >
                <button
                  onClick={(e) => handleRemoveFromWishlist(item, e)}
                  className="absolute top-4 right-5 text-[#5A2408] hover:text-[#B04C3C] bg-transparent focus:outline-none"
                  title="Remove from wishlist"
                >
                  <FiX size={22} />
                </button>

                <div className="flex flex-col items-center px-5 flex-grow">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="object-contain w-[190px] h-[190px] mb-5 cursor-pointer"
                    onClick={() => handleProductClick(item)}
                  />
                  <h3
                    onClick={() => handleProductClick(item)}
                    className="text-center font-playfair font-semibold text-[#5A2408] uppercase text-[17px] leading-snug tracking-wide cursor-pointer px-2 mb-2"
                  >
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < (item.rating || 5)
                            ? 'text-[#5A2408]'
                            : 'text-[#E5E1DD]'
                        }`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <polygon points="10,1 12.5,7.5 19,8 14,12 15.5,18 10,14.5 4.5,18 6,12 1,8 7.5,7.5" />
                      </svg>
                    ))}
                  </div>
                  {item.description && (
                    <p className="text-center text-[#5A2408] font-manrope text-[13px] px-3 mb-3 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  <p className="text-[#5A2408] text-[16px] font-bold font-manrope mb-1">
                    ${item.price}
                  </p>
                </div>

                <button
                  onClick={(e) => handleAddToCart(item, e)}
                  disabled={false}
                  className={`w-full h-[48px] bg-[#431A06] hover:bg-[#3B1505] uppercase text-white text-[14px] font-semibold font-manrope  transition flex items-center justify-center gap-2`}
                >
                  <ShoppingCart size={18} />
                  <span>
                    Add to Cart
                  </span>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </motion.div>
  );
};

export default Wishlist;