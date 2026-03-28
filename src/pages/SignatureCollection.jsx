import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ProductCartSection from '../pages/ProductCartSection';
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

const SignatureCollection = () => {
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
  
  // CART SIDEBAR
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Add notification helper
  const addNotification = useCallback((message, type = 'success', productName = null, actionType = 'general') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type, productName, actionType }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  // Fetch signature scents
  const fetchSignatureScents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        isActive: true
      };
      const response = await ScentService.getSignatureScents(params);

      if (response.success) {
        setScents(response.data || []);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
        }
      } else {
        setError(response.message || 'Failed to fetch signature scents');
        setScents([]);
      }
    } catch (err) {
      console.error('Error fetching signature scents:', err);
      setError('Failed to load signature scents');
      setScents([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  // Load scents on mount
  useEffect(() => {
    fetchSignatureScents();
  }, [fetchSignatureScents]);

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

  // Scent Card Component
  const ScentCard = memo(({ scent, addToCart, isInCart, toggleWishlist, isInWishlist, navigate, addNotification, setIsCartOpen }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [imageError, setImageError] = useState({ primary: false, hover: false });
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    if (!scent) return null;

    const handleAddToCart = async (e) => {
      e.stopPropagation();
      setIsAddingToCart(true);

      const cartItem = {
        id: scent._id.toString(),
        name: scent.name,
        price: Number(scent.price),
        image: scent.images && scent.images.length > 0 ? scent.images[0] : "/images/default-scent.png",
        quantity: 1,
        selectedSize: scent.sizes && scent.sizes.length > 0 ? scent.sizes[0].size : null,
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
          image: scent.images && scent.images.length > 0 ? scent.images[0] : "/images/default-scent.png",
          description: scent.description || "",
          category: scent.category || "",
          selectedSize: null,
        };

        toggleWishlist(wishlistItem);
        addNotification(wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist!', 'success', scent.name, 'wishlist');
      } catch (error) {
        console.error('Wishlist toggle error:', error);
        addNotification('Failed to update wishlist', 'error');
      }
    };

    const handleCardClick = () => {
      if (!scent._id) return;
      navigate(`/scent/${scent._id.toString()}`);
    };

    const getScentImage = () => {
      if (isHovered && scent.hoverImage && !imageError.hover) return scent.hoverImage;
      if (scent.images && scent.images.length > 0 && !imageError.primary) return scent.images[0];
      return "/images/default-scent.png";
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
        <div className="relative bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden w-full aspect-[290/240] p-3">
          <motion.img
            src={getScentImage()}
            alt={scent.name}
            className="object-contain w-full h-full max-w-[248px] max-h-[248px]"
            onError={(e) => {
              setImageError(prev => ({ ...prev, [isHovered ? 'hover' : 'primary']: true }));
              e.target.src = "/images/default-scent.png";
            }}
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 0.4 }}
          />
          <motion.button
            onClick={handleWishlistToggle}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-2.5 right-2.5 bg-white dark:bg-gray-800 rounded-full p-1.5 z-10 w-[27px] h-[27px] flex items-center justify-center shadow-sm"
          >
            <FiHeart size={14} className={isInWishlist(scent._id) ? "fill-red-600 text-red-600" : "text-gray-700 dark:text-gray-300"} />
          </motion.button>
        </div>
        <div className="px-3.5 py-3.5 flex flex-col gap-3.5">
          <h3 className="font-bold uppercase text-center line-clamp-1 text-lg sm:text-xl md:text-2xl" style={{ fontFamily: "Playfair Display, serif", letterSpacing: "0.05em", color: "#5A2408" }}>
            {scent.name}
          </h3>
          <div className="flex items-center justify-center gap-1">
            {scent.rating && [...Array(5)].map((_, index) => (
              <Star key={index} size={14} style={{ color: "#5A2408", fill: index < Math.floor(scent.rating) ? "#5A2408" : "transparent" }} className={index < Math.floor(scent.rating) ? "" : "opacity-30"} />
            ))}
          </div>
          <p className="text-center line-clamp-2 text-sm sm:text-base" style={{ fontFamily: "Manrope, sans-serif", fontWeight: "500", color: "#7E513A", minHeight: "40px" }}>
            {scent.description}
          </p>
          <p className="font-bold text-center text-lg sm:text-xl" style={{ fontFamily: "Manrope, sans-serif", color: "#431A06" }}>
            ${typeof scent.price === "number" ? scent.price.toFixed(2) : "0.00"}
          </p>
          <motion.button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            whileHover={{ scale: 1.02, opacity: 0.9 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 text-white font-bold uppercase w-full h-[54px] sm:h-[60px]"
            style={{ backgroundColor: "#431A06", fontFamily: "Manrope, sans-serif", letterSpacing: "0.05em", borderRadius: "0" }}
          >
            <ShoppingCart size={20} />
            <span>{isAddingToCart ? "Adding..." : "Add to Cart"}</span>
          </motion.button>
        </div>
      </motion.div>
    );
  });

  const QuickViewModal = () => {
    if (!quickViewProduct) return null;
    const handleClose = () => setQuickViewProduct(null);
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleClose}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#79300f]">Quick View</h3>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <img src={quickViewProduct.images?.[0] || '/images/default-scent.png'} alt={quickViewProduct.name} className="w-full h-64 object-contain rounded-2xl bg-gray-100" />
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-gray-900">{quickViewProduct.name}</h4>
                <p className="text-gray-600">{quickViewProduct.description}</p>
                <p className="text-2xl font-bold text-[#79300f]">${quickViewProduct.price?.toFixed(2)}</p>
                <button onClick={() => { addToCart({ ...quickViewProduct, id: quickViewProduct._id, quantity: 1 }); handleClose(); }} className="w-full bg-[#79300f] text-white py-3 rounded-xl font-semibold">Add to Cart</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const NotificationSystem = () => (
    <div className="fixed z-[9999] space-y-3" style={{ top: '40px', right: '20px' }}>
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div key={notification.id} initial={{ opacity: 0, x: 400 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 400 }} className="relative w-[400px] h-[100px] bg-[#EDE4CF] shadow-xl rounded-sm overflow-hidden">
            <div className="absolute left-4 top-0 w-3 h-full bg-[#AC9157]" />
            <div className="absolute top-1/2 -translate-y-1/2 left-12">
               {notification.type === 'error' ? <AlertCircle size={40} color="#AC9157" /> : <CheckCircle size={40} color="#AC9157" />}
            </div>
            <div className="absolute top-6 left-24">
              <p className="font-['Playfair_Display'] font-bold text-xl">{notification.type === 'error' ? 'Error' : 'Success'}</p>
              <p className="text-gray-600 text-sm">{notification.productName || notification.message}</p>
            </div>
            <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))} className="absolute top-2 right-2"><X size={20} /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6F3] text-[#79300f]">
      <Header />
      <NotificationSystem />
      <QuickViewModal />
      <ProductCartSection isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="flex-1">
        <section className="relative overflow-hidden w-full bg-[#1A1A1A]">
          <div className="relative w-full h-[450px] flex items-center justify-center">
            <img src="/images/NarrativeImage.jpg" alt="Signature Collection" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
                <Award className="w-20 h-20 mb-6 text-[#D4AF37]" />
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-6xl md:text-7xl font-['Playfair_Display'] text-white uppercase tracking-widest mb-4">
                Signature
              </motion.h1>
              <div className="h-1 w-32 bg-[#D4AF37] mb-6" />
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-xl text-white font-['Manrope'] tracking-widest uppercase">
                The Essence of Luxury
              </motion.p>
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#79300f]"></div></div>
            ) : error ? (
              <div className="text-center py-16">
                <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                <p className="text-xl font-bold mb-4">{error}</p>
                <button onClick={fetchSignatureScents} className="bg-[#79300f] text-white px-8 py-3 rounded-md">Try Again</button>
              </div>
            ) : scents.length === 0 ? (
              <div className="text-center py-16">
                <Award size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No signature scents found</h3>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
                  {scents.map((scent) => (
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
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-4 mt-16">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-6 py-2 border border-gray-300 rounded-md disabled:opacity-50">Previous</button>
                    <span className="font-bold">{currentPage} / {totalPages}</span>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-6 py-2 border border-gray-300 rounded-md disabled:opacity-50">Next</button>
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

export default SignatureCollection;
