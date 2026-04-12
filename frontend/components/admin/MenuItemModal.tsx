'use client';

import { useState, useEffect } from 'react';
import { MenuItem, Category } from '@/types';
import Button from '@/components/ui/Button';

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<MenuItem>) => Promise<void>;
  item?: MenuItem | null;
  categories: Category[];
  initialCategoryId?: number;
}

export default function MenuItemModal({
  isOpen,
  onClose,
  onSave,
  item,
  categories,
  initialCategoryId,
}: MenuItemModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceSmall, setPriceSmall] = useState<string>('');
  const [priceLarge, setPriceLarge] = useState<string>('');
  const [discountPriceSmall, setDiscountPriceSmall] = useState<string>('');
  const [discountPriceLarge, setDiscountPriceLarge] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number>(0);
  const [allergens, setAllergens] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setDescription(item.description || '');
      setPriceSmall(item.price_small?.toString() || '');
      setPriceLarge(item.price_large?.toString() || '');
      setDiscountPriceSmall(item.discount_price_small?.toString() || '');
      setDiscountPriceLarge(item.discount_price_large?.toString() || '');
      setCategoryId(Number(item.category_id));
      setAllergens(item.allergens?.join(', ') || '');
      setIsAvailable(item.is_available ?? true);
      setSortOrder(Number(item.sort_order || 0));
    } else {
      setName('');
      setDescription('');
      setPriceSmall('');
      setPriceLarge('');
      setDiscountPriceSmall('');
      setDiscountPriceLarge('');
      const defaultCatId =
        initialCategoryId || (categories.length > 0 ? categories[0].id : 0);
      setCategoryId(Number(defaultCatId));
      setAllergens('');
      setIsAvailable(true);
      setSortOrder(0);
    }
  }, [item, isOpen, categories, initialCategoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const allergenList = allergens
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a !== '');

      const pSmall = priceSmall ? parseFloat(priceSmall) : null;
      const pLarge = priceLarge ? parseFloat(priceLarge) : null;
      const dSmall = discountPriceSmall ? parseFloat(discountPriceSmall) : null;
      const dLarge = discountPriceLarge ? parseFloat(discountPriceLarge) : null;

      // 1. Check for negative values
      if (
        (pSmall !== null && pSmall < 0) ||
        (pLarge !== null && pLarge < 0) ||
        (dSmall !== null && dSmall < 0) ||
        (dLarge !== null && dLarge < 0)
      ) {
        alert('Prisene kan ikke være negative');
        setLoading(false);
        return;
      }

      // 2. Check if discount is higher than price
      if (
        (pSmall !== null && dSmall !== null && dSmall > pSmall) ||
        (pLarge !== null && dLarge !== null && dLarge > pLarge)
      ) {
        alert('Tilbudsprisen kan ikke være høyere enn originalprisen');
        setLoading(false);
        return;
      }

      const payload: any = {
        name,
        description: description || null,
        price_small: pSmall,
        price_large: pLarge,
        discount_price_small: dSmall,
        discount_price_large: dLarge,
        category_id: parseInt(categoryId.toString()),
        allergens: allergenList,
        is_available: isAvailable,
        sort_order: parseInt(sortOrder.toString()),
      };

      if (!payload.category_id || payload.category_id === 0) {
        alert('Vennligst velg en kategori');
        setLoading(false);
        return;
      }

      await onSave(payload);
      onClose();
    } catch (err: any) {
      alert('Feil ved lagring: ' + (err.message || 'Ukjent feil'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black p-4">
      <div className="my-8 w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="border-b border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900">
            {item ? 'Rediger produkt' : 'Nytt produkt'}
          </h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block cursor-default text-sm font-medium text-gray-700">
                Navn
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full cursor-text rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none sm:text-sm"
                value={name || ''}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block cursor-default text-sm font-medium text-gray-700">
                Beskrivelse (ingredienser)
              </label>
              <textarea
                className="mt-1 block w-full cursor-text rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none sm:text-sm"
                rows={3}
                value={description || ''}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block cursor-default text-sm font-medium text-gray-700">
                Pris Liten
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="mt-1 block w-full cursor-text rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none sm:text-sm"
                value={priceSmall || ''}
                onChange={(e) => setPriceSmall(e.target.value)}
              />
            </div>

            <div>
              <label className="block cursor-default text-sm font-medium text-gray-700">
                Pris Stor (eller standard)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="mt-1 block w-full cursor-text rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none sm:text-sm"
                value={priceLarge || ''}
                onChange={(e) => setPriceLarge(e.target.value)}
              />
            </div>

            <div className="rounded-md border border-red-100 bg-red-50 p-3">
              <label className="block cursor-default text-sm font-bold tracking-tighter text-red-800 uppercase">
                Tilbudspris Liten
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Valgfritt"
                className="mt-1 block w-full cursor-text rounded-md border border-red-300 px-3 py-2 shadow-sm transition-all duration-200 hover:border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none sm:text-sm"
                value={discountPriceSmall || ''}
                onChange={(e) => setDiscountPriceSmall(e.target.value)}
              />
            </div>

            <div className="rounded-md border border-red-100 bg-red-50 p-3">
              <label className="block cursor-default text-sm font-bold tracking-tighter text-red-800 uppercase">
                Tilbudspris Stor
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Valgfritt"
                className="mt-1 block w-full cursor-text rounded-md border border-red-300 px-3 py-2 shadow-sm transition-all duration-200 hover:border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none sm:text-sm"
                value={discountPriceLarge || ''}
                onChange={(e) => setDiscountPriceLarge(e.target.value)}
              />
            </div>

            <div>
              <label className="block cursor-default text-sm font-medium text-gray-700">
                Kategori
              </label>
              <select
                className="mt-1 block w-full cursor-pointer rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none sm:text-sm"
                value={categoryId || 0}
                onChange={(e) => setCategoryId(parseInt(e.target.value) || 0)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block cursor-default text-sm font-medium text-gray-700">
                Sorteringsrekkefølge
              </label>
              <input
                type="number"
                className="mt-1 block w-full cursor-text rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none sm:text-sm"
                value={sortOrder ?? 0}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block cursor-default text-sm font-medium text-gray-700">
                Allergener (kommaseparert, f.eks. "M, G, E")
              </label>
              <input
                type="text"
                placeholder="f.eks. M, G, E"
                className="mt-1 block w-full cursor-text rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none sm:text-sm"
                value={allergens || ''}
                onChange={(e) => setAllergens(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isAvailable"
                className="h-4 w-4 cursor-pointer rounded border-gray-300 text-red-600 transition-all duration-200 focus:ring-red-500"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
              />
              <label
                htmlFor="isAvailable"
                className="cursor-pointer text-sm font-medium text-gray-700"
              >
                Tilgjengelig (på lager)
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-3 border-t border-gray-200 p-6">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
            >
              Avbryt
            </button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Lagrer...' : 'Lagre'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
