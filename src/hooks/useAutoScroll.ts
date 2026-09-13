'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to automatically scroll the page smoothly when isScrolling is true
 */
export function useAutoScroll(speed: number = 3, isScrolling: boolean = false) {
  const animationRef = useRef<number | null>(null);

  const stopScroll = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const startScroll = useCallback(() => {
    stopScroll();
    if (speed <= 0) return;

    const scroll = () => {
      // Speed multiplier: adjust for natural reading pace
      const step = Math.max(0.3, (speed * 0.45));
      window.scrollBy(0, step);

      // Stop automatically if reached bottom of page
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10) {
        stopScroll();
        return;
      }

      animationRef.current = requestAnimationFrame(scroll);
    };

    animationRef.current = requestAnimationFrame(scroll);
  }, [speed, stopScroll]);

  useEffect(() => {
    if (isScrolling) {
      startScroll();
    } else {
      stopScroll();
    }

    return () => stopScroll();
  }, [isScrolling, speed, startScroll, stopScroll]);

  return { startScroll, stopScroll };
}
