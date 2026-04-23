import { cn } from '@/lib/utils';

/**
 * Section heading with an optional description.
 *
 * When no description is provided a small gold accent bar is shown in its
 * place — this keeps the visual rhythm consistent across sections that
 * don't need explanatory text.
 */
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
        'border-border-light/60 relative mb-12 border-b pb-6 text-left',
        className
      )}
    >
      <div className="mb-3 flex items-center gap-4">
        <h2 className="font-heading text-text-dark text-5xl font-semibold tracking-tight">
          {title}
        </h2>
        <div className="bg-border-light/60 h-[1px] flex-grow" />
      </div>

      {description ? (
        <p className="font-body text-text-muted max-w-2xl text-[1.1rem] leading-relaxed italic opacity-80">
          {description}
        </p>
      ) : (
        <div className="bg-accent-gold h-1 w-16 rounded-full" />
      )}
    </div>
  );
}
