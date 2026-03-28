import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useCart } from '../CartContext';
import CollectionHero from '../components/common/CollectionHero';

import { useWishlist } from '../WishlistContext';
import ScentService from '../services/scentService';
import ProductCartSection from '../pages/ProductCartSection'; // cart sidebar component
import {
  ShoppingCart,
  Heart,
  Star,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const MensSignatureCollection = () => {
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

  // CART SIDEBAR state (so "View Cart" opens sidebar like MensCollection)
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addNotification = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const fetchMensSignatureScents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page: currentPage, limit: itemsPerPage, isActive: true };
      const response = await ScentService.getMensSignatureScents(params);
      if (response?.success) {
        setScents(response.data || []);
        if (response.pagination) setTotalPages(response.pagination.totalPages);
      } else {
        setError(response?.message || 'Failed to fetch mens signature scents');
        setScents([]);
      }
    } catch (err) {
      setError('Failed to load mens signature scents');
      setScents([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchMensSignatureScents();
  }, [fetchMensSignatureScents]);

  // PRODUCT CARD: square corners & slight gap for button
  const ProductCard = memo(({ scent }) => {
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    if (!scent) return null;

    // normalize id & size to strings for isInCart check
    const selectedSize = scent.sizes?.[0]?.size ?? '';
    const productInCart = isInCart(String(scent._id), String(selectedSize));

    const handleWishlistToggle = (e) => {
      e.stopPropagation();
      toggleWishlist({
        id: String(scent._id),
        name: scent.name,
        price: scent.price,
        image: scent.images?.[0] || '/images/default-scent.png',
        description: scent.description || '',
        selectedSize: null
      });
      addNotification(`${scent.name} wishlist toggled`, 'success');
    };

    const handleAddToCart = async (e) => {
      // stop propagation so card click doesn't fire
      if (e && e.stopPropagation) e.stopPropagation();
      setIsAddingToCart(true);

      const cartItem = {
        id: String(scent._id),
        name: scent.name,
        price: Number(scent.price),
        image: scent.images?.[0] || '/images/default-scent.png',
        quantity: 1,
        selectedSize: selectedSize || '',
        personalization: null,
        brand: scent.brand || '',
        sku: scent.sku || ''
      };

      try {
        const success = await addToCart(cartItem);
        addNotification(success ? `Added ${scent.name} to cart!` : 'Failed to add item to cart', success ? 'success' : 'error');

        // If successfully added, open cart sidebar (optional behaviour similar to many stores)
        // But per your request, we only open sidebar when user clicks "View Cart".
        // So we DO NOT auto-open here. If you want to auto-open, uncomment next line:
        // if (success) setIsCartOpen(true);
      } catch (error) {
        addNotification('Something went wrong. Please try again.', 'error');
      } finally {
        setIsAddingToCart(false);
      }
    };

    const handleProductClick = () => {
      navigate(`/scent/${scent._id}`);
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
      >
        <div>
          <div className="relative bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden w-full aspect-[290/240] p-3" style={{ borderRadius: '0px' }}>
            <img
              src={scent.images?.[0] || "/images/default-scent.png"}
              alt={scent.name}
              className="object-contain w-full h-full max-w-[248px] max-h-[248px]"
              style={{ borderRadius: '0px' }}
            />
            <motion.button
              onClick={handleWishlistToggle}
              whileHover={{ scale: 1.15 }}
              className="absolute top-2.5 right-2.5 bg-white dark:bg-gray-800 rounded-full p-1.5  z-10"
            >
              <Heart size={14} className={isInWishlist(scent._id) ? 'fill-red-600 text-red-600' : 'text-gray-700'} />
            </motion.button>
          </div>
          <div className="px-3.5 pt-3.5 pb-1 flex flex-col gap-3">
            <h3 className="font-bold uppercase text-center text-lg" style={{ fontFamily: 'Playfair Display, serif', color: '#5A2408' }}>
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

        {/* BUTTON - prevent bubbling so parent card click doesn't run */}
        <div className="w-full flex flex-col items-center" style={{ paddingBottom: '1.5rem' }}>
          <motion.button
            onClick={handleAddToCart}
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
            <ShoppingCart size={20} />
            <span>{isAddingToCart ? "Adding..." : "Add to Cart"}</span>
          </motion.button>
        </div>
      </motion.div>
    );
  });

  ProductCard.displayName = 'ProductCard';

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

      {/* Cart sidebar (right side) */}
      <ProductCartSection isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="flex-1">
        {/* BANNER SECTION */}
        <CollectionHero
          banner={{
            title: "Men's Signature",
            titleHighlight: "Collection",
            description: "Explore the essence of masculinity with our most prestigious signature scents.",
            backgroundImage: "/images/unisex.png",
            buttonText: "Explore Collection",
            buttonLink: "#products"
          }}
          fallbackImage="/images/unisex.png"
        />


        {/* PRODUCTS GRID */}
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex justify-center py-32">
                <div className="animate-spin h-32 w-32 rounded-full border-b-2 border-purple-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <AlertCircle size={40} className="mx-auto mb-4 text-red-500" />
                <button onClick={fetchMensSignatureScents} className="px-6 py-3 bg-purple-600 text-white rounded-xl">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {scents.map((scent) => (
                    <ProductCard key={scent._id} scent={scent} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MensSignatureCollection;
