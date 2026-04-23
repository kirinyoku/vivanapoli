'use client';

/**
 * Scroll spy component – tracks which menu category is currently visible.
 *
 * Uses an `IntersectionObserver` attached to a scrollable container to detect
 * which category section is in view. Updates the active category in the shared
 * `useNavStore`, which drives the visual highlight in the sidebar and mobile
 * category navigation.
 *
 * The observer uses `rootMargin: '-80px 0px -60% 0px'` to trigger before the
 * section fully exits the viewport, providing a smoother navigation experience.
 */
import { useEffect, useRef } from 'react';
import { useNavStore } from '@/store/useNavStore';

interface ScrollSpyProps {
  categories: string[];
}

export default function ScrollSpy({ categories }: ScrollSpyProps) {
  const setActiveCategory = useNavStore((state) => state.setActiveCategory);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const container =
      document.getElementById('menu-scroll-container') ||
      document.querySelector('main');

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
          setActiveCategory(entry.target.id);
        }
      });
    };

    const options: IntersectionObserverInit = {
      root: container,
      rootMargin: '-80px 0px -60% 0px',
      threshold: [0, 0.1, 0.5],
    };

    observer.current = new IntersectionObserver(observerCallback, options);

    categories.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.current?.observe(el);
    });

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [categories, setActiveCategory]);

  return null;
}
