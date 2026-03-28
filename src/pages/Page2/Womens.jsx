import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Footer from '@/components/common/Footer';
import Button from '../../components/ui/Button';
import ProductCartSection from '../../pages/ProductCartSection';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '../../variants';
import { useCart } from '@/CartContext';
import { useWishlist } from '@/WishlistContext';
import { Star, ShoppingCart, CheckCircle, AlertCircle, Heart, X } from 'lucide-react';
import { FiHeart } from 'react-icons/fi';
import ProductService from '../../services/productService';
import CollectionHero from '../../components/common/CollectionHero';


const WomensCollection = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [isCartOpen, setIsCartOpen] = useState(false);

  const [collections, setCollections] = useState({
    just_arrived: [],
    best_sellers: [],
    huntsman_savile_row: []
  });

  const [banners, setBanners] = useState({
    hero: null,
    product_highlight: [],
    collection_highlight: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [expandedSections, setExpandedSections] = useState({
    just_arrived: false,
    best_sellers: false,
    huntsman_savile_row: false
  });

  // Unified notifications state
  const [notifications, setNotifications] = useState([]);

  // Notification helper (matches MensCollection)
  const addNotification = useCallback((message, type = 'success', productName = null, actionType = 'general') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, productName, actionType }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  // Load theme preference
  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) setDarkMode(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Fetch products and banners from backend
  useEffect(() => {
    const fetchWomensData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [productsResponse, bannersResponse] = await Promise.all([
          ProductService.getWomensCollections().catch(err => ({ success: false, error: err.message })),
          ProductService.getWomensBanners().catch(err => ({ success: false, error: err.message }))
        ]);

        if (productsResponse.success && productsResponse.data) {
          setCollections({
            just_arrived: productsResponse.data.just_arrived || [],
            best_sellers: productsResponse.data.best_sellers || [],
            huntsman_savile_row: productsResponse.data.huntsman_savile_row || []
          });
        } else {
          setCollections({ just_arrived: [], best_sellers: [], huntsman_savile_row: [] });
        }

        if (bannersResponse.success && bannersResponse.data) {
          const bannersByType = {
            hero: null,
            product_highlight: [],
            collection_highlight: []
          };

          (bannersResponse.data || []).forEach(banner => {
            if (banner.type === 'hero') {
              bannersByType.hero = banner;
            } else if (banner.type === 'product_highlight') {
              bannersByType.product_highlight.push(banner);
            } else if (banner.type === 'collection_highlight') {
              bannersByType.collection_highlight.push(banner);
            }
          });

          setBanners(bannersByType);
        } else {
          setBanners({ hero: null, product_highlight: [], collection_highlight: [] });
        }
      } catch (err) {
        setError(err.message);
        setCollections({ just_arrived: [], best_sellers: [], huntsman_savile_row: [] });
        setBanners({ hero: null, product_highlight: [], collection_highlight: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchWomensData();
  }, []);

  // Handle banner click tracking
  const handleBannerClick = useCallback(async (banner) => {
    if (banner && banner._id) {
      try {
        await ProductService.trackBannerClick(banner._id);
      } catch (error) {
        console.error('Error tracking banner click:', error);
      }
    }
  }, []);

  // Toggle section expansion
  const toggleSection = useCallback((sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  }, []);

  // ProductCard component with notifications matching MensCollection
  const ProductCard = memo(({ product }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [imageError, setImageError] = useState({ primary: false, hover: false });
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    if (!product) {
      return (
        <div className="w-full max-w-[290px] bg-gray-200 dark:bg-gray-700 animate-pulse p-6">
          <div className="h-[200px] bg-gray-300 dark:bg-gray-600  mb-4"></div>
          <div className="space-y-3">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 "></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600  w-3/4"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 "></div>
          </div>
        </div>
      );
    }

    const validateProduct = (product) => {
      const requiredFields = ['_id', 'name', 'price'];
      return requiredFields.every(field => product[field]);
    };

    const productInCart = isInCart(product._id?.toString(), product.sizes && product.sizes.length > 0 ? product.sizes[0].size : null);

    const handleAddToCart = async (e) => {
      e.stopPropagation();

      if (!validateProduct(product)) {
        addNotification('Product information is incomplete', 'error', null, 'general');
        return;
      }

      setIsAddingToCart(true);

      const cartItem = {
        id: product._id.toString(),
        name: product.name,
        price: Number(product.price),
        image: product.images && product.images.length > 0 ? product.images[0] : '/images/default-gift.png',
        quantity: 1,
        selectedSize: product.sizes && product.sizes.length > 0 ? product.sizes[0].size : null,
        personalization: null
      };

      try {
        const success = await addToCart(cartItem);
        if (success) {
          addNotification(`Added to cart!`, 'success', product.name, 'cart');
        } else {
          addNotification('Failed to add item to cart', 'error', null, 'cart');
        }
      } catch (error) {
        console.error('Add to cart error:', error);
        addNotification('Something went wrong. Please try again.', 'error', null, 'cart');
      } finally {
        setIsAddingToCart(false);
      }
    };

    const handleWishlistToggle = (e) => {
      e.stopPropagation();

      if (!product._id) {
        addNotification('Unable to add to wishlist', 'error', null, 'wishlist');
        return;
      }

      try {
        const wasInWishlist = isInWishlist(product._id);

        const wishlistProduct = {
          id: product._id.toString(),
          name: product.name,
          price: product.price,
          image: product.images && product.images.length > 0 ? product.images[0] : '/images/default-gift.png',
          description: product.description || '',
          category: product.category || '',
          selectedSize: null
        };

        toggleWishlist(wishlistProduct);

        addNotification(
          wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist!',
          'success',
          product.name,
          'wishlist'
        );
      } catch (error) {
        console.error('Wishlist toggle error:', error);
        addNotification('Failed to update wishlist', 'error', null, 'wishlist');
      }
    };

    const handleCardClick = () => {
      if (!product._id) {
        addNotification('Product not available', 'error', null, 'general');
        return;
      }

      const productId = product._id.toString();
      try {
        navigate(`/product/${productId}`);
      } catch (error) {
        console.error('Navigation error:', error);
        window.location.href = `/product/${productId}`;
      }
    };

    const getProductImage = () => {
      if (isHovered && product.hoverImage && !imageError.hover) {
        return product.hoverImage;
      }
      if (product.images && Array.isArray(product.images) && product.images.length > 0 && !imageError.primary) {
        return product.images[0];
      }
      return '/images/default-gift.png';
    };

    const handleImageError = (e, type = 'primary') => {
      setImageError(prev => ({ ...prev, [type]: true }));
      setImageLoading(false);
      e.target.src = '/images/default-gift.png';
    };

    const handleImageLoad = () => {
      setImageLoading(false);
    };

    // return (
    //   <motion.div
    //     layout
    //     initial={{ opacity: 0, y: 20 }}
    //     animate={{ opacity: 1, y: 0 }}
    //     whileHover={{ y: -8, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
    //     transition={{ duration: 0.3 }}
    //     className="bg-white dark:bg-gray-800 overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 w-full max-w-[331px]"
    //     style={{ height: 'auto', minHeight: '528px' }}
    //     onMouseEnter={() => setIsHovered(true)}
    //     onMouseLeave={() => setIsHovered(false)}
    //     onClick={handleCardClick}
    //   >
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 w-full max-w-[290px] min-h-0 sm:min-h-[420px] flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Image Container */}
        <div className="relative bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden w-full aspect-[290/240] p-3">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin  h-8 w-8 border-b-2 border-[#79300f]"></div>
            </div>
          )}
          <motion.img
            src={getProductImage()}
            alt={product.name || 'Product'}
            className={`object-contain w-full h-full max-w-[160px] sm:max-w-[220px] max-h-[160px] sm:max-h-[220px] ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
            onError={(e) => handleImageError(e, isHovered ? 'hover' : 'primary')}
            onLoad={handleImageLoad}
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
            <FiHeart
              size={14}
              className={`transition-all duration-200 ${isInWishlist(product._id) ? 'fill-red-600 text-red-600' : 'text-gray-700 dark:text-gray-300'}`}
            />
          </motion.button>
        </div>

        {/* Product Info Container */}
        <div className="px-3 py-3 flex flex-col gap-2.5 flex-grow">
          <h3
            className="font-bold uppercase text-center line-clamp-2 text-sm sm:text-lg"
            style={{
              fontFamily: 'Playfair Display, serif',
              letterSpacing: '0.05em',
              color: '#5A2408'
            }}
          >
            {product.name || 'Unnamed Gift'}
          </h3>

          <div className="flex items-center justify-center gap-1">
            {product.rating ? (
              <>
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    size={12}
                    style={{ color: '#5A2408', fill: index < Math.floor(product.rating) ? '#5A2408' : 'transparent' }}
                    className={`${index < Math.floor(product.rating) ? '' : 'opacity-30'}`}
                  />
                ))}
              </>
            ) : (
              <div className="h-3"></div>
            )}
          </div>

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

          <motion.button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            whileHover={{ scale: 1.02, opacity: 0.9 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 text-white font-bold uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full h-[40px] sm:h-[45px] text-[10px] sm:text-xs md:text-sm -mx-3 px-3 mt-auto"
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

  ProductCard.displayName = 'ProductCard';

  // Collection Section Component
  const CollectionSection = memo(({ title, products = [], sectionKey }) => {
    const isExpanded = expandedSections[sectionKey];
    const displayProducts = useMemo(
      () => (isExpanded ? products : products.slice(0, 4)),
      [isExpanded, products]
    );
    const hasMoreProducts = products.length > 4;

    return (
      <section className="py-10 sm:py-14 lg:py-16 px-4 sm:px-6 bg-[#F8F6F3] dark:bg-[#0d0603]">
        <div className="max-w-[1555px] mx-auto">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center font-bold mb-7 sm:mb-10 lg:mb-14 text-3xl sm:text-4xl lg:text-5xl"
            style={{
              fontFamily: 'Playfair Display, serif',
              color: darkMode ? '#f6d110' : '#271004'
            }}
          >
            {title}
          </motion.h3>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 lg:h-28 lg:w-28 border-b-2 border-[#79300f]"></div>
            </div>
          ) : products && products.length > 0 ? (
            <>
              <motion.div
                layout
                //   className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-7 lg:gap-10 mb-7 sm:mb-10 justify-items-center"
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5 sm:gap-7 lg:gap-10 mb-7 sm:mb-10 justify-items-center" >
                <AnimatePresence mode="popLayout">
                  {displayProducts.map(product => {
                    if (!product || !product._id) return null;
                    return <ProductCard key={product._id} product={product} />;
                  })}
                </AnimatePresence>
              </motion.div>

              {hasMoreProducts && (
                <div className="flex justify-center mt-7 sm:mt-10 lg:mt-14">
                  <motion.button
                    onClick={() => toggleSection(sectionKey)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="border-2 transition-all duration-300  w-full max-w-[250px] h-[40px] sm:h-[48px] px-5 flex items-center justify-center"
                    style={{
                      borderColor: '#431A06',
                      backgroundColor: 'transparent',
                      color: '#431A06'
                    }}
                  >
                    <span
                      className="text-base sm:text-lg font-bold uppercase"
                      style={{
                        fontFamily: 'Manrope, sans-serif',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {isExpanded ? 'Show Less' : 'View all Fragrances'}
                    </span>
                  </motion.button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400">
                No products available in this collection.
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Please check back later or try refreshing the page.
              </p>
            </div>
          )}
        </div>
      </section>
    );
  });

  CollectionSection.displayName = 'CollectionSection';

  // Dynamic Banner Component
  const DynamicBanner = memo(({ banner, type = 'hero' }) => {
    if (!banner) return null;

    const handleClick = () => {
      handleBannerClick(banner);
      if (banner.buttonLink) {
        window.location.href = banner.buttonLink;
      }
    };
    const rawBannerSrc = banner.image || banner.backgroundImage;
    const bannerImage = rawBannerSrc ? ProductService.constructBannerURL(rawBannerSrc) : '/images/newimg1.PNG';

    if (type === 'hero') {
      return (
        <CollectionHero
          banner={banner}
          fallbackImage="/images/baner2.jpeg"
          onBannerClick={handleBannerClick}
        />
      );
    }


    if (type === 'collection_highlight') {
      const primarySrc = banner.backgroundImage || banner.image;
      const primaryURL = primarySrc ? ProductService.constructBannerURL(primarySrc) : '/images/newimg1.PNG';
      const altSrc = banner.backgroundImage ? banner.image : banner.backgroundImage;
      const altURL = altSrc ? ProductService.constructBannerURL(altSrc) : null;

      return (
        <motion.section
          variants={fadeIn("up", 0.2)}
          initial="hidden"
          whileInView="show"
          className="relative py-0 overflow-hidden"
        >
          <div className="relative h-[270px] sm:h-[360px] lg:h-[450px]">
            <img
              src={primaryURL}
              alt={banner.altText || banner.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                console.warn('Collection highlight banner failed:', e.target.src);
                if (altURL && e.target.src !== altURL) {
                  e.target.src = altURL;
                } else {
                  e.target.src = '/images/newimg1.PNG';
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-start px-5 sm:px-7 lg:px-10">
              <div className="text-white max-w-2xl">
                {banner.subtitle && (
                  <h3 className="text-xs sm:text-sm lg:text-base font-semibold uppercase mb-2.5 tracking-wider">
                    {banner.subtitle}
                  </h3>
                )}
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3.5 leading-tight" style={{ color: banner.textColor || '#FFFFFF' }}>
                  {banner.title} <br />
                  <span style={{ color: banner.highlightColor || '#f6d110' }}>{banner.titleHighlight}</span>
                </h2>
                <p className="text-xs sm:text-sm lg:text-base mb-5 text-gray-200">{banner.description}</p>
                <Button
                  onClick={handleClick}
                  className="bg-gradient-to-r from-[#79300f] to-[#5a2408] hover:from-[#5a2408] hover:to-[#79300f] text-white px-5 sm:px-7 py-2.5 sm:py-3.5 text-sm sm:text-base font-semibold  shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {banner.buttonText}
                </Button>
              </div>
            </div>
          </div>
        </motion.section>
      );
    }

    if (type === 'product_highlight') {
      const primarySrc = banner.backgroundImage || banner.image;
      const primaryURL = primarySrc ? ProductService.constructBannerURL(primarySrc) : '/images/newimg1.PNG';
      const altSrc = banner.backgroundImage ? banner.image : banner.backgroundImage;
      const altURL = altSrc ? ProductService.constructBannerURL(altSrc) : null;

      return (
        <motion.section
          variants={fadeIn("up", 0.2)}
          initial="hidden"
          whileInView="show"
          className="relative py-0 overflow-hidden"
        >
          <div className="relative h-[270px] sm:h-[360px] lg:h-[450px]">
            <img
              src={primaryURL}
              alt={banner.altText || banner.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                console.warn('Product highlight banner failed:', e.target.src);
                if (altURL && e.target.src !== altURL) {
                  e.target.src = altURL;
                } else {
                  e.target.src = '/images/newimg1.PNG';
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-start px-5 sm:px-7 lg:px-10">
              <div className="text-white max-w-2xl">
                {banner.subtitle && (
                  <h3 className="text-xs sm:text-sm lg:text-base font-semibold uppercase mb-2.5 tracking-wider">
                    {banner.subtitle}
                  </h3>
                )}
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3.5 leading-tight" style={{ color: banner.textColor || '#FFFFFF' }}>
                  {banner.title} <br />
                  <span style={{ color: banner.highlightColor || '#f6d110' }}>{banner.titleHighlight}</span>
                </h2>
                <p className="text-xs sm:text-sm lg:text-base mb-5 text-gray-200">{banner.description}</p>
                <Button
                  onClick={handleClick}
                  className="bg-gradient-to-r from-[#79300f] to-[#5a2408] hover:from-[#5a2408] hover:to-[#79300f] text-white px-5 sm:px-7 py-2.5 sm:py-3.5 text-sm sm:text-base font-semibold  shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {banner.buttonText}
                </Button>
              </div>
            </div>
          </div>
        </motion.section>
      );
    }

    return null;
  });

  DynamicBanner.displayName = 'DynamicBanner';

  // Notification System (matching MensCollection UI)
  const NotificationSystem = memo(() => (
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
              boxShadow:
                '4px 6px 16px 0px rgba(0,0,0,0.1), 18px 24px 30px 0px rgba(0,0,0,0.09), 40px 53px 40px 0px rgba(0,0,0,0.05), 71px 95px 47px 0px rgba(0,0,0,0.01), 110px 149px 52px 0px rgba(0,0,0,0)',
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

            {/* Icon */}
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

            {/* Close Button */}
            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
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

            {/* Title */}
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
                  ? notification.message.includes('Removed')
                    ? 'Removed from Wishlist'
                    : 'Added to Wishlist'
                  : notification.actionType === 'cart'
                    ? 'Added to Cart'
                    : 'Success'}
            </div>

            {/* Product Name or message */}
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
  ));

  NotificationSystem.displayName = 'NotificationSystem';

  if (error) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] text-[#79300f] dark:bg-[#0d0603] dark:text-[#f6d110]">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        <div className="flex justify-center items-center h-64">
          <div className="text-center max-w-2xl mx-auto p-8">
            <h2 className="text-2xl font-bold mb-4">Failed to load content</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => window.location.reload()}
                className="bg-[#79300f] text-white px-6 py-2  hover:bg-[#5a2408] transition-colors"
              >
                Retry
              </Button>
              <Button
                onClick={() => navigate('/')}
                className="bg-gray-500 text-white px-6 py-2  hover:bg-gray-600 transition-colors"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F3] text-[#79300f] dark:bg-[#0d0603] dark:text-[#f6d110]">
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <NotificationSystem />

      <ProductCartSection isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main>
        <motion.section
          variants={fadeIn('up', 0.2)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.2 }}
          className="text-center px-4 sm:px-6 py-6 sm:py-8 lg:py-10 bg-white dark:from-[#0d0603] dark:to-[#1a1410]"
        >
          <motion.h1
            variants={fadeIn('up', 0.3)}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 leading-[120%] text-[#271004] dark:text-[#f6d110]"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Women's Scents
          </motion.h1>
          <motion.p
            variants={fadeIn('up', 0.4)}
            className="text-sm sm:text-base lg:text-lg leading-relaxed max-w-[734px] mx-auto text-[#3A3A3A] dark:text-gray-300 px-4"
            style={{ letterSpacing: '0.02em', fontFamily: 'Manrope, sans-serif' }}
          >
            Elegant, floral, and sensual notes designed to capture grace and allure.
          </motion.p>
        </motion.section>

        {banners.hero && <DynamicBanner banner={banners.hero} type="hero" />}

        <CollectionSection title="Just Arrived" products={collections.just_arrived} sectionKey="just_arrived" />

        {banners.product_highlight.map((banner, index) => (
          <DynamicBanner key={banner._id || index} banner={banner} type="product_highlight" />
        ))}

        <CollectionSection title="Best Sellers" products={collections.best_sellers} sectionKey="best_sellers" />

        {banners.collection_highlight.map((banner, index) => (
          <DynamicBanner key={banner._id || index} banner={banner} type="collection_highlight" />
        ))}

        <CollectionSection title="Huntsman Savile Row" products={collections.huntsman_savile_row} sectionKey="huntsman_savile_row" />
      </main>

      <Footer />
    </div>
  );
};

export default WomensCollection;