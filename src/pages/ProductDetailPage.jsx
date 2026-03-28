// src/pages/ProductDetailPage.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useCart } from '../CartContext';
import ProductCard from '@/pages/Men/Production';
import { useWishlist } from '../WishlistContext';
import { Star, Heart, ShoppingCart, AlertCircle, CheckCircle, X } from 'lucide-react';
import ProductService from '../services/productService';
import ScentService from '../services/scentService';
import ProductCartSection from '../pages/ProductCartSection'; // Import cart sidebar component
import { API_BASE_URL } from '@/api/constant';

// Tab configuration for product info sections
const TAB = [
  { key: 'description', label: 'DESCRIPTION' },
  { key: 'fragrance', label: 'FRAGRANCE PROFILE' },
  { key: 'additional', label: 'ADDITIONAL INFORMATION' },
  { key: 'bestfor', label: 'BEST FOR' },
];

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart, cartItems = [] } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Product and UI state
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedTab, setSelectedTab] = useState(TAB[0].key);
  const [displayPrice, setDisplayPrice] = useState('');
  const [justAdded, setJustAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false); // State to control cart sidebar visibility
  // State management for notifications
  const [notifications, setNotifications] = useState([]);

  // Check if current page is a scent page
  const isScentPage = location.pathname.startsWith('/scent');

  //img handler
  const resolveImage = (image) => {
    if (!image) return '/images/default-perfume.png';
    if (image.startsWith('http')) return image;
    
    // If it's a root-relative path (like /images/foo.png), point it to the backend
    if (image.startsWith('/')) {
      return `${API_BASE_URL}${image}`;
    }

    // Use ScentService (class with static method) or ProductService (pre-instantiated object)
    if (isScentPage) {
      return ScentService.constructImageURL(image);
    }
    return ProductService.constructImageURL(image);
  };

  // Add notification helper
  const addNotification = useCallback((message, type = 'success', productName = null, actionType = 'general') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type, productName, actionType }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);
  // Fetch product details on id/path change
  useEffect(() => {
    const fetchProductDetailPage = async () => {
      try {
        setProduct(null);
        setRelatedProducts([]);

        // 👉 SCENT PAGE
        if (location.pathname.startsWith('/scent')) {
          const scentPromise = ScentService.getScentById(id);
          const relatedScentPromise = ScentService.getRelatedScents(id);

          const [scentRes, relatedRes] = await Promise.all([
            scentPromise,
            relatedScentPromise
          ]);

          if (scentRes?.data) {
            setProduct(scentRes.data);
          }

          if (relatedRes?.data?.related_products) {
            const normalized = relatedRes.data.related_products.map(p => ({
              ...p,
              price: p.price ?? p.discountedPrice ?? p.sizes?.[0]?.price ?? 0,
              rating: p.rating ?? 5,
              images: p.images?.length
                ? p.images
                : ['/images/default-perfume.png'],
            }));

            setRelatedProducts(normalized);
          } else {
            setRelatedProducts([]);
          }

          return;
        }


        // 👉 PRODUCT PAGE (NORMAL FLOW)
        const productPromise = ProductService.getProduct(id);
        const relatedPromise = ProductService.getRelatedProducts(id);

        const [productRes, relatedRes] = await Promise.all([
          productPromise,
          relatedPromise
        ]);

        // ✅ SET PRODUCT
        if (productRes?.data?.product) {
          setProduct(productRes.data.product);
        } else {
          console.error('❌ Product not found');
        }

        // ✅ SET RELATED PRODUCTS
        if (relatedRes?.data?.data?.related_products) {
          setRelatedProducts(relatedRes.data.data.related_products);
        } else {
          setRelatedProducts([]);
        }

      } catch (error) {
        console.error('❌ Product detail fetch failed:', error);
        setProduct(null);
        setRelatedProducts([]);
      }
    };

    fetchProductDetailPage();
  }, [id, location.pathname]);


  // Default selected size and displayed price
  useEffect(() => {
    if (product?.sizes?.length) {
      setSelectedSize(product.sizes[0].size);
      setDisplayPrice(product.sizes[0].price);
    } else if (product?.price) {
      setDisplayPrice(product.price);
    }
  }, [product]);

  // Set default selected image when product loads
  useEffect(() => {
    if (product?.images?.length > 0) {
      setSelectedImage(product.images[0]);
    }
  }, [product]);

  // Update display price when selected size changes
  useEffect(() => {
    if (!product?.sizes) return;
    const selectedObj = product.sizes.find((obj) => obj.size === selectedSize);
    if (selectedObj) setDisplayPrice(selectedObj.price);
  }, [selectedSize, product]);

  // Memoize isInCart check
  const isInCart = useMemo(() => {
    if (!product?._id) return false;

    return (
      cartItems.some(
        (item) =>
          item.id === product._id &&
          (item.selectedSize
            ? item.selectedSize === selectedSize
            : selectedSize === '')
      ) || justAdded
    );
  }, [cartItems, product?._id, selectedSize, justAdded]);

  // Add product to cart
  const handleAdd = async () => {
    const normalizedProduct = {
      id: product._id,
      name: product.name,
      price: displayPrice,
      image: product.images?.[0] || '/images/default-perfume.png',
      selectedSize: selectedSize || null,
      quantity: 1,
      brand: product.brand || '',
      sku: product.sku || '',
    };

    try {
      const success = await addToCart(normalizedProduct);
      if (success) {
        addNotification(null, 'success', product.name, 'cart');
        setJustAdded(true);
      } else {
        addNotification('Failed to add item to cart', 'error');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      addNotification('Something went wrong. Please try again.', 'error');
    }
  };

  // Handle click on Already in Cart - open cart sidebar
  const handleOpenCart = () => {
    setIsCartOpen(true);
  };

  const handleNoop = () => { };

  const handleWishlistToggle = (relatedItem) => {
    if (!relatedItem._id) {
      addNotification('Unable to update wishlist', 'error');
      return;
    }
    try {
      const wasInWishlist = isInWishlist(relatedItem._id);
      toggleWishlist(relatedItem);
      addNotification(
        wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist!',
        'success',
        relatedItem.name,
        'wishlist'
      );
    } catch (error) {
      console.error('Wishlist toggle error:', error);
      addNotification('Failed to update wishlist', 'error');
    }
  };

  if (!product) return null;

  // Notification System
  const NotificationSystem = () => (
    <div className="fixed z-[10000] space-y-3 px-4 w-full max-w-[440px]" style={{ top: '40px', right: '0' }}>
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
              width: '100%',
              minHeight: '100px',
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
                right: '16px',
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
    <div
      className="min-h-screen font-sans"
      style={{ background: '#F8F7F5', color: '#3F2E1F' }}
    >
      <Header />
      <NotificationSystem />
      <main className="max-w-[1200px] mx-auto pt-4 pb-12 px-4 w-full">
        {/* Product detail layout: left image, right details */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* ✅ UPDATED: Image section with clickable thumbnails */}
          <div className="md:w-1/2 w-full flex gap-4 items-start">
            {/* Thumbnail Gallery */}
            {product.images && Array.isArray(product.images) && product.images.length > 0 && (
              <div className="flex flex-col gap-3 items-center">
                {product.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <button
                      onClick={() => setSelectedImage(image)}
                      className={`w-[50px] h-[50px] md:w-[70px] md:h-[70px] bg-white border-2 flex-shrink-0 overflow-hidden transition-all duration-300 ${selectedImage === image
                        ? 'border-[#5A2408] shadow-md opacity-100'
                        : 'border-[#E0D5CC] opacity-70 hover:opacity-100 hover:border-[#5A2408]'
                        }`}
                    >
                      <img
                        src={resolveImage(image)}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="flex-1 flex items-center justify-center">
              <img
                src={
                  resolveImage(selectedImage || (product.images?.[0]))
                }
                alt={product.name}
                className="w-full max-w-[600px] h-auto max-h-[450px] object-contain bg-white transition-all duration-500 ease-in-out"
                style={{
                  boxShadow: '0px 12px 36px rgba(63,46,31,0.10)',
                }}
              />
            </div>
          </div>

          {/* Product info and actions */}
          <div className="md:w-1/2 w-full flex flex-col pr-2">
            <h1 className="font-[Playfair] font-bold uppercase tracking-[0.05em] leading-[100%] text-2xl md:text-[32px] text-[#5A2408] mb-1">
              {product.name}
            </h1>
            <p className="font-[manrope] font-medium text-xl md:text-[28px] leading-[100%] tracking-[0.02em] text-[#431A06] mt-2 mb-2">
              ${displayPrice}
            </p>

            {/* Ratings */}
            <div className="flex items-center gap-1 mt-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-center"
                  style={{
                    borderColor: '#5A2408',
                    color: '#5A2408',
                    width: '32px',
                    height: '26px',
                  }}
                >
                  <Star
                    size={24}
                    strokeWidth={1.9}
                    style={{
                      color: '#5A2408',
                      fill: i <= (product.rating || 5) ? '#5A2408' : 'none',
                    }}
                  />
                </div>
              ))}
              <span className="text-[#7D7D7D] text-base font-medium ml-2 mt-[2px] font-[manrope] text-[26px]">
                ({product.reviews || 0})
              </span>
            </div>
            <div className='p-2'>

            </div>


            {/* Size selection */}
            <div className="flex items-center gap-3 mb-4 mt-1">
              <span className="font-[manrope] font-semibold text-[18px] tracking-[0.02em] text-[#3A3A3A]">
                Size:
              </span>
              <div className="flex gap-[10px] flex-wrap">
                {product.sizes?.map((sizeObj, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedSize(sizeObj.size);
                      setJustAdded(false);
                    }}
                    className={`flex items-center justify-center uppercase text-[13px] md:text-[14px] font-[Manrope] tracking-[0.02em] transition-all duration-150 w-auto min-w-[60px] h-auto min-h-[35px] px-3 py-1.5 border border-[#3A3A3A] opacity-100 whitespace-nowrap ${sizeObj.size === selectedSize
                      ? 'bg-[#3A3A3A] text-white border-b-[1.5px]'
                      : 'bg-white text-[#3A3A3A] border-b-[1px]'
                      }`}
                  >
                    {sizeObj.size}
                  </button>
                ))}
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              className="font-medium text-base uppercase tracking-widest w-full py-2.5 mt-0 border-0 rounded-none bg-[#431A06] text-white"
              onClick={handleAdd}
            >
              Add to Cart
            </button>

            {/* Tabs */}
            <div className="mt-8">
              <div className="flex gap-2 flex-wrap">
                {TAB.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedTab(tab.key)}
                    className={`flex-1 min-w-[100px] px-2 py-2 text-[13px] md:text-[14px] font-manrope font-normal uppercase tracking-[0.02em] text-center transition-all duration-75`}
                    style={{
                      background:
                        selectedTab === tab.key ? '#431A06' : '#EFE9E6',
                      color: selectedTab === tab.key ? '#FFFFFF' : '#343434',
                      lineHeight: '28px',
                      textTransform: 'uppercase',
                      verticalAlign: 'middle',
                      border: 'none',
                      borderRadius: 0,
                      letterSpacing: '2%',
                      minHeight: '45px'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[95px] pt-7 pb-3 text-[17px] tracking-wide rounded-none border-t-0">
                {selectedTab === 'description' && (
                  <div className="space-y-2">
                    <h3 className="text-[20px] font-manrope font-semibold text-[#3A3A3A] uppercase">
                      Details:
                    </h3>
                    <ul className="list-disc ml-6 mb-2 text-[16px] font-manrope text-[#343434]">
                      {Array.isArray(product.descriptionDetails)
                        ? product.descriptionDetails.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))
                        : product.description && <li>{product.description}</li>}
                    </ul>
                  </div>
                )}

                {selectedTab === 'fragrance' && (
                  <div className="flex flex-col gap-0">
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(product.fragrancenotes)
                        ? product.fragrancenotes.map((note, idx) => (
                          <span
                            key={idx}
                            className="px-4 py-1 font-serif text-[15px]"
                            style={{
                              background: '#F0E7DF',
                              color: '#3F2E1F',
                            }}
                          >
                            {note}
                          </span>
                        ))
                        : product.fragrancenotes &&
                        Object.keys(product.fragrancenotes).map((section) =>
                          product.fragrancenotes[section].map((note, idx) => (
                            <span
                              key={section + idx}
                              className="px-4 py-1 font-serif text-[15px]"
                              style={{
                                background: '#F0E7DF',
                                color: '#3F2E1F',
                              }}
                            >
                              {note}
                            </span>
                          ))
                        )}
                    </div>
                    {product.fragrance_notes?.top?.length > 0 && (
                      <div className="mt-0">
                        <h3 className="text-[20px] font-manrope font-semibold text-[#3A3A3A] uppercase mb-2">
                          Notes:
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {product.fragrance_notes.top.map((note, index) => (
                            <span
                              key={index}
                              className="px-6 py-2 md:px-10 md:py-4 text-white text-base flex items-center justify-center"
                              style={{
                                width: 'auto',
                                minWidth: '80px',
                                minHeight: '40px',
                                background: '#B59B8E',
                                opacity: 1,
                              }}
                            >
                              {note.charAt(0).toUpperCase() + note.slice(1)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedTab === 'additional' && (
                  <div className="space-y-2">
                    {product.concentration && (
                      <div>
                        <span className="font-manrope font-bold text-[16px] uppercase tracking-[0.02em] leading-[28px] text-[#343434]">
                          TYPE:
                        </span>{' '}
                        {product.concentration}
                      </div>
                    )}
                    {product.longevity && (
                      <div>
                        <span className="font-manrope font-bold text-[16px] uppercase tracking-[0.02em] leading-[28px] text-[#343434]">
                          LONGEVITY:
                        </span>{' '}
                        {product.longevity}
                      </div>
                    )}
                    {product.sillage && (
                      <div>
                        <span className="font-manrope font-bold text-[16px] uppercase tracking-[0.02em] leading-[28px] text-[#343434]">
                          PROJECTION:
                        </span>{' '}
                        {product.sillage}
                      </div>
                    )}
                    {product.volume && (
                      <div>
                        <span className="font-manrope font-bold text-[16px] uppercase tracking-[0.02em] leading-[28px] text-[#343434]">
                          VOLUME:
                        </span>{' '}
                        {product.volume}
                      </div>
                    )}
                  </div>
                )}

                {selectedTab === 'bestfor' && (
                  <div className="space-y-2">
                    {product.occasion && (
                      <div>
                        <span className="font-manrope font-bold text-[16px] uppercase tracking-[0.02em] leading-[28px] text-[#343434]">
                          PERFECT FOR:
                        </span>{' '}
                        {Array.isArray(product.occasion)
                          ? product.occasion.join(', ')
                          : product.occasion}
                      </div>
                    )}
                    {product.season && (
                      <div>
                        <span className="font-manrope font-bold text-[16px] uppercase tracking-[0.02em] leading-[28px] text-[#343434]">
                          BEST SEASON:
                        </span>{' '}
                        {Array.isArray(product.season)
                          ? product.season.join(', ')
                          : product.season}
                      </div>
                    )}
                    {product.sillage && (
                      <div>
                        <span className="font-manrope font-bold text-[16px] uppercase tracking-[0.02em] leading-[28px] text-[#343434]">
                          PROJECTION:
                        </span>{' '}
                        {product.sillage}
                      </div>
                    )}
                    {product.volume && (
                      <div>
                        <span className="font-manrope font-bold text-[16px] uppercase tracking-[0.02em] leading-[28px] text-[#343434]">
                          VOLUME:
                        </span>{' '}
                        {product.volume}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <h2
          className="mt-12 mb-6 text-center font-serif font-extrabold text-xl md:text-2xl tracking-widest uppercase"
          style={{ color: '#3F2E1F' }}
        >
          YOU MAY ALSO LIKE
        </h2>
        <div className="flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 justify-items-center w-full">
            {relatedProducts.slice(0, 4).map((related) => (
              <motion.div
                key={related._id}
                whileHover={{ y: -8, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
                transition={{ duration: 0.3 }}
                onClick={() =>
                  navigate(isScentPage ? `/scent/${related._id}` : `/product/${related._id}`)
                }
                className="bg-white overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 w-full max-w-[290px] min-h-0 sm:min-h-[420px] flex flex-col"
              >
                {/* Image */}
                <div className="relative bg-white flex items-center justify-center overflow-hidden w-full aspect-[290/240] p-3">
                  <img
                    src={resolveImage(related.images?.[0])}
                    alt={related.name}
                    className="object-contain w-full h-full max-w-[248px] max-h-[248px]"
                  />

                  {/* Wishlist */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWishlistToggle(related);
                    }}
                    className="absolute top-2.5 right-2.5 bg-white rounded-full p-1.5 shadow-lg w-[27px] h-[27px] flex items-center justify-center"
                  >
                    <Heart
                      size={14}
                      className={
                        isInWishlist(related)
                          ? 'fill-[#3F2E1F] text-[#3F2E1F]'
                          : 'text-gray-600'
                      }
                    />
                  </button>
                </div>

                {/* Content */}
                <div className="px-3.5 py-3.5 flex flex-col flex-1 gap-3.5">
                  <h3
                    className="font-bold uppercase text-center line-clamp-1 text-xl"
                    style={{
                      fontFamily: 'Playfair Display, serif',
                      letterSpacing: '0.05em',
                      color: '#5A2408',
                    }}
                  >
                    {related.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        style={{
                          color: '#5A2408',
                          fill: i < Math.floor(related.rating || 5) ? '#5A2408' : 'transparent',
                        }}
                        className={i < Math.floor(related.rating || 5) ? '' : 'opacity-30'}
                      />
                    ))}
                  </div>

                  {/* Description */}
                  <p
                    className="text-center line-clamp-2 text-sm"
                    style={{
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: 500,
                      color: '#7E513A',
                    }}
                  >
                    {related.description || 'Premium fragrance'}
                  </p>

                  {/* Price */}
                  <p
                    className="font-bold text-center text-lg"
                    style={{
                      fontFamily: 'Manrope, sans-serif',
                      color: '#431A06',
                    }}
                  >
                    ${Number(related.price).toFixed(2)}
                  </p>

                  {/* BUTTON FIXED AT BOTTOM */}
                  <div className="mt-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(isScentPage ? `/scent/${related._id}` : `/product/${related._id}`);
                      }}
                      className="flex items-center justify-center text-white font-bold uppercase transition-all duration-300 w-full h-[54px] -mx-3.5 px-3.5"
                      style={{
                        backgroundColor: '#431A06',
                        fontFamily: 'Manrope, sans-serif',
                        letterSpacing: '0.05em',
                        width: 'calc(100% + 28px)',
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>


      </main>
      <Footer />
      {/* Render Cart Sidebar */}
      <ProductCartSection isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
