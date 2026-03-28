import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import axios from 'axios';
import { USER_API_END_POINT,API_BASE_URL } from '@/api/constant';
import BrownNotification from '@/components/BrownNotification';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();
  const [notification, setNotification] = useState({ show: false, message: '' });

  const showNotification = (message) => {
    setNotification({ show: true, message });
  };

  // API base URL for cart - Updated to match your backend structure
  const CART_API_BASE = `${API_BASE_URL}/cart`;

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Reset initialization when user changes (login/logout)
  useEffect(() => {
    setIsInitialized(false);
  }, [user?.id]);

  // Enhanced local storage cart with stock info - for demo purposes
  const enhanceLocalCartWithStock = async (localCartItems) => {
    if (!localCartItems || localCartItems.length === 0) return [];
    
    try {
      // For local cart items, we'll set default stock info
      // In production, you might want to fetch real stock from an API
      return localCartItems.map(item => ({
        ...item,
        availableStock: item.availableStock || 10, // Default stock for demo
        outOfStock: false,
        exceedsStock: false
      }));
    } catch (error) {
      console.error('Error enhancing local cart:', error);
      return localCartItems;
    }
  };

  // Load cart from database when user is authenticated or from localStorage when not
  useEffect(() => {
    const loadCart = async () => {
      if (isInitialized) return;

      try {
        setLoading(true);
        console.log('Initializing cart...');

        if (user && token) {
          console.log('Loading cart for authenticated user:', user.email);
          
          const storedCart = typeof window !== "undefined" ? localStorage.getItem('cartItems') : null;
          let localItems = [];
          if (storedCart) {
            try {
              localItems = JSON.parse(storedCart);
              console.log('Found local cart items to sync:', localItems.length);
            } catch (err) {
              console.error('Error parsing stored cart:', err);
            }
          }

          try {
            const response = await axios.get(CART_API_BASE);
            if (response.data.success) {
              const dbItems = response.data.cartItems || [];
              console.log('Loaded cart from database:', dbItems.length, 'items');
              
              if (localItems.length > 0) {
                console.log('Syncing local items to database...');
                await syncCartToDatabase(localItems);
                
                const syncResponse = await axios.get(CART_API_BASE);
                if (syncResponse.data.success) {
                  setCartItems(syncResponse.data.cartItems || []);
                  console.log('Cart synced successfully');
                }
              } else {
                setCartItems(dbItems);
              }
            } else {
              setCartItems([]);
            }
          } catch (apiError) {
            console.warn('Cart API not available, using localStorage only');
            const enhancedItems = await enhanceLocalCartWithStock(localItems);
            setCartItems(enhancedItems);
          }
        } else {
          console.log('Loading cart from localStorage for non-authenticated user');
          const storedCart = typeof window !== "undefined" ? localStorage.getItem('cartItems') : null;
          if (storedCart) {
            try {
              const localItems = JSON.parse(storedCart);
              const enhancedItems = await enhanceLocalCartWithStock(localItems);
              setCartItems(enhancedItems);
              console.log('Loaded cart from localStorage:', enhancedItems.length, 'items');
            } catch (err) {
              console.error('Error parsing cart:', err);
              setCartItems([]);
            }
          } else {
            setCartItems([]);
          }
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        const storedCart = typeof window !== "undefined" ? localStorage.getItem('cartItems') : null;
        if (storedCart) {
          try {
            const fallbackItems = JSON.parse(storedCart);
            const enhancedItems = await enhanceLocalCartWithStock(fallbackItems);
            setCartItems(enhancedItems);
            console.log('Using localStorage fallback:', enhancedItems.length, 'items');
          } catch (err) {
            console.error('Error parsing stored cart:', err);
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    loadCart();
  }, [user, token, isInitialized, CART_API_BASE]);

  // Save to localStorage for all users (as fallback and for non-authenticated users)
  useEffect(() => {
    if (isInitialized && cartItems.length >= 0) {
      // Remove stock info before saving to localStorage
      const itemsToStore = cartItems.map(item => {
        const { availableStock, outOfStock, exceedsStock, ...itemWithoutStock } = item;
        return itemWithoutStock;
      });
      localStorage.setItem('cartItems', JSON.stringify(itemsToStore));
    }
  }, [cartItems, isInitialized]);

  // Sync localStorage cart to database when user logs in
  const syncCartToDatabase = async (localCartItems) => {
    if (!user || !token || localCartItems.length === 0) return;

    try {
      console.log('Syncing cart to database...');
      for (const item of localCartItems) {
        try {
          await axios.post(`${CART_API_BASE}/add`, {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity || 1,
            selectedSize: item.selectedSize || null,
            personalization: item.personalization || null,
            brand: item.brand || '',
            sku: item.sku || ''
          });
          console.log('Synced item:', item.name);
        } catch (error) {
          if (error.response?.status !== 400) {
            console.error('Error syncing item to database:', error);
          }
        }
      }
      
      // Don't clear localStorage - keep as backup
      console.log('Cart sync completed');
      
    } catch (error) {
      console.error('Error syncing cart to database:', error);
    }
  };

  const addToCart = async (product) => {
    try {
      // Validate required fields
      if (!product.id || !product.name || !product.price || !product.image) {
        throw new Error('All required product fields (id, name, price, image) must be provided');
      }

      // Check if product already exists in cart
      const exists = cartItems.find(item => item.id === product.id && item.selectedSize === product.selectedSize);
      if (exists) {
        // If it exists, increment quantity instead of showing error
        await updateQuantity(product.id, exists.quantity + 1);
        return true;
      }

      const newItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: product.quantity || 1,
        selectedSize: product.selectedSize || null,
        personalization: product.personalization || null,
        brand: product.brand || '',
        sku: product.sku || '',
        availableStock: 10, // Default for demo - in production fetch real stock
        outOfStock: false,
        exceedsStock: false
      };

      if (user && token) {
        // Try to add to database
        try {
          setLoading(true);
          const response = await axios.post(`${CART_API_BASE}/add`, {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: product.quantity || 1,
            selectedSize: product.selectedSize || null,
            personalization: product.personalization || null,
            brand: product.brand || '',
            sku: product.sku || ''
          });
          if (response.data.success) {
            setCartItems(response.data.cartItems || []);
            showNotification(`${product.name} added to cart`);
            return true;
          }
        } catch (apiError) {
          console.warn('Cart API not available, using localStorage only');
          // Fall back to localStorage
          const updatedCart = [...cartItems, newItem];
          setCartItems(updatedCart);
          showNotification(`${product.name} added to cart`);
          return true;
        }
      } else {
        // Add to localStorage for non-authenticated users
        const updatedCart = [...cartItems, newItem];
        setCartItems(updatedCart);
        showNotification(`${product.name} added to cart`);
        return true;
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      // Always fall back to localStorage
      try {
        const newItem = {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: product.quantity || 1,
          selectedSize: product.selectedSize || null,
          personalization: product.personalization || null,
          brand: product.brand || '',
          sku: product.sku || '',
          availableStock: 10,
          outOfStock: false,
          exceedsStock: false
        };
        const updatedCart = [...cartItems, newItem];
        setCartItems(updatedCart);
        showNotification(`${product.name} added to cart`);
        return true;
      } catch (localError) {
        console.error('Failed to add to local cart:', localError);
        toast.error('Failed to add item to cart');
        return false;
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (id) => {
    try {
      const product = cartItems.find(item => item.id === id);
      
      if (user && token) {
        try {
          setLoading(true);
          const response = await axios.delete(`${CART_API_BASE}/remove/${id}`);
          if (response.data.success) {
            setCartItems(response.data.cartItems || []);
            showNotification(response.data.message || `${product?.name || 'Item'} removed from cart`);
            return;
          }
        } catch (apiError) {
          console.warn('Cart API not available, using localStorage only');
        }
      }
      
      // Fall back to localStorage removal
      const updatedCart = cartItems.filter(item => item.id !== id);
      setCartItems(updatedCart);
      showNotification(`${product?.name || 'Item'} removed from cart`);
    } catch (error) {
      console.error('Remove from cart error:', error);
      toast.error('Failed to remove item from cart');
    } finally {
      setLoading(false);
    }
  };

  // const clearCart = async () => {
  //   try {
  //     if (user && token) {
  //       try {
  //         setLoading(true);
  //         const response = await axios.delete(`${CART_API_BASE}/clear`);
  //         if (response.data.success) {
  //           setCartItems([]);
  //           showNotification(response.data.message || 'Cart cleared');
  //           return;
  //         }
  //       } catch (apiError) {
  //         console.warn('Cart API not available, using localStorage only');
  //       }
  //     }
      const clearCart = async () => {
  try {
    if (user && token) {
      try {
        setLoading(true);
        const response = await axios.delete(`${CART_API_BASE}/clear`);
        if (response.data.success) {
          setCartItems([]);
          showNotification(response.data.message || 'Cart cleared');
          return;
        }
      } catch (apiError) {
        console.warn('Cart API not available, using localStorage only');
        // Don't return here, let it fall through to localStorage clear
      } finally {
        setLoading(false);
      }
    }
  //    // Fall back to localStorage clear
    setCartItems([]);
    showNotification('Cart cleared');
  } catch (error) {
    console.error('Clear cart error:', error);
    toast.error('Failed to clear cart');
  }
};
  const updateQuantity = async (id, quantity) => {
    if (quantity < 1) return;
    
    try {
      if (user && token) {
        // For authenticated users, try API call first
        try {
          setLoading(true);
          const response = await axios.put(`${CART_API_BASE}/update/${id}`, { quantity });
          if (response.data.success) {
            setCartItems(response.data.cartItems || []);
            showNotification('Quantity updated');
            return;
          }
        } catch (apiError) {
          console.warn('Cart update API not available, using localStorage only');
        }
      }
      
      // For local storage or API fallback, check stock limits
      const itemIndex = cartItems.findIndex(item => item.id === id);
      if (itemIndex !== -1) {
        const item = cartItems[itemIndex];
        const maxStock = item.availableStock || 10; // Use availableStock or default
        
        if (quantity > maxStock) {
          toast.error(`Only ${maxStock} items available in stock`);
          return;
        }
        
        const updatedCart = cartItems.map(cartItem => 
          cartItem.id === id ? { 
            ...cartItem, 
            quantity,
            exceedsStock: quantity > maxStock
          } : cartItem
        );
        setCartItems(updatedCart);
        showNotification('Quantity updated');
      }
    } catch (error) {
      console.error('Update quantity error:', error);
      toast.error('Failed to update quantity');
    } finally {
      setLoading(false);
    }
  };

  const getCartCount = () => {
    return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const isInCart = (productId, selectedSize = null) => {
    return cartItems.some(item => item.id === productId && item.selectedSize === selectedSize);
  };

  // Refresh cart to get updated stock information
  const refreshCart = async () => {
    if (user && token) {
      try {
        setLoading(true);
        const response = await axios.get(CART_API_BASE);
        if (response.data.success) {
          setCartItems(response.data.cartItems || []);
        }
      } catch (error) {
        console.error('Error refreshing cart:', error);
        // Keep current localStorage items if API fails
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      setCartItems, 
      addToCart, 
      removeFromCart, 
      clearCart,
      updateQuantity,
      getCartCount,
      isInCart,
      refreshCart,
      loading,
      isInitialized
    }}>
      {children}
      <BrownNotification
        message={notification.message}
        isVisible={notification.show}
        onClose={() => setNotification({ show: false, message: '' })}
      />
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};