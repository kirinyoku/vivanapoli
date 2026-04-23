import Price from '@/components/ui/Price';
import Badge from '@/components/ui/Badge';
import AddToCartButton from '@/components/ui/AddToCartButton';
import { cn } from '@/lib/utils';

/**
 * Displays a single menu item card with name, description, pricing, allergens, and add-to-cart.
 *
 * Three price display scenarios:
 *  1. **Both `price_small` and `price_large`** — two-column layout with size labels,
 *     each with its own AddToCartButton ("Liten" / "Stor").
 *  2. **Only `price_large`** — single button with the label "Bestill" (or the size name
 *     when paired with small).
 *  3. **Single `price` (legacy)** — full-width layout with a single "Bestill" button.
 *
 * When a discount price is present, the original price is shown with a strikethrough
 * and the discount price is displayed prominently in the primary colour.
 */
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

/**
 * Helper: build the display name for a size-specific AddToCartButton.
 * When the item has both sizes, we append "(Liten)" or "(Stor)" so the
 * cart can distinguish between the two variants of the same product.
 */
const buildCartItemName = (
  baseName: string,
  sizeLabel: string,
  hasMultiplePrices: boolean
) => (hasMultiplePrices ? `${baseName} (${sizeLabel})` : baseName);

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
  /**
   * Discount prices are independent per size — one size may be on sale while
   * the other is at full price. Each column renders its own discount logic
   * rather than assuming a uniform sale across both sizes.
   */

  return (
    <article className="group hover:border-border-light/40 relative flex flex-col gap-3 rounded-2xl border border-transparent p-4 transition-all duration-300 hover:bg-white hover:shadow-2xl hover:shadow-black/5 lg:p-5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading text-text-dark group-hover:text-primary text-xl leading-tight font-semibold transition-colors lg:text-2xl">
              {name}
            </h3>
            <div className="flex shrink-0 gap-2">
              {hasDiscount && (
                <Badge variant="hot" className="scale-90 lg:scale-100">
                  Tilbud
                </Badge>
              )}
              {isHot && (
                <Badge variant="hot" className="scale-90 lg:scale-100">
                  Hot
                </Badge>
              )}
            </div>
          </div>

          {description && (
            <p className="font-body text-text-muted max-w-[95%] text-[13px] leading-relaxed italic opacity-80 lg:text-sm">
              {description}
            </p>
          )}

          {allergens && allergens.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {allergens.map((a) => (
                <span
                  key={a}
                  className="bg-primary/5 text-primary/60 border-primary/10 rounded border px-1.5 py-0.5 text-[8px] font-bold tracking-widest uppercase lg:text-[9px]"
                >
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="border-border-light/40 mt-3 flex flex-wrap items-end justify-between gap-4 border-t pt-3 lg:justify-end">
          {price_small && (
            <div className="group/action flex flex-1 flex-col items-center gap-1.5 lg:flex-none lg:gap-2">
              <div className="flex flex-col items-center">
                {hasMultiplePrices && (
                  <span className="text-text-muted text-[9px] font-bold tracking-[0.15em] uppercase opacity-60 lg:text-[10px]">
                    Liten
                  </span>
                )}
                {discount_price_small ? (
                  <div className="flex flex-col items-center">
                    <span className="text-text-muted text-[9px] line-through decoration-red-500/50 lg:text-[10px]">
                      {price_small},-
                    </span>
                    <Price
                      amount={discount_price_small}
                      className="text-primary text-lg font-bold lg:text-xl"
                    />
                  </div>
                ) : (
                  <Price
                    amount={price_small}
                    className="text-text-dark group-hover/action:text-primary text-lg font-bold transition-colors lg:text-xl"
                  />
                )}
              </div>
              <AddToCartButton
                itemId={id}
                name={`${name} (Liten)`}
                price={discount_price_small || price_small}
                size="small"
                variant="outline"
                label="Liten"
                className="w-full lg:w-28"
              />
            </div>
          )}

          {price_large && (
            <div className="group/action flex flex-1 flex-col items-center gap-1.5 lg:flex-none lg:gap-2">
              <div className="flex flex-col items-center">
                {hasMultiplePrices && (
                  <span className="text-text-muted text-[9px] font-bold tracking-[0.15em] uppercase opacity-60 lg:text-[10px]">
                    Stor
                  </span>
                )}
                {discount_price_large ? (
                  <div className="flex flex-col items-center">
                    <span className="text-text-muted text-[9px] line-through decoration-red-500/50 lg:text-[10px]">
                      {price_large},-
                    </span>
                    <Price
                      amount={discount_price_large}
                      className="text-primary text-lg font-bold lg:text-xl"
                    />
                  </div>
                ) : (
                  <Price
                    amount={price_large}
                    className="text-text-dark group-hover/action:text-primary text-lg font-bold transition-colors lg:text-xl"
                  />
                )}
              </div>
              <AddToCartButton
                itemId={id}
                name={price_small ? `${name} (Stor)` : name}
                price={discount_price_large || price_large}
                size="large"
                variant="primary"
                label={price_small ? 'Stor' : 'Bestill'}
                className="w-full lg:w-32"
              />
            </div>
          )}

          {!price_small && !price_large && price && (
            <div className="group/action flex w-full items-center justify-between gap-2 lg:w-auto lg:flex-col lg:items-center">
              <Price
                amount={price}
                className="text-text-dark group-hover/action:text-primary text-xl font-bold transition-colors"
              />
              <AddToCartButton
                itemId={id}
                name={name}
                price={price}
                className="w-32"
                label="Bestill"
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
