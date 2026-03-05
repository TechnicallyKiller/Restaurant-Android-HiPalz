import { useState, useCallback, useEffect } from 'react';
import { getInstancedBills } from '../api/billApi';
import { handleApiError, getErrorMessage } from '../utils/errorHandling';
import type { InstancedBillItem } from '../api/types';

export function useInstancedBills(outletId: string) {
  const [instances, setInstances] = useState<InstancedBillItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInstances = useCallback(async () => {
    if (!outletId) {
      setInstances([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInstancedBills(outletId);
      setInstances(Array.isArray(data) ? data : []);
    } catch (err) {
      handleApiError(err);
      setError(getErrorMessage(err));
      setInstances([]);
    } finally {
      setIsLoading(false);
    }
  }, [outletId]);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  return { instances, isLoading, error, refetch: fetchInstances };
}
