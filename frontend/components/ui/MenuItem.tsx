import Price from '@/components/ui/Price';
import Badge from '@/components/ui/Badge';
import AddToCartButton from '@/components/ui/AddToCartButton';

interface MenuItemProps {
  id: string;
  name: string;
  description: string;
  price: number;
  allergens?: string[];
  isHot?: boolean;
}

export default function MenuItem({
  id,
  name,
  description,
  price,
  allergens,
  isHot,
}: MenuItemProps) {
  return (
    <div className="group relative flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <h3 className="font-heading text-[1.4rem] font-semibold text-text-dark">
          {name}
        </h3>
        <div className="flex-grow border-b border-dotted border-gray-300 relative -top-1" />
        <Price amount={price} />
      </div>

      <p className="max-w-[85%] font-body text-[0.95rem] text-text-muted">
        {description}
      </p>

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
        <AddToCartButton itemId={id} />
      </div>
    </div>
  );
}
