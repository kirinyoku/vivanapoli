'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useNavStore } from '@/store/useNavStore';

interface CategoryLinkProps {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
  variant?: 'sidebar' | 'horizontal';
}

export default function CategoryLink({
  href,
  children,
  isActive: propIsActive,
  className,
  variant = 'sidebar',
}: CategoryLinkProps) {
  const activeCategory = useNavStore((state) => state.activeCategory);
  const isActive = propIsActive || href === `#${activeCategory}`;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      const container = element.closest('.overflow-y-auto') || window;
      const offset = variant === 'horizontal' ? 120 : 60;

      if (container === window) {
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementPosition - offset,
          behavior: 'smooth'
        });
      } else {
        const containerEl = container as HTMLElement;
        const elementTop = element.offsetTop;
        containerEl.scrollTo({
          top: elementTop - offset,
          behavior: 'smooth'
        });
      }
      
      useNavStore.getState().setActiveCategory(id);
      window.history.pushState(null, '', href);
    }
  };

  if (variant === 'horizontal') {
    return (
      <Link
        href={href}
        onClick={handleClick}
        className={cn(
          'relative flex shrink-0 items-center px-4 py-2 transition-all duration-300',
          className
        )}
      >
        <span
          className={cn(
            'whitespace-nowrap text-sm font-bold tracking-wide transition-colors duration-300',
            isActive 
              ? 'text-primary' 
              : 'text-text-muted/60'
          )}
        >
          {children}
        </span>
        {isActive && (
          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
        )}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        'group relative flex items-center py-2 transition-all duration-300',
        isActive ? 'translate-x-2' : 'hover:translate-x-2',
        className
      )}
    >
      <div 
        className={cn(
          "absolute -left-4 h-full w-[2px] bg-accent-gold transition-all duration-300",
          isActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0 group-hover:opacity-40 group-hover:scale-y-50"
        )}
      />
      <span
        className={cn(
          'font-heading text-xl font-medium tracking-wide transition-colors duration-300',
          isActive 
            ? 'text-primary' 
            : 'text-text-muted/70 group-hover:text-primary'
        )}
      >
        {children}
      </span>
    </Link>
  );
}
