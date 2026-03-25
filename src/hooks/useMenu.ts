import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCategories, getAreaItems } from '../api/menuApi';
import { useAuthStore } from '../store/authStore';
import { usePosStore } from '../store/posStore';
import { useDebounce } from './useDebounce';

export function useCategories() {
  const outletId = useAuthStore(s => s.user?.outletId ?? '');

  const query = useQuery({
    queryKey: ['categories', outletId],
    queryFn: () => getCategories(outletId),
    enabled: !!outletId,
  });

  return {
    categories: query.data ?? [],
    isLoadingCategories: query.isLoading,
    refetch: query.refetch,
  };
}

export function useMenuItems(areaId: string | undefined) {
  const outletId = useAuthStore(s => s.user?.outletId ?? '');
  const resolvedAreaId = areaId ?? '';

  const selectedCategoryId = usePosStore(s => s.selectedCategoryId);
  const itemSearchQuery = usePosStore(s => s.itemSearchQuery);
  const selectCategory = usePosStore(s => s.selectCategory);
  const setItemSearchQuery = usePosStore(s => s.setItemSearchQuery);

  const debouncedSearch = useDebounce(itemSearchQuery, 300);

  const query = useQuery({
    queryKey: ['menuItems', outletId, resolvedAreaId],
    queryFn: () => getAreaItems(outletId, resolvedAreaId),
    enabled: !!outletId && !!resolvedAreaId,
  });

  const items = query.data ?? [];

  // Auto-select first category when items load
  useEffect(() => {
    if (!selectedCategoryId && items.length > 0) {
      selectCategory(items[0].categoryId ?? null);
    }
  }, [items, selectedCategoryId, selectCategory]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (selectedCategoryId) {
      list = list.filter(item => item.categoryId === selectedCategoryId);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.trim().toLowerCase();
      list = list.filter(
        item =>
          item.name.toLowerCase().includes(q) ||
          (item.description ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [items, selectedCategoryId, debouncedSearch]);

  return {
    items,
    filteredItems,
    selectedCategoryId,
    itemSearchQuery,
    isLoadingItems: query.isLoading,
    selectCategory,
    setItemSearchQuery,
    refetch: query.refetch,
  };
}
