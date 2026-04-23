'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useNavStore } from '@/store/useNavStore';

/**
 * Navigation link for a menu category with scroll-to behaviour and active-state highlighting.
 *
 * Unlike a standard Next `<Link>`, this component:
 *  1. Intercepts the click (`e.preventDefault()`)
 *  2. Scrolls the target section into view with an offset that depends on the variant
 *  3. Updates the Zustand store's `activeCategory` and the browser's URL hash
 *
 * Two visual variants:
 *  - `sidebar`: gold accent line on the left, larger text
 *  - `horizontal`: smaller text with an underline when active
 */
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

  /**
   * Custom scroll handler that replaces the default link navigation.
   *
   * We locate the target element by its `id`, find the nearest scrollable
   * ancestor (`.overflow-y-auto`) or fall back to `window`, and scroll with
   * a smooth animation. The offset varies:
   *  - `horizontal` variant: 120px (accounts for a fixed header)
   *  - `sidebar` variant: 60px
   *
   * After scrolling we update the store and the URL hash without causing
   * a page reload (using `pushState`).
   */
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      const container = element.closest('.overflow-y-auto') || window;
      const offset = variant === 'horizontal' ? 120 : 60;

      if (container === window) {
        const elementPosition =
          element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementPosition - offset,
          behavior: 'smooth',
        });
      } else {
        const containerEl = container as HTMLElement;
        const elementTop = element.offsetTop;
        containerEl.scrollTo({
          top: elementTop - offset,
          behavior: 'smooth',
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
            'text-sm font-bold tracking-wide whitespace-nowrap transition-colors duration-300',
            isActive ? 'text-primary' : 'text-text-muted/60'
          )}
        >
          {children}
        </span>
        {isActive && (
          <div className="bg-primary absolute right-4 bottom-0 left-4 h-0.5 rounded-full" />
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
          'bg-accent-gold absolute -left-4 h-full w-[2px] transition-all duration-300',
          isActive
            ? 'scale-y-100 opacity-100'
            : 'scale-y-0 opacity-0 group-hover:scale-y-50 group-hover:opacity-40'
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
