import Price from '@/components/ui/Price';
import Badge from '@/components/ui/Badge';
import AddToCartButton from '@/components/ui/AddToCartButton';
import { cn } from '@/lib/utils';

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
    <div className="group relative flex flex-col gap-3 rounded-2xl p-4 lg:p-5 transition-all duration-300 hover:bg-white hover:shadow-2xl hover:shadow-black/5 border border-transparent hover:border-border-light/40">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading text-text-dark text-xl lg:text-2xl font-semibold leading-tight transition-colors group-hover:text-primary">
              {name}
            </h3>
            <div className="flex gap-2 shrink-0">
              {hasDiscount && <Badge variant="hot" className="scale-90 lg:scale-100">Tilbud</Badge>}
              {isHot && <Badge variant="hot" className="scale-90 lg:scale-100">Hot</Badge>}
            </div>
          </div>

          {description && (
            <p className="font-body text-text-muted max-w-[95%] text-[13px] lg:text-sm leading-relaxed italic opacity-80">
              {description}
            </p>
          )}

          {allergens && allergens.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {allergens.map((a) => (
                <span
                  key={a}
                  className="bg-primary/5 text-primary/60 border border-primary/10 rounded px-1.5 py-0.5 text-[8px] lg:text-[9px] font-bold tracking-widest uppercase"
                >
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-4 items-end justify-between lg:justify-end border-t border-border-light/40 pt-3">
          {price_small && (
            <div className="flex flex-1 lg:flex-none flex-col items-center gap-1.5 lg:gap-2 group/action">
              <div className="flex flex-col items-center">
                {hasMultiplePrices && (
                  <span className="text-text-muted text-[9px] lg:text-[10px] font-bold tracking-[0.15em] uppercase opacity-60">
                    Liten
                  </span>
                )}
                {discount_price_small ? (
                  <div className="flex flex-col items-center">
                    <span className="text-text-muted text-[9px] lg:text-[10px] line-through decoration-red-500/50">
                      {price_small},-
                    </span>
                    <Price
                      amount={discount_price_small}
                      className="text-primary text-lg lg:text-xl font-bold"
                    />
                  </div>
                ) : (
                  <Price amount={price_small} className="text-text-dark text-lg lg:text-xl font-bold group-hover/action:text-primary transition-colors" />
                )}
              </div>
              <AddToCartButton
                itemId={id}
                name={`${name} (Liten)`}
                price={discount_price_small || price_small}
                size="small"
                variant="outline"
                label="Liten +"
                className="w-full lg:w-28"
              />
            </div>
          )}

          {price_large && (
            <div className="flex flex-1 lg:flex-none flex-col items-center gap-1.5 lg:gap-2 group/action">
              <div className="flex flex-col items-center">
                {hasMultiplePrices && (
                  <span className="text-text-muted text-[9px] lg:text-[10px] font-bold tracking-[0.15em] uppercase opacity-60">
                    Stor
                  </span>
                )}
                {discount_price_large ? (
                  <div className="flex flex-col items-center">
                    <span className="text-text-muted text-[9px] lg:text-[10px] line-through decoration-red-500/50">
                      {price_large},-
                    </span>
                    <Price
                      amount={discount_price_large}
                      className="text-primary text-lg lg:text-xl font-bold"
                    />
                  </div>
                ) : (
                  <Price amount={price_large} className="text-text-dark text-lg lg:text-xl font-bold group-hover/action:text-primary transition-colors" />
                )}
              </div>
              <AddToCartButton
                itemId={id}
                name={price_small ? `${name} (Stor)` : name}
                price={discount_price_large || price_large}
                size="large"
                variant="primary"
                label={price_small ? "Stor +" : "Bestill +"}
                className="w-full lg:w-32"
              />
            </div>
          )}

          {!price_small && !price_large && price && (
            <div className="flex w-full lg:w-auto items-center justify-between lg:flex-col lg:items-center gap-2 group/action">
              <Price amount={price} className="text-text-dark text-xl font-bold group-hover/action:text-primary transition-colors" />
              <AddToCartButton 
                itemId={id} 
                name={name} 
                price={price} 
                className="w-32"
                label="Bestill +"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

}
