import { useCallback, useEffect } from 'react';
import { getCategories, getAreaItems } from '../api/menuApi';
import { useAuthStore } from '../store/authStore';
import { useTableStore } from '../store/tableStore';
import { usePosStore } from '../store/posStore';
import { handleApiError } from '../utils/errorHandling';

export function useCategories() {
  const outletId = useAuthStore(s => s.user?.outletId ?? '');
  const {
    categories,
    isLoadingCategories,
    setCategories,
    setLoadingCategories,
  } = usePosStore();

  const fetchCategories = useCallback(async () => {
    if (!outletId) return;
    setLoadingCategories(true);
    try {
      const data = await getCategories(outletId);
      setCategories(data);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoadingCategories(false);
    }
  }, [outletId, setCategories, setLoadingCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, isLoadingCategories, refetch: fetchCategories };
}

export function useMenuItems() {
  const outletId = useAuthStore(s => s.user?.outletId ?? '');
  const currentTable = useTableStore(s => s.currentTable);
  const areaId = currentTable?.areaId ?? '';
  const {
    items,
    filteredItems,
    selectedCategoryId,
    itemSearchQuery,
    isLoadingItems,
    setItems,
    selectCategory,
    setItemSearchQuery,
    setLoadingItems,
  } = usePosStore();

  const fetchItems = useCallback(async () => {
    if (!outletId || !areaId) {
      setItems([]);
      return;
    }
    setLoadingItems(true);
    try {
      const data = await getAreaItems(outletId, areaId);
      setItems(data);
    } catch (err) {
      handleApiError(err);
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [outletId, areaId, setItems, setLoadingItems]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    filteredItems,
    selectedCategoryId,
    itemSearchQuery,
    isLoadingItems,
    selectCategory,
    setItemSearchQuery,
    refetch: fetchItems,
  };
}
