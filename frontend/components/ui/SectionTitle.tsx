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
        'mb-10 border-b border-border-light pb-4 text-left',
        className
      )}
    >
      <h2 className="mb-2 font-heading text-4xl font-semibold text-text-dark">
        {title}
      </h2>
      {description && (
        <p className="font-heading text-[1.2rem] italic text-text-muted">
          {description}
        </p>
      )}
    </div>
  );
}
