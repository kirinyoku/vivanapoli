import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  asH1?: boolean;
}

export default function Logo({ className, asH1 }: LogoProps) {
  const content = (
    <div className="flex flex-col">
      <span className="leading-[0.8]">
        Viva<span className="text-primary italic">Napoli</span>
      </span>
      <div className="mt-0.5 h-[1.5px] w-0 bg-accent-gold transition-all duration-500 group-hover:w-full" />
    </div>
  );

  const logoClasses = cn(
    'font-heading text-text-dark group relative flex items-center gap-1.5 text-3xl font-semibold tracking-tighter no-underline transition-transform active:scale-95',
    className
  );

  return (
    <Link href="/" className={logoClasses}>
      {asH1 ? <h1>{content}</h1> : content}
    </Link>
  );
}
