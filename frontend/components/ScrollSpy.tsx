'use client';

import { useEffect, useRef } from 'react';
import { useNavStore } from '@/store/useNavStore';

interface ScrollSpyProps {
  categories: string[];
}

export default function ScrollSpy({ categories }: ScrollSpyProps) {
  const setActiveCategory = useNavStore((state) => state.setActiveCategory);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Find the scrollable container
    const root = document.querySelector('main');

    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id);
          }
        });
      },
      {
        root: root,
        // Trigger when the element is in the top 30% of the viewport
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0,
      }
    );

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
