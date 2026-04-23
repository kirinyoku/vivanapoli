import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Site logo linking to the homepage.
 *
 * The `asH1` prop lets callers wrap the logo in an `<h1>` tag for semantic
 * HTML when this component appears at the top of the page layout; otherwise
 * it renders as a plain `<span>` inside the link. The hover animation
 * (gold underline expanding from left) is achieved via `group-hover` on the
 * parent link element.
 */
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
      <div className="bg-accent-gold mt-0.5 h-[1.5px] w-0 transition-all duration-500 group-hover:w-full" />
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
