import { cn } from '@/lib/utils';

interface SectionTitleProps {
  title: string;
  description?: string;
  className?: string;
}

export default function SectionTitle({
  title,
  description,
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        'mb-12 border-b border-border-light/60 pb-6 text-left relative',
        className
      )}
    >
      <div className="flex items-center gap-4 mb-3">
        <h2 className="font-heading text-5xl font-semibold text-text-dark tracking-tight">
          {title}
        </h2>
        <div className="flex-grow h-[1px] bg-border-light/60" />
      </div>
      
      {description ? (
        <p className="font-body text-[1.1rem] italic text-text-muted opacity-80 max-w-2xl leading-relaxed">
          {description}
        </p>
      ) : (
        <div className="h-1 w-16 bg-accent-gold rounded-full" />
      )}
    </div>
  );
}
