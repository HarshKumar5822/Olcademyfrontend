import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useCart } from '../CartContext';
import CollectionHero from '../components/common/CollectionHero';

import { useWishlist } from '../WishlistContext';
import ScentService from '../services/scentService';
import ProductCartSection from '../pages/ProductCartSection';

import {
  ShoppingCart,
  Heart,
  Star,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import ProductCardsMobile from '../components/Mobile/ProductCardsMobile';

const WomensSignatureCollection = () => {
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

  // Mobile View Logic
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sidebar cart (same as MensSignatureCollection)
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addNotification = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const fetchWomensSignatureScents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page: currentPage, limit: itemsPerPage, isActive: true };
      const response = await ScentService.getWomensSignatureScents(params);

      if (response?.success) {
        setScents(response.data || []);
        if (response.pagination) setTotalPages(response.pagination.totalPages);
      } else {
        setError(response?.message || 'Failed to fetch women signature scents');
        setScents([]);
      }
    } catch (err) {
      setError('Failed to load womens signature scents');
      setScents([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchWomensSignatureScents();
  }, [fetchWomensSignatureScents]);


  const ProductCard = memo(({ scent: product }) => {
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isHovered, setIsHovered] = useState(false); // Added for hover effect matching Home
    const [imageError, setImageError] = useState({ primary: false, hover: false }); // Added for image error handling matching Home

    if (!product) return null;

    const selectedSize = product.sizes?.[0]?.size ?? "";
    const productInCart = isInCart(String(product._id), String(selectedSize));

    const handleWishlistToggle = (e) => {
      e.stopPropagation();
      toggleWishlist({
        id: String(product._id),
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '/images/default-scent.png',
        description: product.description || '',
        selectedSize: null
      });
      addNotification(`${product.name} wishlist toggled`, "success");
    };

    const handleAddToCart = async (e) => {
      if (e && e.stopPropagation) e.stopPropagation();
      setIsAddingToCart(true);

      const cartItem = {
        id: String(product._id),
        name: product.name,
        price: Number(product.price),
        image: product.images?.[0] || '/images/default-scent.png',
        quantity: 1,
        selectedSize: selectedSize,
        personalization: null,
        brand: product.brand || '',
        sku: product.sku || ''
      };

      try {
        const success = await addToCart(cartItem);
        addNotification(
          success ? `Added ${product.name} to cart!` : 'Failed to add item',
          success ? "success" : "error"
        );
      } catch {
        addNotification("Something went wrong.", "error");
      } finally {
        setIsAddingToCart(false);
      }
    };

    const getProductImage = () => {
      if (isHovered && product.hoverImage && !imageError.hover) {
        return product.hoverImage;
      }
      if (product.images && Array.isArray(product.images) && product.images.length > 0 && !imageError.primary) {
        return product.images[0];
      }
      return '/images/default-scent.png';
    };

    const handleImageError = (e, type = 'primary') => {
      setImageError(prev => ({ ...prev, [type]: true }));
      e.target.src = '/images/default-scent.png';
    };


    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 w-full max-w-[290px] min-h-0 sm:min-h-[420px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => navigate(`/scent/${product._id}`)}
      >
        {/* Image Container with Wishlist Icon - RESPONSIVE */}
        <div className="relative bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden w-full aspect-[290/240] p-3">
          <motion.img
            src={getProductImage()}
            alt={product.name || 'Product'}
            className="object-contain w-full h-full max-w-[220px] max-h-[220px]"
            onError={(e) => handleImageError(e, isHovered ? 'hover' : 'primary')}
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 0.4 }}
            loading="lazy"
          />

          {/* Wishlist Heart Icon */}
          <motion.button
            onClick={handleWishlistToggle}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-2.5 right-2.5 bg-white dark:bg-gray-800 p-1.5 transition-all duration-200 z-10 w-[27px] h-[27px] flex items-center justify-center"
            aria-label={isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              size={14}
              className={`transition-all duration-200 ${isInWishlist(product._id) ? 'fill-red-600 text-red-600' : 'text-gray-700 dark:text-gray-300'}`}
            />
          </motion.button>
        </div>

        {/* Product Info Container - RESPONSIVE */}
        <div className="px-3 py-3 flex flex-col gap-2.5">
          {/* Product Name */}
          <h3
            className="font-bold uppercase text-center line-clamp-2 text-base sm:text-lg"
            style={{
              fontFamily: 'Playfair Display, serif',
              letterSpacing: '0.05em',
              color: '#5A2408'
            }}
          >
            {product.name || 'Product'}
          </h3>

          {/* Rating */}
          <div className="flex items-center justify-center gap-1">
            <div className="flex items-center justify-center gap-1 mb-1">
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  size={12}
                  style={{ color: '#5A2408', fill: index < Math.floor(product.rating) ? '#5A2408' : 'transparent' }}
                  className={`${index < Math.floor(product.rating) ? '' : 'opacity-30'}`}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <p
            className="text-center line-clamp-2 text-[10px] sm:text-xs"
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontWeight: '500',
              letterSpacing: '0.02em',
              color: '#7E513A'
            }}
          >
            {product.description || 'Premium fragrance'}
          </p>

          {/* Price */}
          <p
            className="font-bold text-center text-sm sm:text-base"
            style={{
              fontFamily: 'Manrope, sans-serif',
              letterSpacing: '0.02em',
              color: '#431A06'
            }}
          >
            ${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
          </p>

          {/* Add to Cart Button */}
          <motion.button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            whileHover={{ scale: 1.02, opacity: 0.9 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 text-white font-bold uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full h-[40px] sm:h-[45px] text-[10px] sm:text-xs md:text-sm -mx-3 px-3"
            style={{
              backgroundColor: '#431A06',
              fontFamily: 'Manrope, sans-serif',
              letterSpacing: '0.05em',
              width: 'calc(100% + 24px)'
            }}
          >
            <ShoppingCart size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span>
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </span>
          </motion.button>
        </div>
      </motion.div>
    );
  });

  const NotificationSystem = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((note) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`p-4 rounded-xl text-white shadow-lg 
              ${note.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
          >
            <div className="flex items-center gap-3">
              {note.type === "success" ? <CheckCircle /> : <AlertCircle />}
              <span>{note.message}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-F8F6F3">
      <Header />
      <NotificationSystem />

      {/* SIDE CART */}
      <ProductCartSection isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="flex-1">
        {/* BANNER SECTION */}
        <CollectionHero
          banner={{
            title: "Women's Signature",
            titleHighlight: "Collection",
            description: "Experience elegance and allure with our most prestigious signature scents for her.",
            backgroundImage: "/images/unisex.png",
            buttonText: "Explore Collection",
            buttonLink: "#products"
          }}
          fallbackImage="/images/unisex.png"
        />

        <section className="py-10 sm:py-14 lg:py-16 px-4 sm:px-6 bg-[#F8F6F3] dark:bg-[#0d0603]">
          <div className="max-w-[1555px] mx-auto">
            {loading ? (
              <div className="flex justify-center py-32">
                <div className="animate-spin h-32 w-32 border-b-2 border-purple-500 rounded-full"></div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <AlertCircle className="mx-auto mb-4 text-red-500" size={40} />
                <button onClick={fetchWomensSignatureScents} className="px-6 py-3 bg-purple-600 text-white rounded-xl">
                  Try Again
                </button>
              </div>
            ) : scents.length === 0 ? (
              <h3 className="text-center py-20 text-xl">No signature scents found</h3>
            ) : (
              <>
                <div className="text-center mb-6 text-gray-400">
                  Showing {scents.length} items
                </div>

                {isMobile ? (
                  <ProductCardsMobile
                    title="Women's Signature Collection"
                    products={scents}
                    darkMode={false}
                    addNotification={addNotification}
                  />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-7 lg:gap-10 mb-7 sm:mb-10 justify-items-center">
                    {scents.map((scent) => (
                      <ProductCard key={scent._id} scent={scent} />
                    ))}
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

export default WomensSignatureCollection;
