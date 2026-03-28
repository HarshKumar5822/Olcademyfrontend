// src/services/productService.js
import { API_BASE_URL } from '../api/constant';
import axios from 'axios';

class ProductService {
  // ✅ ENHANCED: Helper to construct full image URLs from filenames
  // Now handles both exact filenames AND timestamped versions
  constructImageURL(imagePath) {
    if (!imagePath) return '/images/default-gift.png';
    
    // If it's already a full URL, return as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Remove any leading slashes or 'images/' prefix to get clean filename
    const cleanPath = imagePath.replace(/^\/+/, '').replace(/^images\//, '');
    
    // ✅ IMPORTANT: Use the backend's image serving middleware
    // The backend will automatically find both exact matches and timestamped versions
    const fullURL = `${API_BASE_URL}/api/products/images/${cleanPath}`;
    
    console.log('🖼️ Constructed image URL:', {
      input: imagePath,
      cleanPath: cleanPath,
      output: fullURL
    });
    
    return fullURL;
  }

  // ✅ New: Construct banner image URLs using static server for speed + caching
  constructBannerURL(imagePath) {
    if (!imagePath) return '/images/default-gift.png';

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    const cleanPath = imagePath.replace(/^\/+/, '').replace(/^images\//, '');

    // Use backend's banner image lookup route for reliability with timestamped files
    // It supports both exact filenames and timestamped variants.
    const apiURL = `${API_BASE_URL}/api/banners/images/${cleanPath}`;
    return apiURL;
  }

  // ✅ Helper to normalize product images
  normalizeProductImages(product) {
    if (!product) return product;
    
    return {
      ...product,
      images: product.images && Array.isArray(product.images) 
        ? product.images.map(img => this.constructImageURL(img))
        : [],
      hoverImage: product.hoverImage 
        ? this.constructImageURL(product.hoverImage)
        : null
    };
  }

  // Base API call method with enhanced error handling
  async apiCall(endpoint, options = {}) {
    try {
      console.log('🌐 Making API call to:', `${API_BASE_URL}${endpoint}`);
      
      const token = localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
        ...options
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        let errorMessage;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || `HTTP ${response.status}: API call failed`;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('📡 Response data received');
      
      return data;
    } catch (error) {
      console.error('❌ API Error:', {
        endpoint,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Base API call for FormData (file uploads)
  async apiCallFormData(endpoint, options = {}) {
    try {
      console.log('🌐 Making FormData API call to:', `${API_BASE_URL}${endpoint}`);
      
      const token = localStorage.getItem('token');
      
      const headers = {
        ...options.headers
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        let errorMessage;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || `HTTP ${response.status}: API call failed`;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('📡 Response data received');
      
      return data;
    } catch (error) {
      console.error('❌ API Error:', {
        endpoint,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Normalize sizes data to ensure correct types
  normalizeSizes(sizes) {
    if (!Array.isArray(sizes)) return [];
    return sizes.map(size => ({
      ...size,
      size: String(size.size || ''),
      price: Number(size.price) || 0,
      available: size.available === true || size.available === 'true',
      stock: Number(size.stock) || 0
    }));
  }

  // ===== ADMIN PRODUCT MANAGEMENT METHODS =====
  
  // Get all products with filters and pagination
  async getAllProducts(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/api/products${queryString ? `?${queryString}` : ''}`;
      const response = await this.apiCall(endpoint);
      
      // Normalize images for all products
      if (response.success && response.data) {
        response.data = Array.isArray(response.data) 
          ? response.data.map(product => this.normalizeProductImages(product))
          : response.data;
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching products:', error);
      return { success: false, error: error.message };
    }
  }

  // Create new product
  async createProduct(productData) {
    try {
      const formData = new FormData();
      
      // Append all product fields
      Object.keys(productData).forEach(key => {
        if (key === 'images' && productData[key]) {
          Array.from(productData[key]).forEach(file => {
            formData.append('images', file);
          });
        } else if (key === 'hoverImage' && productData[key]) {
          formData.append('hoverImage', productData[key]);
        } else if (key === 'sizes' || key === 'fragrance_notes' || key === 'personalization') {
          formData.append(key, JSON.stringify(productData[key]));
        } else if (Array.isArray(productData[key])) {
          formData.append(key, productData[key].join(','));
        } else if (productData[key] !== null && productData[key] !== undefined) {
          formData.append(key, productData[key]);
        }
      });

      const response = await this.apiCallFormData('/api/products', {
        method: 'POST',
        body: formData
      });
      
      // Normalize images in response
      if (response.success && response.data) {
        response.data = this.normalizeProductImages(response.data);
      }
      
      return response;
    } catch (error) {
      console.error('Error creating product:', error);
      return { success: false, error: error.message };
    }
  }

  // Update product
  async updateProduct(productId, productData) {
    try {
      const formData = new FormData();
      
      Object.keys(productData).forEach(key => {
        if (key === 'images' && productData[key]) {
          Array.from(productData[key]).forEach(file => {
            formData.append('images', file);
          });
        } else if (key === 'hoverImage' && productData[key]) {
          formData.append('hoverImage', productData[key]);
        } else if (key === 'sizes' || key === 'fragrance_notes' || key === 'personalization') {
          formData.append(key, JSON.stringify(productData[key]));
        } else if (Array.isArray(productData[key])) {
          formData.append(key, productData[key].join(','));
        } else if (productData[key] !== null && productData[key] !== undefined) {
          formData.append(key, productData[key]);
        }
      });

      const response = await this.apiCallFormData(`/api/products/${productId}`, {
        method: 'PUT',
        body: formData
      });
      
      // Normalize images in response
      if (response.success && response.data) {
        response.data = this.normalizeProductImages(response.data);
      }
      
      return response;
    } catch (error) {
      console.error('Error updating product:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete product
  async deleteProduct(productId) {
    try {
      return await this.apiCall(`/api/products/${productId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, error: error.message };
    }
  }

  // Toggle product status
  async toggleProductStatus(productId) {
    try {
      return await this.apiCall(`/api/products/${productId}/toggle-status`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error toggling product status:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete product image
  async deleteProductImage(productId, imageIndex) {
    try {
      return await this.apiCall(`/api/products/${productId}/image/${imageIndex}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting product image:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete product hover image
  async deleteProductHoverImage(productId) {
    try {
      return await this.apiCall(`/api/products/${productId}/hover-image`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting product hover image:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== COLLECTION METHODS =====
  async getWomensCollections() {
    const response = await this.apiCall('/api/products/women/collections');
    if (response.success && response.data) {
      Object.keys(response.data).forEach(key => {
        response.data[key] = response.data[key].map(product => this.normalizeProductImages(product));
      });
    }
    return response;
  }

  async getMensCollections() {
    const response = await this.apiCall('/api/products/men/collections');
    if (response.success && response.data) {
      Object.keys(response.data).forEach(key => {
        response.data[key] = response.data[key].map(product => this.normalizeProductImages(product));
      });
    }
    return response;
  }

  async getUnisexCollections() {
    const response = await this.apiCall('/api/products/unisex/collections');
    if (response.success && response.data) {
      Object.keys(response.data).forEach(key => {
        response.data[key] = response.data[key].map(product => this.normalizeProductImages(product));
      });
    }
    return response;
  }

  async getGiftCollections() {
    const response = await this.apiCall('/api/products/gifts/collections');
    if (response.success && response.data) {
      Object.keys(response.data).forEach(key => {
        response.data[key] = response.data[key].map(product => this.normalizeProductImages(product));
      });
    }
    return response;
  }

  // Fetch home page collections
  async getHomeCollections() {
    try {
      const endpoint = '/api/products/home/collections';
      const response = await this.apiCall(endpoint);
      
      if (!response.success || !response.data) {
        console.warn('⚠️ No collections data returned');
        return {
          success: false,
          data: {
            fragrant_favourites: [],
            summer_scents: [],
            signature_collection: []
          },
          message: response.message || 'No collections found'
        };
      }

      // Normalize images and sizes for each collection
      const normalizedData = {};
      Object.keys(response.data).forEach(key => {
        normalizedData[key] = response.data[key].map(product => {
          const normalizedProduct = this.normalizeProductImages(product);
          normalizedProduct.sizes = this.normalizeSizes(normalizedProduct.sizes || []);
          return normalizedProduct;
        });
      });

      console.log('✅ Home collections normalized');
      return {
        success: true,
        data: normalizedData
      };
    } catch (error) {
      console.error('❌ Error fetching home collections:', error);
      return {
        success: false,
        data: {
          fragrant_favourites: [],
          summer_scents: [],
          signature_collection: []
        },
        message: error.message
      };
    }
  }

  // Fetch fragrant favorites collection
  async getFragrantFavoritesProducts(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('category', 'home');
      queryParams.append('collection', 'fragrant-favourites');
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const endpoint = `/api/products?${queryParams.toString()}`;
      const response = await this.apiCall(endpoint);
      
      if (response.success && response.data) {
        response.data = Array.isArray(response.data)
          ? response.data.map(product => {
              const normalized = this.normalizeProductImages(product);
              normalized.sizes = this.normalizeSizes(normalized.sizes || []);
              return normalized;
            })
          : response.data;
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error fetching fragrant favorites:', error);
      return {
        success: false,
        data: [],
        message: error.message
      };
    }
  }

  // Fetch home page banners
  async getHomeBanners() {
    try {
      const endpoint = '/api/banners/home';
      const response = await this.apiCall(endpoint);
      
      if (!response.success || !response.data) {
        console.warn('⚠️ No banners data returned');
        return {
          success: false,
          data: [],
          message: response.message || 'No banners found'
        };
      }

      // Normalize banner images (use banner URL builder for speed)
      if (Array.isArray(response.data)) {
        response.data = response.data.map(banner => ({
          ...banner,
          image: banner.image ? this.constructBannerURL(banner.image) : null,
          backgroundImage: banner.backgroundImage ? this.constructBannerURL(banner.backgroundImage) : null
        }));
      }

      console.log('✅ Home banners fetched');
      return response;
    } catch (error) {
      console.error('❌ Error fetching home banners:', error);
      return {
        success: false,
        data: [],
        message: error.message
      };
    }
  }

  // ===== PRODUCT FETCHING METHODS =====
  async getProducts(filters = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/api/products${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.apiCall(endpoint);
    
    // Normalize images for all products
    if (response.success && response.data) {
      response.data = Array.isArray(response.data)
        ? response.data.map(product => this.normalizeProductImages(product))
        : response.data;
    }
    
    return response;
  }

  async getProductsByCollection(category, collection, limit = 6) {
    return this.getProducts({
      category: category.toLowerCase(),
      collection,
      limit
    });
  }

 async searchProducts(query) {
  const response = await this.apiCall(`/api/products/search?q=${encodeURIComponent(query)}`);

  if (response.success && response.data) {
    return {
      products: response.data.products || [],
      scents: response.data.scents || []
    };
  }

  return { products: [], scents: [] };
}

  async getProduct(id) {
    if (!id) {
      throw new Error('Product ID is required');
    }
    
    const cleanId = id.toString().trim();
    
    console.log('🔍 ProductService.getProduct called with ID:', {
      originalId: id,
      cleanId: cleanId,
      idType: typeof cleanId,
      idLength: cleanId.length
    });
    
    if (cleanId.length !== 24) {
      console.error('❌ Invalid ID length:', cleanId.length);
      throw new Error(`Invalid product ID format. Expected 24 characters, got ${cleanId.length}`);
    }
    
    const hexRegex = /^[0-9a-fA-F]{24}$/;
    if (!hexRegex.test(cleanId)) {
      console.error('❌ Invalid ID format - not hex:', cleanId);
      throw new Error('Invalid product ID format. Must contain only hexadecimal characters');
    }
    
    try {
      console.log('🔍 Making API call for product:', cleanId);
      const response = await this.apiCall(`/api/products/${cleanId}`);
      console.log('✅ ProductService.getProduct response received');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch product');
      }
      
      if (!response.data || !response.data.product) {
        throw new Error('Invalid response format - missing product data');
      }
      
      // Normalize images and sizes
      response.data.product = this.normalizeProductImages(response.data.product);
      response.data.product.sizes = this.normalizeSizes(response.data.product.sizes || []);
      
      console.log('🔍 Normalized product data');
      
      return response;
    } catch (error) {
      console.error('❌ ProductService.getProduct error:', {
        id: cleanId,
        error: error.message,
        stack: error.stack
      });
      
      if (error.message.includes('404')) {
        throw new Error(`Product not found with ID: ${cleanId}`);
      } else if (error.message.includes('400')) {
        throw new Error(`Invalid product ID format: ${cleanId}`);
      } else if (error.message.includes('500')) {
        throw new Error('Server error while fetching product. Please try again.');
      }
      
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
  }

  async getDebugCounts() {
    return this.apiCall('/api/products/debug/count');
  }

  async checkProductExists(id) {
    if (!id) {
      throw new Error('Product ID is required for existence check');
    }
    
    const cleanId = id.toString().trim();
    console.log('🔍 Checking product existence for ID:', cleanId);
    
    if (cleanId.length !== 24) {
      return {
        success: true,
        exists: false,
        error: `Invalid ID length: ${cleanId.length}`,
        id: cleanId,
        validId: false
      };
    }
    
    const hexRegex = /^[0-9a-fA-F]{24}$/;
    if (!hexRegex.test(cleanId)) {
      return {
        success: true,
        exists: false,
        error: 'Invalid ID format',
        id: cleanId,
        validId: false
      };
    }
    
    try {
      return await this.apiCall(`/api/products/debug/exists/${cleanId}`);
    } catch (error) {
      console.error('❌ Error checking product existence:', error);
      return {
        success: false,
        exists: false,
        error: error.message,
        id: cleanId,
        validId: true
      };
    }
  }
  // get related products
getRelatedProducts(productId) {
  return axios.get(
    `${API_BASE_URL}/api/products/${productId}/related`
  );
}


  // ===== BANNER METHODS =====
  async getBanners(filters = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/api/banners${queryString ? `?${queryString}` : ''}`;
    
    try {
      const response = await this.apiCall(endpoint);
      
      // Normalize banner images (use banner URL builder for speed)
      if (response.success && response.data && Array.isArray(response.data)) {
        response.data = response.data.map(banner => ({
          ...banner,
          image: banner.image ? this.constructBannerURL(banner.image) : null,
          backgroundImage: banner.backgroundImage ? this.constructBannerURL(banner.backgroundImage) : null
        }));
      }
      
      return response || { success: false, data: [], message: 'No banners found' };
    } catch (error) {
      console.error('❌ Failed to fetch banners:', error.message);
      return { success: false, data: [], message: error.message };
    }
  }

  async getBannersByCategory(category, type = null) {
    const queryParams = new URLSearchParams();
    if (type) queryParams.append('type', type);
    
    const queryString = queryParams.toString();
    const endpoint = `/api/banners/${category.toLowerCase()}${queryString ? `?${queryString}` : ''}`;
    
    try {
      const response = await this.apiCall(endpoint);
      
      // Normalize banner images (use banner URL builder for speed)
      if (response.success && response.data && Array.isArray(response.data)) {
        response.data = response.data.map(banner => ({
          ...banner,
          image: banner.image ? this.constructBannerURL(banner.image) : null,
          backgroundImage: banner.backgroundImage ? this.constructBannerURL(banner.backgroundImage) : null
        }));
      }
      
      return response || { success: false, data: [], message: `No banners found for category: ${category}` };
    } catch (error) {
      console.error(`❌ Failed to fetch banners for category ${category}:`, error.message);
      return { success: false, data: [], message: error.message };
    }
  }

  async getBanner(category, type) {
    const endpoint = `/api/banners/${category.toLowerCase()}/${type}`;
    try {
      const response = await this.apiCall(endpoint);
      
      // Normalize banner images (use banner URL builder for speed)
      if (response.success && response.data) {
        response.data = {
          ...response.data,
          image: response.data.image ? this.constructBannerURL(response.data.image) : null,
          backgroundImage: response.data.backgroundImage ? this.constructBannerURL(response.data.backgroundImage) : null
        };
      }
      
      return response || { success: false, data: null, message: `No banner found for ${category}/${type}` };
    } catch (error) {
      console.error(`❌ Failed to fetch banner for ${category}/${type}:`, error.message);
      return { success: false, data: null, message: error.message };
    }
  }

  async getWomensBanners() {
    return this.getBannersByCategory('women');
  }

  async getMensBanners() {
    return this.getBannersByCategory('men');
  }

  async getUnisexBanners() {
    return this.getBannersByCategory('unisex');
  }

  async getGiftBanners() {
    try {
      const response = await this.getBannersByCategory('gifts');
      if (response.success && response.data && response.data.length > 0) {
        return response;
      }
      
      console.log('🔄 No banners found with "gifts", trying "gift"...');
      return await this.getBannersByCategory('gift');
    } catch (error) {
      console.error('❌ Error fetching gift banners, trying fallback:', error);
      return await this.getBannersByCategory('gift');
    }
  }

  async getHeroBanner(category) {
    return this.getBanner(category, 'hero');
  }

  async getProductHighlightBanners(category) {
    return this.getBannersByCategory(category, 'product_highlight');
  }

  async getCollectionHighlightBanners(category) {
    return this.getBannersByCategory(category, 'collection_highlight');
  }

  async getGiftHighlightBanners() {
    try {
      const response = await this.getBannersByCategory('gifts', 'gift_highlight');
      if (response.success && response.data && response.data.length > 0) {
        return response;
      }
      
      console.log('🔄 No gift highlight banners found with "gifts", trying "gift"...');
      return await this.getBannersByCategory('gift', 'gift_highlight');
    } catch (error) {
      console.error('❌ Error fetching gift highlight banners, trying fallback:', error);
      return await this.getBannersByCategory('gift', 'gift_highlight');
    }
  }

  async trackBannerClick(bannerId) {
    try {
      return await this.apiCall(`/api/banners/${bannerId}/click`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('❌ Failed to track banner click:', error.message);
      return { success: false, message: error.message };
    }
  }

  async getBannerDebugCounts() {
    try {
      return await this.apiCall('/api/banners/debug/count');
    } catch (error) {
      console.error('❌ Failed to fetch banner debug counts:', error.message);
      return { success: false, data: {}, message: error.message };
    }
  }

  // ===== PAGE DATA METHODS =====
  async getMensPageData() {
    try {
      const [collections, banners] = await Promise.all([
        this.getMensCollections(),
        this.getMensBanners()
      ]);

      return {
        success: true,
        data: {
          collections: collections.data || [],
          banners: banners.data || []
        }
      };
    } catch (error) {
      console.error('Error fetching men\'s page data:', error);
      return { success: false, data: { collections: [], banners: [] }, message: error.message };
    }
  }

  async getWomensPageData() {
    try {
      const [collections, banners] = await Promise.all([
        this.getWomensCollections(),
        this.getWomensBanners()
      ]);

      return {
        success: true,
        data: {
          collections: collections.data || [],
          banners: banners.data || []
        }
      };
    } catch (error) {
      console.error('Error fetching women\'s page data:', error);
      return { success: false, data: { collections: [], banners: [] }, message: error.message };
    }
  }

  async getUnisexPageData() {
    try {
      const [collections, banners] = await Promise.all([
        this.getUnisexCollections(),
        this.getUnisexBanners()
      ]);

      return {
        success: true,
        data: {
          collections: collections.data || [],
          banners: banners.data || []
        }
      };
    } catch (error) {
      console.error('Error fetching unisex page data:', error);
      return { success: false, data: { collections: [], banners: [] }, message: error.message };
    }
  }

  async getGiftPageData() {
    try {
      console.log('🎁 Fetching gift page data...');
      
      const [collections, banners] = await Promise.all([
        this.getGiftCollections().catch(err => {
          console.error('❌ Gift collections error:', err);
          return { success: false, data: {}, error: err.message };
        }),
        this.getGiftBanners().catch(err => {
          console.error('❌ Gift banners error:', err);
          return { success: false, data: [], error: err.message };
        })
      ]);

      console.log('🎁 Gift collections response:', collections);
      console.log('🎁 Gift banners response:', banners);

      return {
        success: true,
        data: {
          collections: collections.data || {},
          banners: banners.data || []
        }
      };
    } catch (error) {
      console.error('Error fetching gift page data:', error);
      return { success: false, data: { collections: {}, banners: [] }, message: error.message };
    }
  }

  // ===== UTILITY METHODS =====
  async testConnection() {
    try {
      console.log('🧪 Testing API connection...');
      const response = await fetch(API_BASE_URL + '/');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ API connection test successful:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllProductIds() {
    try {
      const response = await this.apiCall('/api/products/debug/count');
      return response.data?.sampleProducts || [];
    } catch (error) {
      console.error('Error fetching product IDs:', error);
      return [];
    }
  }

  async debugProductId(id) {
    try {
      console.log('🔍 Debug: Testing product ID:', id);
      
      console.log('Step 1: Checking existence...');
      const existsCheck = await this.checkProductExists(id);
      console.log('Exists check result:', existsCheck);
      
      if (existsCheck.exists) {
        console.log('Step 2: Fetching full product...');
        const productResult = await this.getProduct(id);
        console.log('Product fetch result:', productResult);
        return {
          success: true,
          exists: true,
          product: productResult.data?.product,
          debug: { existsCheck, productResult }
        };
      } else {
        return {
          success: true,
          exists: false,
          error: existsCheck.error,
          debug: { existsCheck }
        };
      }
    } catch (error) {
      console.error('Debug error:', error);
      return {
        success: false,
        error: error.message,
        debug: { error: error.stack }
      };
    }
  }

  // ===== DEBUG METHODS =====
  async debugGiftData() {
    console.log('🔍 Starting comprehensive gift data debug...');
    
    try {
      const bannerTests = [
        { endpoint: '/api/banners/gift', name: 'gift (singular)' },
        { endpoint: '/api/banners/gifts', name: 'gifts (plural)' },
        { endpoint: '/api/banners', name: 'all banners' },
        { endpoint: '/api/banners/home', name: 'home banners' }
      ];
      
      console.log('🔍 Testing banner endpoints...');
      for (const test of bannerTests) {
        try {
          const response = await this.apiCall(test.endpoint);
          console.log(`✅ ${test.name} endpoint:`, response);
        } catch (error) {
          console.log(`❌ ${test.name} endpoint failed:`, error.message);
        }
      }
      
      console.log('🔍 Testing gift collections endpoint...');
      try {
        const collections = await this.apiCall('/api/products/gifts/collections');
        console.log('✅ Gift collections:', collections);
      } catch (error) {
        console.log('❌ Gift collections failed:', error.message);
      }
      
      console.log('🔍 Testing home collections endpoint...');
      try {
        const homeCollections = await this.apiCall('/api/products/home/collections');
        console.log('✅ Home collections:', homeCollections);
      } catch (error) {
        console.log('❌ Home collections failed:', error.message);
      }
      
      console.log('🔍 Testing debug counts...');
      try {
        const debugCounts = await this.getDebugCounts();
        console.log('✅ Debug counts:', debugCounts);
      } catch (error) {
        console.log('❌ Debug counts failed:', error.message);
      }
      
      return {
        success: true,
        message: 'Debug completed - check console for detailed logs'
      };
    } catch (error) {
      console.error('❌ Debug failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async debugBannerEndpoints() {
    console.log('🔍 Testing all possible banner endpoints...');
    
    const endpoints = [
      '/api/banners',
      '/api/banners/gift',
      '/api/banners/gifts',
      '/api/banners/gift/hero',
      '/api/banners/gifts/hero',
      '/api/banners/gift/gift_highlight',
      '/api/banners/gifts/gift_highlight',
      '/api/banners/home'
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        const response = await this.apiCall(endpoint);
        results[endpoint] = { success: true, data: response };
        console.log(`✅ ${endpoint}:`, response);
      } catch (error) {
        results[endpoint] = { success: false, error: error.message };
        console.log(`❌ ${endpoint}:`, error.message);
      }
    }
    
    return results;
  }
}

export default new ProductService();