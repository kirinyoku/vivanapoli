'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CategoryLinkProps {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}

export default function CategoryLink({
  href,
  children,
  isActive,
  className,
}: CategoryLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'block py-2 font-heading text-[1.1rem] font-semibold transition-all duration-200 no-underline',
        isActive
          ? 'translate-x-1 text-primary'
          : 'text-text-muted hover:translate-x-1 hover:text-primary',
        className
      )}
    >
      {children}
    </Link>
  );
}
