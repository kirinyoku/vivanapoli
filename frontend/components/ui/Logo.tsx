import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        'font-heading text-3xl font-semibold text-text-dark no-underline',
        className
      )}
    >
      Viva<span className="text-primary">Napoli</span>
    </Link>
  );
}
