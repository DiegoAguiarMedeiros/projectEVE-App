import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from 'src/components/Toast';
import * as apiService from 'src/api/services';
import { Debts, DebtsPost } from 'src/types';

export function useListDebts() {
  return useQuery({
    queryKey: ['debts'],
    queryFn: () => apiService.listDebts({ page: 0, pageSize: 100 }).then((res) => res.data),
  });
}

export function useHasDebts() {
  const { data, isLoading } = useListDebts();
  return {
    hasDebts: (data?.totalItems ?? 0) > 0,
    isLoading,
  };
}

export function useDebtSummary(month: number, year: number) {
  return useQuery({
    queryKey: ['debts-summary', month, year],
    queryFn: () => apiService.getDebtSummary(month, year).then((res) => res.data),
  });
}

export function useCreateDebts() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (payload: DebtsPost) => apiService.createDebts(payload),
    onSuccess: () => {
      showToast(t('notifications.debts.created'), 'success');
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debts-summary'] });
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'errors.unexpected';
      showToast(t(msg), 'error');
    },
  });
}

export function useUpdateDebts() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (payload: Debts) => apiService.updateDebts(payload),
    onSuccess: () => {
      showToast(t('notifications.debts.updated'), 'success');
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debts-summary'] });
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'errors.unexpected';
      showToast(t(msg), 'error');
    },
  });
}

export function useDeleteDebts() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiService.deleteDebts(id),
    onSuccess: () => {
      showToast(t('notifications.debts.deleted'), 'success');
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debts-summary'] });
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'errors.unexpected';
      showToast(t(msg), 'error');
    },
  });
}
