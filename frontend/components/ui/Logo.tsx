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
        'font-heading text-text-dark group relative flex items-center gap-1.5 text-3xl font-semibold tracking-tighter no-underline transition-transform active:scale-95',
        className
      )}
    >
      <div className="flex flex-col">
        <span className="leading-[0.8]">
          Viva<span className="text-primary italic">Napoli</span>
        </span>
        <div className="mt-0.5 h-[1.5px] w-0 bg-accent-gold transition-all duration-500 group-hover:w-full" />
      </div>
    </Link>
  );
}
