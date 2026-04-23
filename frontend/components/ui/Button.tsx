'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Reusable button component wrapping a native `<button>` with preset variants and sizes.
 *
 * Uses `forwardRef` so parent components or form libraries can access the underlying
 * DOM node. The `displayName` assignment is required for React DevTools to show a
 * meaningful name (it defaults to `"Button"` without it due to the anonymous forwardRef
 * wrapper).
 *
 * Disabled state is handled via utility classes (`pointer-events-none`, `opacity-50`)
 * rather than the HTML `disabled` attribute alone, giving consistent visual behaviour
 * regardless of variant.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'link' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary:
        'bg-primary text-white hover:bg-primary-dark hover:shadow-lg transition-all duration-200 cursor-pointer',
      ghost:
        'bg-transparent hover:bg-black/5 transition-all duration-200 cursor-pointer',
      link: 'bg-transparent text-primary font-semibold hover:underline p-0 h-auto transition-colors duration-200 cursor-pointer',
      outline:
        'border border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all duration-200 cursor-pointer',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base rounded-lg',
      lg: 'px-6 py-3 text-lg font-semibold rounded-xl',
      icon: 'p-2',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium whitespace-nowrap disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;
