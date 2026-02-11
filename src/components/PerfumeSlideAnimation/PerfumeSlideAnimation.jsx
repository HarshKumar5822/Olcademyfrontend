import { memo, useEffect, useMemo, useState } from 'react';
import styles from './PerfumeSlideAnimation.module.css';

const POS_CLASS_BY_OFFSET = {
  '-2': 'posNegative2',
  '-1': 'posNegative1',
  '0': 'pos0',
  '1': 'pos1',
  '2': 'pos2',
  '3': 'pos2' // Handle wrap gracefully if needed, though strictly we cycle 0-4
};

const Z_BY_OFFSET = {
  '-2': 30,
  '-1': 40,
  '0': 50,
  '1': 40,
  '2': 30,
  '3': 20
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const getImage = (item) => {
  if (!item) return '/images/hero-default.jpg';
  if (Array.isArray(item.images) && item.images.length > 0) return item.images[0];
  return '/images/hero-default.jpg';
};

const getTitle = (item) => item?.name || 'Oud Wood';

const offsetForIndex = (index, activeIndex, len) => {
  if (!len) return 0;
  // Calculate raw difference
  let diff = (index - activeIndex) % len;

  // Normalize to range [-2, 2] for 5 items
  // If len is 5: 
  // diff 0 -> 0
  // diff 1 -> 1
  // diff 2 -> 2
  // diff 3 -> -2
  // diff 4 -> -1

  // Handle Javascript negative modulo
  if (diff < 0) diff += len;

  // Adjust to be centered around 0
  if (diff > 2) diff -= len;

  return diff;
};

const PerfumeSlideAnimation = memo(
  ({ products = [], intervalMs = 3000, onProductClick }) => {
    const items = useMemo(() => {
      let cleaned = (Array.isArray(products) ? products : []).filter((p) => p && p._id);

      // Ensure we have exactly 5 items
      if (cleaned.length > 0 && cleaned.length < 5) {
        while (cleaned.length < 5) {
          cleaned = [...cleaned, ...cleaned];
        }
      }

      return cleaned.slice(0, 5);
    }, [products]);

    const len = items.length;
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
      setActiveIndex(0);
    }, [len]);

    useEffect(() => {
      if (len < 2) return;
      if (prefersReducedMotion()) return;

      const timer = setInterval(() => {
        setActiveIndex((current) => (current + 1) % len);
      }, intervalMs);

      return () => clearInterval(timer);
    }, [len, intervalMs]);

    if (!len) return null;

    // Optional: Calculate a "ghost" item coming in from the right?
    // With our logic, the item at offset -3 (far left) will wrap to +3 (far right) in the next step.
    // However, during the transition, we might want to see it moving from +4 to +3 if we want continuous flow?
    // But standard circular carousel usually just swaps the hidden items.
    // Let's stick to the 7 visible items first, as -3 to +3 wraps around behind nicely if not visible.
    // If we want smooth entry from offscreen, we might need a duplicate.

    // Actually, simply mapping the 7 items to positions is enough if the transition handles the movement.
    // The only jump is from -3 (left) to +3 (right). We need to make sure that jump is invisible (e.g. opacity 0 or z-index low).
    // Our CSS has transition on 'left' property.
    // Going from -3 (left) to +3 (right) will fly across the screen. 
    // We need to prevent that fly-across.
    // Usually achieved by disabling transition for that specific jump, or having a ghost.
    // Simpler approach: The offset function results in discrete integers. 
    // React reconciliation will update the class.
    // If an item goes from posNegative3 to pos3, it moves from Left to Right instantly?
    // Wait. 
    // Active Index increases.
    // Index i: offset decreases.
    // 3 -> 2 -> 1 -> 0 -> -1 -> -2 -> -3.
    // Then -3 -> 3.
    // The jump is Leftmost -> Rightmost.
    // This effectively "recycles" the card from left end to right end to start over.
    // We want this jump to be invisible or behind everything.
    // posNegative3 opacity is 0.5. pos3 opacity is 0.5.
    // If it flies across, it will cut through the center.
    // Fix: Ensure z-index is lowest during jump, or use a ghost.
    // Let's rely on standard circular buffer behavior for now but maybe hide the one jumping?
    // In the previous code there was a ghost card.

    return (
      <div className={styles.perfumeSlideAnimation}>
        {items.map((item, index) => {
          const offset = offsetForIndex(index, activeIndex, len);
          const posKey = POS_CLASS_BY_OFFSET[String(offset)];
          const posClass = styles[posKey];

          // To prevent "flying across" when wrapping from -3 to 3 (or vice versa),
          // we can check if it's the wrapping item. 
          // But actually, as activeIndex increases, offset decreases: 3 -> 2 ... -> -3.
          // The wrapping step is -3 -> 3? No, -3 is bottom. Next step (-4) wraps to +3.
          // So the item moves from Far Left (-3) to Far Right (+3).
          // Yes, that's the recycle step.
          // To hide the fly-across, we can add a specific style or just ensure z-index is low.
          // The CSS transition will animate it. We want to avoid animating the "teleport".
          // A common trick is to not render it, or have a "hidden" class that removes transition?
          // OR, since it's at the back, maybe it's fine? 
          // Previous implementation had specific handling presumably.

          return (
            <div
              key={item._id}
              className={`${styles.cardBase} ${posClass} ${styles.cardMotion}`}
              style={{ zIndex: Z_BY_OFFSET[String(offset)] || 1 }}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onProductClick?.(item);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onProductClick?.(item);
                }
              }}
            >
              <img
                className={styles.cardImage}
                alt={getTitle(item)}
                src={getImage(item)}
                loading="lazy"
              />
              <div className={styles.textContainer}>
                <div className={styles.title}>{getTitle(item)}</div>
                {/* Description hidden via CSS */}
                <div className={styles.description}>{item.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

PerfumeSlideAnimation.displayName = 'PerfumeSlideAnimation';

export default PerfumeSlideAnimation;
