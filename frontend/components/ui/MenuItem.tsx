import Price from '@/components/ui/Price';
import Badge from '@/components/ui/Badge';
import AddToCartButton from '@/components/ui/AddToCartButton';

interface MenuItemProps {
  id: number;
  name: string;
  description: string | null;
  price?: number;
  price_small?: number | null;
  price_large?: number | null;
  discount_price_small?: number | null;
  discount_price_large?: number | null;
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
  discount_price_small,
  discount_price_large,
  allergens,
  isHot,
}: MenuItemProps) {
  const hasMultiplePrices = price_small && price_large;
  const hasDiscount = !!(discount_price_small || discount_price_large);

  return (
    <div className="group relative flex cursor-default flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <h3 className="font-heading text-text-dark text-[1.4rem] font-semibold">
          {name}
        </h3>
        {hasDiscount && <Badge variant="hot">Tilbud</Badge>}
        <div className="relative -top-1 flex-grow border-b border-dotted border-gray-300" />

        <div className="flex gap-4">
          {price_small && (
            <div className="flex flex-col items-end">
              {hasMultiplePrices && (
                <span className="text-text-muted mb-1 text-[10px] leading-none uppercase">
                  Liten
                </span>
              )}
              {discount_price_small ? (
                <div className="flex flex-col items-end">
                  <span className="text-text-muted text-xs line-through decoration-red-500/50">
                    {price_small},-
                  </span>
                  <Price
                    amount={discount_price_small}
                    className="text-primary font-bold"
                  />
                </div>
              ) : (
                <Price amount={price_small} />
              )}
            </div>
          )}
          {price_large && (
            <div className="flex flex-col items-end">
              {hasMultiplePrices && (
                <span className="text-text-muted mb-1 text-[10px] leading-none uppercase">
                  Stor
                </span>
              )}
              {discount_price_large ? (
                <div className="flex flex-col items-end">
                  <span className="text-text-muted text-xs line-through decoration-red-500/50">
                    {price_large},-
                  </span>
                  <Price
                    amount={discount_price_large}
                    className="text-primary font-bold"
                  />
                </div>
              ) : (
                <Price amount={price_large} />
              )}
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
              price={discount_price_small || price_small}
              size="small"
            />
          )}
          {price_large && (
            <AddToCartButton
              itemId={id}
              name={price_small ? `${name} (Stor)` : name}
              price={discount_price_large || price_large}
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
