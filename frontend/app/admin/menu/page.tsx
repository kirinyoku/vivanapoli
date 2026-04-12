'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { Category, MenuCategory, MenuItem } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CategoryModal from '@/components/admin/CategoryModal';
import MenuItemModal from '@/components/admin/MenuItemModal';

export default function MenuManagementPage() {
  const { handleApiError } = useAdminAuth();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<number | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [initialCategoryId, setInitialCategoryId] = useState<
    number | undefined
  >();

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMenu();
      setCategories(data);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Category handlers
  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: MenuCategory) => {
    setSelectedCategory({
      id: category.id,
      name: category.name,
      slug: category.slug,
      sort_order: 0,
      created_at: '',
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (data: Partial<Category>) => {
    try {
      setError(null);
      if (selectedCategory) {
        await api.updateCategory(selectedCategory.id, data);
        setSuccess('Kategorien ble oppdatert!');
      } else {
        await api.createCategory(data);
        setSuccess('Kategorien ble opprettet!');
      }
      setTimeout(() => setSuccess(null), 3000);
      fetchMenu();
      setIsCategoryModalOpen(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Feil ved lagring';
      setError(errorMessage);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      setError(null);
      setDeleting(true);
      await api.deleteCategory(id);
      setSuccess('Kategorien ble slettet!');
      setTimeout(() => setSuccess(null), 3000);
      fetchMenu();
      setDeleteConfirmation(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Feil ved sletting';
      setError(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  // Item handlers
  const handleAddItem = (categoryId?: number) => {
    setSelectedItem(null);
    setInitialCategoryId(categoryId);
    setIsItemModalOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setSelectedItem(item);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (data: Partial<MenuItem>) => {
    try {
      setError(null);
      if (selectedItem) {
        await api.updateItem(selectedItem.id, data);
        setSuccess('Produktet ble oppdatert!');
      } else {
        await api.createItem(data);
        setSuccess('Produktet ble opprettet!');
      }
      setTimeout(() => setSuccess(null), 3000);
      fetchMenu();
      setIsItemModalOpen(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Feil ved lagring';
      setError(errorMessage);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      setError(null);
      setDeleting(true);
      await api.deleteItem(id);
      setSuccess('Produktet ble slettet!');
      setTimeout(() => setSuccess(null), 3000);
      fetchMenu();
      setDeleteConfirmation(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Feil ved sletting';
      setError(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  if (loading && categories.length === 0)
    return <div className="p-8 text-center">Laster meny...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  const categoryList: Category[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    sort_order: 0,
    created_at: '',
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Menystyring</h1>
        <div className="space-x-2">
          <Button variant="primary" size="sm" onClick={handleAddCategory}>
            + Ny kategori
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleAddItem()}>
            + Nytt produkt
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-900">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-900">{success}</p>
        </div>
      )}

      <div className="space-y-8">
        {categories.map((category) => (
          <div
            key={category.id}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow"
          >
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-800">
                {category.name}
              </h2>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600"
                  onClick={() => handleEditCategory(category)}
                >
                  Rediger
                </Button>
                {deleteConfirmation === category.id ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      disabled={deleting}
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      {deleting ? 'Sletter...' : 'Bekreft'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600"
                      disabled={deleting}
                      onClick={() => setDeleteConfirmation(null)}
                    >
                      Avbryt
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => setDeleteConfirmation(category.id)}
                  >
                    Slett
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary"
                  onClick={() => handleAddItem(category.id)}
                >
                  + Legg til produkt
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Navn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Pris (L/S)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Allergener
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Handlinger
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {category.items.map((item) => (
                    <tr
                      key={item.id}
                      className={
                        item.is_available ? '' : 'bg-gray-50 opacity-60'
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="max-w-xs truncate text-xs text-gray-500">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        {item.price_large && (
                          <span>L: {item.price_large},- </span>
                        )}
                        {item.price_small && (
                          <span>S: {item.price_small},-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs whitespace-nowrap text-gray-500 uppercase">
                        {item.allergens.join(', ') || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={item.is_available ? 'success' : 'outline'}
                        >
                          {item.is_available ? 'Tilgjengelig' : 'Utsolgt'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                        <button
                          className="mr-4 cursor-pointer text-red-600 transition-colors duration-200 hover:text-red-900 hover:underline"
                          onClick={() => handleEditItem(item)}
                        >
                          Rediger
                        </button>
                        {deleteConfirmation === item.id ? (
                          <>
                            <button
                              className="mr-2 cursor-pointer text-red-600 disabled:opacity-50"
                              disabled={deleting}
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              {deleting ? 'Sletter...' : 'Bekreft'}
                            </button>
                            <button
                              className="cursor-pointer text-gray-500 hover:text-gray-700"
                              disabled={deleting}
                              onClick={() => setDeleteConfirmation(null)}
                            >
                              Avbryt
                            </button>
                          </>
                        ) : (
                          <button
                            className="cursor-pointer text-gray-600 transition-colors duration-200 hover:text-gray-900 hover:underline"
                            onClick={() => setDeleteConfirmation(item.id)}
                          >
                            Slett
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {category.items.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-center text-sm text-gray-500 italic"
                      >
                        Ingen produkter i denne kategorien
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        category={selectedCategory}
      />

      <MenuItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        item={selectedItem}
        categories={categoryList}
        initialCategoryId={initialCategoryId}
      />
    </div>
  );
}
