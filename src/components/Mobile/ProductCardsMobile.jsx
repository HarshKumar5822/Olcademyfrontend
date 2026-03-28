
import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Star, ShoppingCart } from 'lucide-react';
import { FiHeart } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/CartContext';
import { useWishlist } from '@/WishlistContext';

const ProductCardsMobile = ({ title, products = [], darkMode, addNotification }) => {
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [showAll, setShowAll] = useState(false);
  const visibleProducts = showAll ? products : products.slice(0, 2);

  const ProductCard = memo(({ product }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    if (!product) return null;

    const productInCart = isInCart(
      product._id?.toString(),
      product.sizes?.[0]?.size || null
    );

    const handleAddToCart = async (e) => {
      e.stopPropagation();
      setIsAddingToCart(true);

      const cartItem = {
        id: product._id.toString(),
        name: product.name,
        price: Number(product.price),
        image: product.images?.[0] || '/images/default-gift.png',
        quantity: 1,
        selectedSize: product.sizes?.[0]?.size || null,
        personalization: null,
      };

      try {
        const success = await addToCart(cartItem);
        if (success) {
          addNotification?.('Added to cart!', 'success', product.name, 'cart');
        } else {
          addNotification?.('Failed to add item to cart', 'error', null, 'cart');
        }
      } catch (error) {
        console.error('Add to cart error:', error);
        addNotification?.('Something went wrong. Please try again.', 'error', null, 'cart');
      } finally {
        setIsAddingToCart(false);
      }
    };

    const handleWishlistToggle = (e) => {
      e.stopPropagation();
      if (!product._id) {
        addNotification?.('Unable to add to wishlist', 'error', null, 'wishlist');
        return;
      }

      try {
        const wasInWishlist = isInWishlist(product._id);

        const wishlistProduct = {
          id: product._id.toString(),
          name: product.name,
          price: product.price,
          image: product.images?.[0] || '/images/default-gift.png',
          description: product.description || '',
          category: product.category || '',
          selectedSize: null,
        };

        toggleWishlist(wishlistProduct);
        addNotification?.(
          wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist!',
          'success',
          product.name,
          'wishlist'
        );
      } catch (error) {
        console.error('Wishlist toggle error:', error);
        addNotification?.('Failed to update wishlist', 'error', null, 'wishlist');
      }
    };

    return (
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.3 }}
        className="bg-white shadow-md overflow-hidden w-full flex flex-col"
        onClick={() => navigate(`/product/${product._id}`)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative flex items-center justify-center aspect-[1/1] p-3">
          <motion.img
            src={product.images?.[0] || '/images/default-gift.png'}
            alt={product.name}
            className="object-contain w-full h-full max-w-[160px]"
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 0.4 }}
          />

          <button
            onClick={handleWishlistToggle}
            className="absolute top-2 right-2 bg-white p-1.5"
            aria-label={isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <FiHeart
              size={14}
              className={
                isInWishlist(product._id)
                  ? 'fill-red-600 text-red-600'
                  : 'text-[#5A2408]'
              }
            />
          </button>
        </div>

        <div className="px-3 py-3 flex flex-col gap-2 flex-grow">
          <h3
            className="font-bold uppercase text-center text-sm"
            style={{ fontFamily: 'Playfair Display, serif', color: '#5A2408' }}
          >
            {product.name}
          </h3>

          <div className="flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                style={{
                  color: '#5A2408',
                  fill: i < Math.floor(product.rating || 0) ? '#5A2408' : 'transparent',
                }}
              />
            ))}
          </div>

          <p
            className="text-center text-xs line-clamp-2"
            style={{ fontFamily: 'Manrope, sans-serif', color: '#7E513A' }}
          >
            {product.description || 'Premium fragrance'}
          </p>

          <p
            className="font-bold text-center text-sm"
            style={{ fontFamily: 'Manrope, sans-serif', color: '#431A06' }}
          >
            ${product.price?.toFixed(2)}
          </p>

          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="flex items-center justify-center gap-2 text-white font-bold uppercase h-[42px] w-full text-xs mt-auto"
            style={{ backgroundColor: '#431A06' }}
          >
            <ShoppingCart size={16} />
            {isAddingToCart ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </motion.div>
    );
  });

  ProductCard.displayName = 'ProductCard';

  return (
    <section className="py-10 px-4 bg-[#F8F6F3]">
      <div className="flex items-center justify-between mb-6">
        <h3
          className="font-bold text-2xl"
          style={{
            fontFamily: 'Playfair Display, serif',
            color: '#271004',
          }}
        >
          {title}
        </h3>

        <button
          onClick={() => setShowAll(!showAll)}
          className="border border-[#431A06] text-[#431A06]
                     px-3 py-2 text-xl font-medium
                     hover:bg-[#431A06] hover:text-white
                     transition-all duration-300 rounded-md"
        >
          {showAll ? 'View Less' : 'View All'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {visibleProducts.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default ProductCardsMobile;
