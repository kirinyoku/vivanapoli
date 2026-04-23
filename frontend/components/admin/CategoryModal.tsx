'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/types';
import Button from '@/components/ui/Button';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Category>) => Promise<void>;
  category?: Category | null;
}

/**
 * Modal for creating / editing a category.
 *
 * Dual-purpose: when `category` is provided it pre-fills the form for editing,
 * otherwise empty fields are shown for creation. Slug auto-generation from the name
 * only runs during creation to avoid silently overwriting a slug that may already
 * be referenced externally (URLs, links).
 */
export default function CategoryModal({
  isOpen,
  onClose,
  onSave,
  category,
}: CategoryModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [loading, setLoading] = useState(false);

  /**
   * Reset form fields whenever the modal opens or the target category changes.
   * `isOpen` is included as a dependency so the form re-initializes every time
   * the modal is shown (important if the user closes & re-opens without saving).
   */
  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setSortOrder(category.sort_order);
    } else {
      setName('');
      setSlug('');
      setSortOrder(0);
    }
  }, [category, isOpen]);

  /**
   * Handles name input and auto-generates a URL-safe slug for new categories.
   *
   * Slug generation is intentionally skipped when editing — once a category is saved
   * its slug may be referenced externally (URLs, links), so mutating it silently
   * on every keystroke would be surprising. The regex strips all non-alphanumeric
   * characters except hyphens and underscores.
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!category) {
      setSlug(
        val
          .toLowerCase()
          .replace(/ /g, '-')
          .replace(/[^\w-]+/g, '')
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ name, slug, sort_order: sortOrder });
      onClose();
    } catch (err) {
      alert('Feil ved lagring av kategori');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Early return rather than conditional render around the JSX.
   * Keeps the component tree flatter and avoids nesting the entire
   * markup in a ternary inside the parent.
   */
  if (!isOpen) return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="border-b border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900">
            {category ? 'Rediger kategori' : 'Ny kategori'}
          </h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-6">
            <div>
              <label className="block cursor-default text-sm font-medium text-gray-700">
                Navn
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full cursor-text rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none sm:text-sm"
                value={name}
                onChange={handleNameChange}
              />
            </div>
            <div>
              <label className="block cursor-default text-sm font-medium text-gray-700">
                Slug (URL-vennlig navn)
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full cursor-text rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none sm:text-sm"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div>
              <label className="block cursor-default text-sm font-medium text-gray-700">
                Sorteringsrekkefølge
              </label>
              <input
                type="number"
                className="mt-1 block w-full cursor-text rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none sm:text-sm"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              />
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
