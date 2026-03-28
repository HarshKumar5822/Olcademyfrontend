// src/pages/SearchResults.jsx

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import Button from '../components/ui/Button';
import ProductCartSection from '../pages/ProductCartSection';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '../variants';
import { useCart } from '@/CartContext';
import { useWishlist } from '@/WishlistContext';
import { FiHeart, FiX } from 'react-icons/fi';
import { CheckCircle, AlertCircle, Star, ShoppingCart } from 'lucide-react';
import ProductService from '../services/productService';

const SearchResults = () => {
  const [darkMode, setDarkMode] = useState(false);
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [filters, setFilters] = useState({
    category: '',
    priceRange: { min: 0, max: 1000 },
    sortBy: 'name'
  });

  const addNotification = useCallback((message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Initial load - fetch all products
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q') || '';
    setSearchQuery(query);
    fetchSearchResults();
  }, [location.search]);

  // Apply filters whenever products or filters change
  useEffect(() => {
    applyFilters();
  }, [allProducts, filters, searchQuery]);


  const fetchSearchResults = async () => {
    setIsLoading(true);

    try {
      const res = await ProductService.searchProducts(searchQuery);

      const mergedResults = [
        ...(res.products || []),
        ...(res.scents || [])
      ];

      setAllProducts(mergedResults);
    } catch (err) {
      console.error("Search failed", err);
      setAllProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Fetching all products...');

      // Fetch all products without any filters
      const response = await ProductService.getAllProducts({
        limit: 500 // Get all products
      });

      if (response.success && response.data) {
        const products = response.data.products || response.data;
        console.log(`✅ Fetched ${products.length} products`);
        setAllProducts(products);
      } else {
        console.error('❌ Failed to fetch products:', response.message || response.error);
        setAllProducts([]);
        addNotification('Failed to load products', 'error');
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      setAllProducts([]);
      addNotification('Error loading products', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allProducts];
    console.log(`📊 Starting filter with ${filtered.length} products`);

    // 1. Apply search query filter (search in name, brand, description)
    if (searchQuery && searchQuery.trim() !== '') {
      const searchTerm = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product => {
        const nameMatch = product.name?.toLowerCase().includes(searchTerm);
        const brandMatch = product.brand?.toLowerCase().includes(searchTerm);
        // const descriptionMatch = product.description?.toLowerCase().includes(searchTerm);
        return nameMatch || brandMatch; //|| descriptionMatch;
      });
      console.log(`🔍 After search filter (${searchQuery}): ${filtered.length} products`);
    }

    // 2. Apply category filter
    if (filters.category && filters.category !== '') {
      filtered = filtered.filter(product => {
        const productCategory = product.category?.toLowerCase();
        const filterCategory = filters.category.toLowerCase();

        // Handle both singular and plural forms, and 'gift' vs 'gifts'
        if (filterCategory === 'gift' || filterCategory === 'gifts') {
          return productCategory === 'gift' || productCategory === 'gifts';
        }

        return productCategory === filterCategory;
      });
      console.log(`🏷️ After category filter (${filters.category}): ${filtered.length} products`);
    }

    // 3. Apply price range filter
    filtered = filtered.filter(product => {
      const price = Number(product.price) || 0;
      return price >= filters.priceRange.min && price <= filters.priceRange.max;
    });
    console.log(`💰 After price filter ($${filters.priceRange.min}-$${filters.priceRange.max}): ${filtered.length} products`);

    // 4. Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-low':
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        case 'price-high':
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        case 'name':
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });
    console.log(`🔤 After sorting (${filters.sortBy}): ${filtered.length} products`);

    setFilteredResults(filtered);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Update URL with new search query
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const updateFilter = (key, value) => {
    console.log(`🔧 Updating filter: ${key} =`, value);
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    console.log('🧹 Clearing all filters');
    setFilters({
      category: '',
      priceRange: { min: 0, max: 1000 },
      sortBy: 'name'
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
    navigate('/search');
  };

  // ProductCard Component
  const ProductCard = memo(({ product }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [imageError, setImageError] = useState({ primary: false, hover: false });
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    if (!product) return null;

    const productInCart = isInCart(
      product._id?.toString(),
      product.sizes && product.sizes.length > 0 ? product.sizes[0].size : null
    );

    const handleAddToCart = async (e) => {
      e.stopPropagation();
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
          addNotification(`Added ${product.name} to cart!`, 'success');
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
      if (!product._id) {
        addNotification('Unable to add to wishlist', 'error');
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
          'success'
        );
      } catch (error) {
        console.error('Wishlist toggle error:', error);
        addNotification('Failed to update wishlist', 'error');
      }
    };

    const handleCardClick = () => {
      if (!product._id) {
        addNotification('Product not available', 'error');
        return;
      }

      // Check if the product is from the scents collection
      if (product.collection) {
        navigate(`/scent/${product._id.toString()}`);
      } else {
        navigate(`/product/${product._id.toString()}`);
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
      e.target.src = '/images/default-gift.png';
    };

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
        {/* Image Container with Wishlist Icon */}
        <div className="relative bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden w-full aspect-[290/240] p-3">
          <motion.img
            src={getProductImage()}
            alt={product.name || 'Product'}
            className="object-contain w-full h-full max-w-[248px] max-h-[248px]"
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
            className="absolute top-2.5 right-2.5 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-lg hover:shadow-xl transition-all duration-200 z-10 w-[27px] h-[27px] flex items-center justify-center"
            aria-label={isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <FiHeart
              size={14}
              className={`transition-all duration-200 ${isInWishlist(product._id) ? 'fill-red-600 text-red-600' : 'text-gray-700 dark:text-gray-300'}`}
            />
          </motion.button>
        </div>

        {/* Product Info Container */}
        <div className="px-3.5 py-3.5 flex flex-col gap-3.5">
          {/* Product Name */}
          <h3
            className="font-bold uppercase text-center line-clamp-1 text-lg sm:text-xl md:text-2xl"
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
            {product.rating ? (
              <>
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    size={14}
                    style={{ color: '#5A2408', fill: index < Math.floor(product.rating) ? '#5A2408' : 'transparent' }}
                    className={`${index < Math.floor(product.rating) ? '' : 'opacity-30'}`}
                  />
                ))}
              </>
            ) : (
              <div className="h-3.5"></div>
            )}
          </div>

          {/* Description */}
          <p
            className="text-center line-clamp-2 text-sm sm:text-base"
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
            className="font-bold text-center text-lg sm:text-xl"
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
            className="flex items-center justify-center gap-2 sm:gap-2.5 text-white font-bold uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full h-[54px] sm:h-[60px] text-sm sm:text-base md:text-lg -mx-3.5 px-3.5"
            style={{
              backgroundColor: '#431A06',
              fontFamily: 'Manrope, sans-serif',
              letterSpacing: '0.05em',
              width: 'calc(100% + 28px)'
            }}
          >
            <ShoppingCart size={20} className="sm:w-[24px] sm:h-[24px]" />
            <span>
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </span>
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
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className={`p-4 rounded-2xl shadow-lg backdrop-blur-sm border max-w-sm ${notification.type === 'success'
                ? 'bg-green-500/90 text-white border-green-400'
                : 'bg-red-500/90 text-white border-red-400'
              }`}
          >
            <div className="flex items-center space-x-3">
              {notification.type === 'success' ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F6F3] dark:bg-[#0d0603]">
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <NotificationSystem />

      {/* Cart Sidebar */}
      <ProductCartSection isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="max-w-[1555px] mx-auto px-4 sm:px-6 py-8 sm:py-10 lg:py-12">
        <motion.div
          variants={fadeIn('up', 0.2)}
          initial="hidden"
          animate="show"
          className="mb-8"
        >
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-center"
            style={{
              fontFamily: 'Playfair Display, serif',
              color: darkMode ? '#f6d110' : '#271004'
            }}
          >
            Search Results
          </h1>

          <form onSubmit={handleSearch} className="flex gap-4 mb-6 max-w-3xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, brand, or description..."
              className="flex-1 px-4 py-3 rounded-xl border-2 border-[#D4C5A9] bg-white dark:bg-[#1a1410] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#431A06]"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            />
            <Button
              type="submit"
              className="px-8 py-3 rounded-xl text-white font-bold uppercase"
              style={{
                backgroundColor: '#431A06',
                fontFamily: 'Manrope, sans-serif',
                letterSpacing: '0.05em'
              }}
            >
              Search
            </Button>
          </form>

          <div className="max-w-7xl mx-auto">
            <p
              className="text-base sm:text-lg text-center"
              style={{
                fontFamily: 'Manrope, sans-serif',
                color: darkMode ? '#f6d110' : '#5A2408'
              }}
            >
              {isLoading ? 'Searching...' :
                searchQuery ? `Found ${filteredResults.length} results for "${searchQuery}"` :
                  `Showing ${filteredResults.length} products`
              }
            </p>
          </div>
        </motion.div>

        <div className="flex gap-8">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden fixed bottom-4 right-4 z-30 bg-[#431A06] text-white p-4 rounded-full shadow-lg"
          >
            {showFilters ? <FiX size={24} /> : '🔍'}
          </button>

          {/* Filters Sidebar */}
          <motion.div
            variants={fadeIn('left', 0.2)}
            initial="hidden"
            animate="show"
            className={`${showFilters ? 'block fixed inset-y-0 left-0 z-40 w-80 overflow-y-auto' : 'hidden'} lg:block lg:relative lg:w-64 flex-shrink-0`}
          >
            <div className="bg-white dark:bg-[#1a1410] p-6 rounded-2xl shadow-lg border-2 border-[#D4C5A9] lg:sticky lg:top-4">
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="font-bold text-xl"
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    color: darkMode ? '#f6d110' : '#271004'
                  }}
                >
                  Filters
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-sm hover:underline"
                  style={{ color: '#431A06', fontFamily: 'Manrope, sans-serif' }}
                >
                  Clear All
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label
                  className="block font-semibold mb-2"
                  style={{ fontFamily: 'Manrope, sans-serif', color: darkMode ? '#f6d110' : '#271004' }}
                >
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-[#D4C5A9] bg-white dark:bg-[#0d0603] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#431A06]"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  <option value="">All Categories</option>
                  <option value="home">Home</option>
                  <option value="men">Men's</option>
                  <option value="women">Women's</option>
                  <option value="unisex">Unisex</option>
                  <option value="gift">Gift</option>
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <label
                  className="block font-semibold mb-2"
                  style={{ fontFamily: 'Manrope, sans-serif', color: darkMode ? '#f6d110' : '#271004' }}
                >
                  Price Range
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={filters.priceRange.max}
                    onChange={(e) => updateFilter('priceRange', {
                      ...filters.priceRange,
                      max: parseInt(e.target.value)
                    })}
                    className="w-full accent-[#431A06]"
                  />
                  <div
                    className="flex justify-between text-sm"
                    style={{ fontFamily: 'Manrope, sans-serif', color: darkMode ? '#f6d110' : '#5A2408' }}
                  >
                    <span>${filters.priceRange.min}</span>
                    <span>${filters.priceRange.max}</span>
                  </div>
                </div>
              </div>

              {/* Sort By */}
              <div className="mb-4">
                <label
                  className="block font-semibold mb-2"
                  style={{ fontFamily: 'Manrope, sans-serif', color: darkMode ? '#f6d110' : '#271004' }}
                >
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-[#D4C5A9] bg-white dark:bg-[#0d0603] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#431A06]"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="price-low">Price (Low to High)</option>
                  <option value="price-high">Price (High to Low)</option>
                </select>
              </div>

              {/* Close button for mobile */}
              <button
                onClick={() => setShowFilters(false)}
                className="lg:hidden w-full mt-4 px-4 py-2 bg-[#431A06] text-white rounded-lg"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>

          {/* Results Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 lg:h-28 lg:w-28 border-b-2 border-[#431A06]"></div>
              </div>
            ) : filteredResults.length === 0 ? (
              <motion.div
                variants={fadeIn('up', 0.2)}
                initial="hidden"
                animate="show"
                className="text-center py-16"
              >
                <div className="mb-4">
                  <FiX size={64} className="mx-auto text-gray-400" />
                </div>
                <h3
                  className="text-2xl font-bold mb-2"
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    color: darkMode ? '#f6d110' : '#271004'
                  }}
                >
                  No Results Found
                </h3>
                <p
                  className="mb-6"
                  style={{
                    fontFamily: 'Manrope, sans-serif',
                    color: darkMode ? '#f6d110' : '#5A2408'
                  }}
                >
                  {searchQuery
                    ? `No products found matching "${searchQuery}"`
                    : "No products match your current filters"
                  }
                </p>
                <div className="space-x-4">
                  <Button
                    onClick={clearSearch}
                    className="border-2 px-6 py-3 rounded-lg"
                    style={{
                      borderColor: '#431A06',
                      color: '#431A06',
                      fontFamily: 'Manrope, sans-serif'
                    }}
                  >
                    Clear Search
                  </Button>
                  <Button
                    onClick={clearFilters}
                    className="px-6 py-3 rounded-lg text-white"
                    style={{
                      backgroundColor: '#431A06',
                      fontFamily: 'Manrope, sans-serif'
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                variants={fadeIn('up', 0.2)}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7 lg:gap-10 justify-items-center"
              >
                {filteredResults.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Mobile filter overlay */}
        {showFilters && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setShowFilters(false)}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SearchResults;