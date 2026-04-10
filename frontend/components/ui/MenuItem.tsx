import Price from '@/components/ui/Price';
import Badge from '@/components/ui/Badge';
import AddToCartButton from '@/components/ui/AddToCartButton';

interface MenuItemProps {
  id: number;
  name: string;
  description: string | null;
  price?: number; // Keep optional for backward compatibility with any remaining mock data
  price_small?: number | null;
  price_large?: number | null;
  allergens?: string[];
  isHot?: boolean;
}

export default function MenuItem({
  id,
  name,
  description,
  price,
  price_small,
  price_large,
  allergens,
  isHot,
}: MenuItemProps) {
  const hasMultiplePrices = price_small && price_large;

  return (
    <div className="group relative flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <h3 className="font-heading text-text-dark text-[1.4rem] font-semibold">
          {name}
        </h3>
        <div className="relative -top-1 flex-grow border-b border-dotted border-gray-300" />

        <div className="flex gap-4">
          {price_small && (
            <div className="flex flex-col items-end">
              {hasMultiplePrices && (
                <span className="text-text-muted mb-1 text-[10px] leading-none uppercase">
                  Liten
                </span>
              )}
              <Price amount={price_small} />
            </div>
          )}
          {price_large && (
            <div className="flex flex-col items-end">
              {hasMultiplePrices && (
                <span className="text-text-muted mb-1 text-[10px] leading-none uppercase">
                  Stor
                </span>
              )}
              <Price amount={price_large} />
            </div>
          )}
          {!price_small && !price_large && price && <Price amount={price} />}
        </div>
      </div>

      {description && (
        <p className="font-body text-text-muted max-w-[85%] text-[0.95rem]">
          {description}
        </p>
      )}

      <div className="mt-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isHot && <Badge variant="hot">Hot</Badge>}
          {allergens && allergens.length > 0 && (
            <div className="flex gap-1">
              {allergens.map((a) => (
                <span
                  key={a}
                  className="text-[0.7rem] font-medium text-gray-400 uppercase"
                >
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {price_small && (
            <AddToCartButton
              itemId={id}
              name={`${name} (Liten)`}
              price={price_small}
              size="small"
            />
          )}
          {price_large && (
            <AddToCartButton
              itemId={id}
              name={price_small ? `${name} (Stor)` : name}
              price={price_large}
              size="large"
            />
          )}
          {!price_small && !price_large && price && (
            <AddToCartButton itemId={id} name={name} price={price} />
          )}
        </div>
      </div>
    </div>
  );
}
