'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useNavStore } from '@/store/useNavStore';

interface CategoryLinkProps {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}

export default function CategoryLink({
  href,
  children,
  isActive: propIsActive,
  className,
}: CategoryLinkProps) {
  const activeCategory = useNavStore((state) => state.activeCategory);
  const isActive = propIsActive || href === `#${activeCategory}`;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      // Update store immediately on click
      useNavStore.getState().setActiveCategory(id);
      // Update URL hash without jumping
      window.history.pushState(null, '', href);
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        'font-heading block cursor-pointer py-2 text-[1.1rem] font-semibold no-underline transition-all duration-200',
        isActive
          ? 'text-primary translate-x-1'
          : 'text-text-muted hover:text-primary hover:translate-x-1',
        className
      )}
    >
      {children}
    </Link>
  );
}
