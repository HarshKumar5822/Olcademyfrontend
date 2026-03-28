import React, { useEffect, useRef, useState, useCallback, memo, useMemo } from 'react';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import ProductCartSection from '../../pages/ProductCartSection';
import { API_BASE_URL } from '../../api/constant';
import { useCart } from '@/CartContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, AlertCircle, ShoppingCart, Heart, Eye, X, CheckCircle, Search } from 'lucide-react';
import { FiHeart, FiSearch, FiShoppingBag } from 'react-icons/fi';
import { useWishlist } from '@/WishlistContext';
import ProductService from '../../services/productService';
import ScentService from '../../services/scentService';

const HomePage = () => {
  const [email, setEmail] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { addToCart, cartItems, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  const [collections, setCollections] = useState({
    fragrant_favourites: [],
    summer_scents: [],
    signature_collection: [],
    trending_scents: [],
    best_seller_scents: []
  });

  const [banners, setBanners] = useState({
    hero: null,
    product_highlight: [],
    collection_highlight: [],
  });

  const [notifications, setNotifications] = useState([]);
  const addNotification = useCallback((message, type = 'success', productName = null, actionType = 'cart') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type, productName, actionType }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) setDarkMode(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [productsResponse, bannersResponse, scentsResponse] = await Promise.all([
          ProductService.getHomeCollections().catch((err) => ({ success: false, error: err.message })),
          ProductService.getHomeBanners().catch((err) => ({ success: false, error: err.message })),
          ScentService.getFeaturedScents().catch((err) => ({ success: false, error: err.message })),
        ]);

        if (productsResponse.success && productsResponse.data) {
          setCollections(prev => ({
            ...prev,
            fragrant_favourites: productsResponse.data.fragrant_favourites || [],
            summer_scents: productsResponse.data.summer_scents || [],
            signature_collection: productsResponse.data.signature_collection || [],
          }));
        }

        if (bannersResponse.success && bannersResponse.data) {
          const bannersByType = { hero: null, product_highlight: [], collection_highlight: [] };
          (bannersResponse.data || []).forEach((banner) => {
            if (banner.type === 'hero') bannersByType.hero = banner;
            else if (banner.type === 'product_highlight') bannersByType.product_highlight.push(banner);
            else if (banner.type === 'collection_highlight') bannersByType.collection_highlight.push(banner);
          });
          setBanners(bannersByType);
        }

        if (scentsResponse.success && scentsResponse.data) {
          setCollections(prev => ({
            ...prev,
            trending_scents: scentsResponse.data.trending || [],
            best_seller_scents: scentsResponse.data.best_seller || scentsResponse.data.bestSellers || [],
          }));
        }
      } catch (err) {
        console.error('❌ Error fetching home data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  const handleSubscribe = async () => {
    if (!email) return addNotification("Please enter your email", "error", null, "general");
    if (!validateEmail(email)) return addNotification("Please enter a valid email address", "error", null, "general");
    if (!acceptTerms) return addNotification("Please accept terms & conditions", "error", null, "general");

    try {
      const res = await fetch(`${API_BASE_URL}/api/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        addNotification("Welcome to the Inner Circle!", "success", email, "general");
        setEmail("");
        setAcceptTerms(false);
      } else {
        addNotification(data.message, "error", null, "general");
      }
    } catch (error) {
      addNotification("Something went wrong. Please try again.", "error", null, "general");
    }
  };

  const handleProductClick = (product) => {
    if (product && product._id) {
      navigate(`/product/${product._id.toString()}`);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = e.target.search.value.trim();
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

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
              position: 'relative', width: '400px', height: '100px', backgroundColor: '#EDE4CF', overflow: 'hidden',
              boxShadow: '4px 6px 16px 0px rgba(0,0,0,0.1)', borderRadius: '4px'
            }}
          >
            <div style={{ position: 'absolute', left: '16px', top: '0', width: '12px', height: '100%', backgroundColor: '#AC9157' }} />
            <div style={{ position: 'absolute', top: '30px', left: '36px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {notification.type === 'error' ? <AlertCircle size={40} style={{ color: '#AC9157' }} /> : notification.actionType === 'wishlist' ? <Heart size={40} style={{ color: '#AC9157' }} /> : notification.actionType === 'cart' ? <ShoppingCart size={40} style={{ color: '#AC9157' }} /> : <CheckCircle size={40} style={{ color: '#AC9157' }} />}
            </div>
            <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))} style={{ position: 'absolute', top: '8px', right: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <X size={24} style={{ color: '#242122' }} />
            </button>
            <div style={{ position: 'absolute', top: '22px', left: '96px', fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '22px', color: '#242122' }}>
              {notification.type === 'error' ? 'Error' : notification.actionType === 'wishlist' ? (notification.message.includes('Removed') ? 'Removed from Wishlist' : 'Added to Wishlist') : notification.actionType === 'cart' ? 'Added to Cart' : 'Success'}
            </div>
            <div style={{ position: 'absolute', top: '56px', left: '96px', width: '271px', fontFamily: 'Manrope, sans-serif', fontSize: '16px', color: '#5B5C5B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {notification.productName || notification.message}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const ProductCard = memo(({ product }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    if (!product) return null;
    const productInCart = isInCart(product._id?.toString(), product.sizes && product.sizes.length > 0 ? product.sizes[0].size : null);

    const handleAddToCart = async (e) => {
      e.stopPropagation();
      setIsAddingToCart(true);
      const cartItem = {
        id: product._id.toString(), name: product.name, price: Number(product.price),
        image: product.images && product.images.length > 0 ? product.images[0] : '/images/default-gift.png',
        quantity: 1, selectedSize: product.sizes && product.sizes.length > 0 ? product.sizes[0].size : null, personalization: null
      };

      try {
        const success = await addToCart(cartItem);
        if (success) addNotification('Added to cart!', 'success', product.name, 'cart');
        else addNotification('Failed to add item to cart', 'error', null, 'cart');
      } catch (error) {
        addNotification('Something went wrong. Please try again.', 'error', null, 'cart');
      } finally {
        setIsAddingToCart(false);
      }
    };

    const handleWishlistToggle = (e) => {
      e.stopPropagation();
      if (!product._id) return addNotification('Unable to add to wishlist', 'error', null, 'wishlist');
      try {
        const wasInWishlist = isInWishlist(product._id);
        const wishlistProduct = {
          id: product._id.toString(), name: product.name, price: product.price,
          image: product.images && product.images.length > 0 ? product.images[0] : '/images/default-gift.png',
          description: product.description || '', category: product.category || '', selectedSize: null
        };
        toggleWishlist(wishlistProduct);
        addNotification(wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist!', 'success', product.name, 'wishlist');
      } catch (error) {
        addNotification('Failed to update wishlist', 'error', null, 'wishlist');
      }
    };

    return (
      <div className="bg-white border text-center border-gray-100 flex flex-col group transition-all duration-300 hover:shadow-xl cursor-pointer w-full" onClick={() => handleProductClick(product)}>
        <div className="relative p-6 aspect-square flex items-center justify-center bg-white overflow-hidden">
          <img 
            src={product.images && product.images[0] ? product.images[0] : '/images/default-gift.png'} 
            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" 
            alt={product.name} 
            onError={(e) => { e.target.src = '/images/default-gift.png' }}
          />
          <button onClick={handleWishlistToggle} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100">
            <FiHeart size={16} className={isInWishlist(product._id) ? 'fill-black text-black' : ''} />
          </button>
        </div>
        <div className="p-4 md:p-5 flex-1 flex flex-col items-center justify-between">
          <div className="w-full mb-4">
             <h3 className="font-['Playfair_Display'] text-[15px] sm:text-[16px] xl:text-[18px] mb-2 font-medium tracking-wide line-clamp-1">{product.name}</h3>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 w-full text-xs sm:text-sm">
               <span className="font-bold text-gray-900">${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}</span>
               {product.rating && (
                 <span className="flex items-center text-[#D4AF37] font-semibold">
                    <Star size={12} className="fill-[#D4AF37] ml-0.5 mr-1" />
                    {product.rating.toFixed(1)}
                 </span>
               )}
             </div>
          </div>
          <button 
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="w-full bg-[#1A1A1A] text-white text-[10px] sm:text-[12px] font-bold tracking-widest py-3 hover:bg-black transition-colors flex items-center justify-center gap-2"
          >
            <FiShoppingBag size={14} />
            {isAddingToCart ? 'ADDING...' : 'ADD TO CART'}
          </button>
        </div>
      </div>
    );
  });
  ProductCard.displayName = 'ProductCard';

  return (
    <div className="min-h-screen flex flex-col font-['Manrope'] bg-white w-full overflow-x-hidden">
      <Header />
      <NotificationSystem />
      <ProductCartSection isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
      <main className="flex-1 w-full pt-16 lg:pt-24 mb-16">
        
        {/* HERO SECTION */}
        <section className="w-full flex flex-col-reverse lg:flex-row items-center lg:items-start max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 mb-20 lg:mb-32">
          {/* Left Content */}
          <div className="w-full lg:w-1/2 flex flex-col pt-8 lg:pt-16 lg:pr-16">
            <form onSubmit={handleSearchSubmit} className="w-full md:max-w-md flex border-b-2 border-[#D4AF37] pb-2 mb-10 lg:mb-16">
              <FiSearch className="text-gray-400 mt-1.5 mr-3" size={18} />
              <input 
                type="text" 
                name="search"
                placeholder="Search Perfume/Fragrance" 
                className="flex-1 outline-none text-sm bg-transparent placeholder-gray-400"
              />
              <button type="submit" className="bg-[#D4AF37] text-white text-[11px] font-bold px-6 py-2 tracking-widest hover:bg-[#b8952b] transition-colors ml-2">SEARCH</button>
            </form>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-['Playfair_Display'] text-[#1A1A1A] leading-[1.1] mb-6 tracking-tight">
              Unveil Your<br className="hidden lg:block"/> Signature Scent
            </h1>
            <p className="text-gray-600 text-sm lg:text-base mb-10 max-w-sm leading-relaxed">
              A fragrance that transcends time, inspired by rare woods and exotic elegance.
            </p>
            <button 
              onClick={() => navigate('/signature-collection')}
              className="bg-[#D4AF37] text-white text-xs lg:text-sm font-bold tracking-widest px-8 py-4 w-max hover:bg-[#b8952b] transition-colors shadow-sm"
            >

              SHOP NOW
            </button>
          </div>

          {/* Right Image */}
          <div className="w-full lg:w-1/2 lg:-mt-4 relative aspect-[4/3] lg:aspect-[4/5] lg:h-[700px]">
             <img src="/images/HomeHeroWoman.jpg" alt="Woman holding golden perfume bottle" className="w-full h-full object-cover shadow-2xl" onError={(e) => { e.target.src = '/images/newimg1.PNG' }} />
          </div>
        </section>

        {/* OUR COLLECTION CAROUSEL */}
        <section className="w-full mb-28 max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 text-center">
          <h2 className="font-['Playfair_Display'] text-2xl lg:text-3xl text-[#1A1A1A] font-semibold mb-12">Our Collection</h2>
          
          <div className="relative flex items-center justify-center">
            <button className="hidden md:flex absolute left-0 z-10 w-10 h-10 rounded-full bg-[#E5D5A5] items-center justify-center text-white shrink-0 hover:bg-[#D4AF37] transition-colors shadow-sm cursor-pointer">
               <ChevronLeft size={20} />
            </button>
            
            <div className="flex w-full overflow-x-auto md:overflow-hidden justify-start md:justify-center gap-4 lg:gap-8 px-0 md:px-14 pb-4 scrollbar-hide">
               {(collections.signature_collection.slice(0,4).length > 0 ? collections.signature_collection.slice(0,4) : [
                 { _id: '1', name: 'Vetiver', productCode: 'M05', images: ['/images/1.png'] },
                 { _id: '2', name: 'Santal', productCode: 'P46', images: ['/images/2.png'] },
                 { _id: '3', name: 'Oud', productCode: 'W32', images: ['/images/3.png'] },
                 { _id: '4', name: 'Rose', productCode: 'F40', images: ['/images/4.png'] },
               ]).map((item, i) => (
                  <div key={item._id || i} className="flex flex-col items-center shrink-0" onClick={() => handleProductClick(item)}>
                    <div className="w-[140px] md:w-[200px] lg:w-[230px] aspect-square bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-4 p-8 cursor-pointer hover:shadow-md transition-shadow group">
                      <img 
                        src={item.images?.[0] || '/images/default-gift.png'} 
                        alt={item.name} 
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
                        onError={(e) => { e.target.src = '/images/default-gift.png' }}
                      />
                    </div>
                    <span className="text-[#1A1A1A] font-bold text-[10px] lg:text-xs font-['Manrope'] tracking-widest uppercase">{item.name}</span>
                  </div>
               ))}
            </div>

            <button className="hidden md:flex absolute right-0 z-10 w-10 h-10 rounded-full bg-[#E5D5A5] items-center justify-center text-white shrink-0 hover:bg-[#D4AF37] transition-colors shadow-sm cursor-pointer">
               <ChevronRight size={20} />
            </button>
          </div>
        </section>

        {/* TRENDING SECTION */}
        <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 mb-32">
           <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-center">
              <div className="w-full md:w-1/2 relative bg-gray-100 rounded-[2.5rem] overflow-hidden aspect-square lg:aspect-[4/5] xl:aspect-square shadow-xl group">
                 <img src={banners.product_highlight[0]?.image || "/images/MensPerfume.jpg"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Trending Scent" onError={(e) => { e.target.src = '/images/newimg1.PNG' }} />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                 <div className="absolute inset-0 p-8 lg:p-14 flex flex-col justify-between items-start">
                    <h3 className="font-['Playfair_Display'] text-3xl md:text-4xl lg:text-[52px] text-white leading-[1.05] font-medium drop-shadow-md">
                      {banners.product_highlight[0]?.title || "Soleil Blanc Oud\nImmortel"}
                    </h3>
                    <button className="bg-white/95 backdrop-blur-sm text-[#1A1A1A] text-[10px] lg:text-xs font-bold tracking-widest px-8 py-3.5 hover:bg-white hover:scale-105 transition-all shadow-lg mt-auto" onClick={() => navigate('/trending-collection')}>
                      SHOP NOW
                    </button>
                 </div>
              </div>
              <div className="w-full md:w-1/2 flex flex-col pt-8 md:pt-0 lg:pl-10">
                  <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl lg:text-5xl text-[#1A1A1A] font-medium mb-6">Trending</h2>
                  <p className="text-gray-500 text-sm lg:text-base leading-relaxed mb-10 max-w-lg">
                    {banners.product_highlight[0]?.description || 
                    "Spicy, warm, and inviting. Oud Immortel marries traditional intensity with modern vibrancy. Notes of black pepper blend effortlessly with rich woods and a subtle hint of sweet vanilla.\n\nPure, free-spirited, and sophisticated. My collection reflects the inner journey."}
                  </p>
                  <button className="bg-[#1A1A1A] text-white text-[10px] lg:text-xs font-bold tracking-widest px-8 py-4 w-max hover:bg-black hover:shadow-lg transition-all" onClick={() => navigate('/trending-collection')}>
                    EXPLORE
                  </button>
              </div>
           </div>
        </section>

        {/* FRAGRANT FAVORITES GRID 1 */}
        {collections.fragrant_favourites.length > 0 && (
        <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 mb-32">
           <h2 className="font-['Playfair_Display'] text-2xl lg:text-[32px] text-[#1A1A1A] font-semibold mb-10">Fragrant Favorites</h2>
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {collections.fragrant_favourites.slice(0, 4).map(product => (
                 <ProductCard key={product._id} product={product} />
              ))}
           </div>
        </section>
        )}

        {/* STORY / NARRATIVE */}
        <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 mb-32 pt-10">
           <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
              <div className="w-full lg:w-1/2 relative bg-[#F9F7F6]">
                 <div className="bg-[#EFEAE4] absolute inset-x-8 -inset-y-8 z-0"></div>
                 <img src="/images/NarrativeImage.jpg" alt="Model sitting on chair" className="w-full h-auto object-cover relative z-10 shadow-lg" onError={(e) => { e.target.src = '/images/hero-default.jpg' }} />
                 <div className="absolute -bottom-10 right-0 md:-right-10 bg-white shadow-2xl p-8 md:p-10 max-w-[280px] md:max-w-[320px] border border-gray-50 z-20">
                    <span className="text-[#D4AF37] text-5xl font-serif leading-none block mb-1">"</span>
                    <p className="font-['Playfair_Display'] text-[#1A1A1A] text-lg md:text-xl italic mb-6 leading-relaxed">"Reflecting truth, the mind remains free of journey."</p>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">- Johndoe -</p>
                 </div>
              </div>
              <div className="w-full lg:w-1/2 flex flex-col pt-20 lg:pt-0">
                  <span className="text-gray-400 text-[10px] lg:text-[11px] font-bold tracking-[0.2em] mb-4 uppercase">The Ingredients</span>
                  <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl lg:text-[56px] text-[#1A1A1A] leading-[1.1] mb-8 font-medium max-w-lg">
                    A Scented Narrative<br className="hidden md:block"/> for the Soul
                  </h2>
                  <p className="text-gray-500 text-sm lg:text-base leading-relaxed mb-10 max-w-md">
                    Experience craftmanship focused purely on quality and scent. 
                    Reconnecting you back to its natural form. Our philosophy embraces a minimal, 
                    deep, and true approach to ingredient sourcing.
                  </p>
                  <button className="text-[#D4AF37] text-[10px] lg:text-xs font-bold tracking-widest uppercase flex items-center gap-2 w-max hover:opacity-80 transition-opacity" onClick={() => navigate('/about-page')}>
                    DISCOVER OUR STORY
                    <ChevronRight size={14} />
                  </button>
              </div>
           </div>
        </section>
      </main>

      {/* COMPLEX SECOND GRID & NEWSLETTER WRAPPER IN BEIGE */}
      <div className="w-full bg-[#F5F3E9]">
          
          {/* FRAGRANT FAVORITES COMPLEX GRID */}
          <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 py-24 pb-16">
            <div className="text-center mb-16">
              <h2 className="font-['Playfair_Display'] text-3xl lg:text-4xl text-[#1A1A1A] font-semibold mb-3">Fragrant Favorites</h2>
              <p className="text-gray-500 text-sm font-['Manrope']">Enjoying the beautiful things with good chemistry.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-5xl mx-auto">
                {/* Left Large Banner Product */}
                <div className="bg-white flex shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden border border-gray-100" onClick={() => navigate('/all-fragrances')}>
                   <div className="w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-white">

                      <span className="text-[#D4AF37] text-[9px] font-bold tracking-widest uppercase mb-4">Trending</span>
                      <h3 className="font-['Playfair_Display'] text-2xl lg:text-4xl text-[#1A1A1A] leading-[1.1] mb-4">Vetiver<br/> Extrême</h3>
                      <p className="text-gray-400 text-[10px] lg:text-xs mb-8">The most evocative notes of raw woods.</p>
                      <button className="bg-[#1A1A1A] text-white text-[9px] lg:text-[10px] font-bold tracking-widest px-6 py-2.5 w-max hover:bg-black">SHOP NOW</button>
                   </div>
                   <div className="w-1/2 bg-[#E1D1B7] relative p-8 flex items-center justify-center">
                      <img src="/images/vetiver-default.png" alt="Vetiver Extreme" className="w-full object-contain drop-shadow-2xl mix-blend-multiply hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.src = '/images/default-gift.png' }} />
                   </div>
                </div>

                {/* Right Stack */}
                <div className="flex flex-col gap-6">
                   {/* Top Two Products */}
                   <div className="grid grid-cols-2 gap-6 h-[60%]">
                      {/* Sub card 1 */}
                      <div className="bg-white p-6 md:p-8 flex flex-col shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/all-fragrances')}>
                         <div className="flex-1 w-full bg-[#EAEAEA] flex items-center justify-center p-4 mb-4">
                            <img src="/images/eau-default.png" alt="Eau pour le Soir" className="h-[120px] lg:h-[140px] mix-blend-multiply object-contain group-hover:scale-105 transition-transform" onError={(e) => { e.target.src = '/images/default-gift.png' }} />
                         </div>
                         <h4 className="font-['Playfair_Display'] text-[#1A1A1A] text-lg font-medium mb-1">Eau pour le Soir</h4>
                         <span className="text-[#D4AF37] font-bold text-sm">$45.00</span>
                      </div>
                      {/* Sub card 2 */}
                      <div className="bg-white p-6 md:p-8 flex flex-col shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/all-fragrances')}>
                         <div className="flex-1 w-full bg-white flex items-center justify-center p-4 mb-4 border border-gray-50 shadow-inner">
                            <img src="/images/bois-default.png" alt="Bois de Lune" className="h-[120px] lg:h-[140px] object-contain group-hover:scale-105 transition-transform" onError={(e) => { e.target.src = '/images/default-gift.png' }} />
                         </div>
                         <h4 className="font-['Playfair_Display'] text-[#1A1A1A] text-lg font-medium mb-1">Bois de Lune</h4>
                         <span className="text-[#D4AF37] font-bold text-sm">$72.00</span>
                      </div>
                   </div>

                   {/* Bottom Gift Card */}
                   <div className="bg-[#EFE8D8] p-6 lg:p-8 flex items-center justify-between shadow-sm cursor-pointer hover:bg-[#E8DECA] transition-colors h-[40%]" onClick={() => navigate('/gift-collection')}>
                      <div className="flex flex-col">
                         <h4 className="font-['Playfair_Display'] text-[#1A1A1A] text-xl font-medium mb-2">The Gift Curation</h4>
                         <p className="text-gray-500 text-[10px] md:text-xs">Available exclusively online and in-store.</p>
                         <span className="text-[#D4AF37] text-[10px] font-bold tracking-widest leading-none mt-2">SHOP GIFTS</span>
                      </div>
                      <div className="w-12 h-12 rounded-full border border-[#CBA135] text-[#CBA135] flex items-center justify-center opacity-70">
                         <FiShoppingBag size={20} />
                      </div>
                   </div>
                </div>
            </div>
          </section>

          {/* NEWSLETTER SECTION (No background, sits natively on Beige) */}
          <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 py-20 pb-32 flex flex-col items-center">
            <h2 className="text-3xl lg:text-[40px] font-['Playfair_Display'] text-[#1A1A1A] font-semibold mb-4 text-center">
              The Vesarii Inner Circle
            </h2>
            <p className="text-gray-500 text-sm lg:text-base text-center mb-10 max-w-lg">
              Priority access to new editions, special discounts, and behind-the-scenes content.
            </p>
            
            <div className="w-full max-w-md flex flex-col gap-4">
              <div className="flex w-full items-center mb-2">
                <input 
                  type="email" 
                  placeholder="Email..." 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 border-b border-gray-400 bg-transparent py-3 px-2 text-sm outline-none placeholder-gray-400 text-[#1A1A1A] focus:border-[#1A1A1A] transition-colors"
                />
                <button 
                  onClick={handleSubscribe}
                  className="bg-[#1A1A1A] text-white text-[10px] font-bold tracking-widest px-6 py-3.5 hover:bg-black transition-colors"
                >
                  JOIN THE CIRCLE
                </button>
              </div>
              <div className="flex items-center gap-2 px-1">
                <input 
                  type="checkbox" 
                  id="newsletter-terms" 
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#1A1A1A]"
                />
                <label htmlFor="newsletter-terms" className="text-[10px] text-gray-400 cursor-pointer">
                  I agree to receive communications in accordance with the Privacy Policy
                </label>
              </div>
            </div>
          </section>
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;
