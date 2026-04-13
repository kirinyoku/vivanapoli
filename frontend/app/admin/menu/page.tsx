'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { Category, MenuCategory, MenuItem } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
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
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-text-dark text-4xl font-bold tracking-tight">
            Menystyring
          </h1>
          <p className="text-text-muted italic opacity-70">
            Administrer kategorier og produkter i menyen.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCategory}
            className="border-border-light/60 rounded-xl bg-white px-5 text-[10px] font-bold tracking-widest uppercase"
          >
            + Ny kategori
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleAddItem()}
            className="shadow-primary/20 rounded-xl px-5 text-[10px] font-bold tracking-widest uppercase shadow-lg"
          >
            + Nytt produkt
          </Button>
        </div>
      </div>

      {error && (
        <div className="animate-in fade-in slide-in-from-top-2 flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50 p-5 duration-300">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
            <span className="text-xl font-bold text-red-600">!</span>
          </div>
          <p className="text-sm font-bold tracking-wider text-red-900 uppercase">
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="animate-in fade-in slide-in-from-top-2 flex items-center gap-4 rounded-2xl border border-green-100 bg-green-50 p-5 duration-300">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xl font-bold text-green-600 shadow-sm">
            ✓
          </div>
          <p className="text-sm font-bold tracking-wider text-green-900 uppercase">
            {success}
          </p>
        </div>
      )}

      <div className="space-y-12">
        {categories.map((category) => (
          <div
            key={category.id}
            className="ring-border-light/60 overflow-hidden rounded-3xl bg-white shadow-xl ring-1 shadow-black/[0.02] transition-all hover:shadow-black/[0.04]"
          >
            <div className="border-border-light/40 bg-bg-page/30 flex flex-wrap items-center justify-between gap-4 border-b px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="font-heading text-primary flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl font-bold italic shadow-sm">
                  {category.name.charAt(0)}
                </div>
                <h2 className="text-text-dark text-xl font-bold tracking-tight">
                  {category.name}
                </h2>
                <span className="text-text-muted text-[10px] font-black tracking-[0.2em] uppercase opacity-40">
                  {category.items.length} produkter
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditCategory(category)}
                  className="text-text-muted hover:text-primary cursor-pointer p-2 transition-colors"
                  title="Rediger kategori"
                >
                  <span className="mr-2 text-[10px] font-black tracking-widest uppercase">
                    Rediger
                  </span>
                </button>

                {deleteConfirmation === category.id ? (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-1 ring-1 ring-red-100">
                    <span className="text-[10px] font-black tracking-tighter text-red-600 uppercase">
                      Slette?
                    </span>
                    <button
                      disabled={deleting}
                      onClick={() => handleDeleteCategory(category.id)}
                      className="cursor-pointer text-[10px] font-black text-red-700 uppercase hover:underline"
                    >
                      {deleting ? '...' : 'Ja'}
                    </button>
                    <button
                      disabled={deleting}
                      onClick={() => setDeleteConfirmation(null)}
                      className="cursor-pointer text-[10px] font-black text-gray-400 uppercase hover:underline"
                    >
                      Nei
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmation(category.id)}
                    className="text-text-muted cursor-pointer p-2 transition-colors hover:text-red-600"
                    title="Slett kategori"
                  >
                    <span className="text-[10px] font-black tracking-widest uppercase">
                      Slett
                    </span>
                  </button>
                )}

                <div className="bg-border-light mx-2 h-4 w-[1px]" />

                <Button
                  variant="primary"
                  size="sm"
                  className="h-8 rounded-xl px-4 text-[9px] font-bold tracking-widest uppercase"
                  onClick={() => handleAddItem(category.id)}
                >
                  + Legg til
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-border-light/40 bg-bg-page/10 border-b">
                    <th className="text-text-muted px-8 py-4 text-left text-[10px] font-black tracking-[0.2em] uppercase opacity-60">
                      Produkt
                    </th>
                    <th className="text-text-muted px-8 py-4 text-left text-[10px] font-black tracking-[0.2em] uppercase opacity-60">
                      Pris
                    </th>
                    <th className="text-text-muted px-8 py-4 text-left text-[10px] font-black tracking-[0.2em] uppercase opacity-60">
                      Allergener
                    </th>
                    <th className="text-text-muted px-8 py-4 text-left text-[10px] font-black tracking-[0.2em] uppercase opacity-60">
                      Status
                    </th>
                    <th className="text-text-muted px-8 py-4 text-right text-[10px] font-black tracking-[0.2em] uppercase opacity-60">
                      Handlinger
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border-light/30 divide-y">
                  {category.items.map((item) => (
                    <tr
                      key={item.id}
                      className={cn(
                        'group transition-colors',
                        item.is_available
                          ? 'hover:bg-bg-page/20'
                          : 'bg-bg-page/40 opacity-60'
                      )}
                    >
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-text-dark group-hover:text-primary text-sm font-bold transition-colors">
                            {item.name}
                          </span>
                          {item.description && (
                            <span className="text-text-muted line-clamp-1 max-w-xs text-[11px] italic opacity-70">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-wrap gap-3">
                          {item.price_small && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-text-muted text-[9px] font-black opacity-40">
                                S
                              </span>
                              <span className="text-text-dark text-xs font-bold">
                                {item.price_small},-
                              </span>
                            </div>
                          )}
                          {item.price_large && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-text-muted text-[9px] font-black opacity-40">
                                L
                              </span>
                              <span className="text-text-dark text-xs font-bold">
                                {item.price_large},-
                              </span>
                            </div>
                          )}
                          {!item.price_small &&
                            !item.price_large &&
                            item.price && (
                              <span className="text-text-dark text-xs font-bold">
                                {item.price},-
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-wrap gap-1">
                          {item.allergens.length > 0 ? (
                            item.allergens.map((a) => (
                              <span
                                key={a}
                                className="bg-bg-page text-text-muted ring-border-light/40 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-tighter uppercase ring-1"
                              >
                                {a}
                              </span>
                            ))
                          ) : (
                            <span className="text-text-muted text-xs opacity-30">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <Badge
                          variant={item.is_available ? 'success' : 'outline'}
                          className="px-2 py-0.5 text-[9px] font-black tracking-widest uppercase"
                        >
                          {item.is_available ? 'På lager' : 'Utsolgt'}
                        </Badge>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-4 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="text-text-muted hover:text-primary cursor-pointer text-[10px] font-black tracking-widest uppercase transition-colors"
                          >
                            Rediger
                          </button>

                          {deleteConfirmation === item.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                disabled={deleting}
                                onClick={() => handleDeleteItem(item.id)}
                                className="cursor-pointer text-[10px] font-black text-red-600 hover:underline"
                              >
                                Bekreft
                              </button>
                              <button
                                disabled={deleting}
                                onClick={() => setDeleteConfirmation(null)}
                                className="cursor-pointer text-[10px] font-black text-gray-400 hover:underline"
                              >
                                Av
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmation(item.id)}
                              className="text-text-muted cursor-pointer text-[10px] font-black tracking-widest uppercase transition-colors hover:text-red-600"
                            >
                              Slett
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {category.items.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-text-muted px-8 py-12 text-center text-sm italic opacity-40"
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
