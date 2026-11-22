import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from 'src/components/Toast';
import * as apiService from 'src/api/services';
import {
  Incomes,
  IncomesPost,
  ProcessedIncomes,
  ProcessedIncomesPayload,
} from 'src/types';

export function useListIncomes() {
  return useQuery({
    queryKey: ['incomes'],
    queryFn: () =>
      apiService.listIncomes({ page: 0, pageSize: 100 }).then((res) => res.data),
  });
}

export function useTotalIncomes() {
  return useQuery({
    queryKey: ['incomes-total'],
    queryFn: () => apiService.listTotalIncomes().then((res) => res.data),
  });
}

export function useCreateIncomes() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (payload: IncomesPost) => apiService.createIncomes(payload),
    onSuccess: () => {
      showToast(t('notifications.incomes.created'), 'success');
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['incomes-total'] });
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['envelopes'] });
      }, 1000);
    },
  });
}

export function useUpdateIncomes() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (payload: Incomes) => apiService.updateIncomes(payload),
    onSuccess: () => {
      showToast(t('notifications.incomes.updated'), 'success');
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['incomes-total'] });
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['envelopes'] });
      }, 1000);
    },
  });
}

export function useDeleteIncomes() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiService.deleteIncomes(id),
    onSuccess: () => {
      showToast(t('notifications.incomes.deleted'), 'success');
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['incomes-total'] });
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
    },
  });
}

export function useProcessedIncomesMonth() {
  return useQuery({
    queryKey: ['processed-incomes', 'months'],
    queryFn: () => apiService.processedIncomesMonth().then((res) => res.data),
  });
}

export function useProcessedIncomes(year: number, month: number) {
  return useQuery({
    queryKey: ['processed-incomes', year, month],
    queryFn: () =>
      apiService
        .processedIncomes(year, month, { page: 0, pageSize: 100 })
        .then((res) => res.data),
  });
}

export function useTotalProcessedIncomes(year: number, month: number) {
  return useQuery({
    queryKey: ['processed-incomes-total', year, month],
    queryFn: () => apiService.getTotalProcessedIncomes(year, month).then((res) => res.data),
  });
}

export function useProcessAllIncomes() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: apiService.processAll,
    onSuccess: () => {
      showToast(t('notifications.processed_incomes.created'), 'success');
      queryClient.invalidateQueries({ queryKey: ['processed-incomes'] });
      queryClient.invalidateQueries({ queryKey: ['processed-incomes-total'] });
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-pending'] });
      queryClient.invalidateQueries({ queryKey: ['graph-analytics-current-envelopes'] });
      queryClient.invalidateQueries({ queryKey: ['graph-analytics-envelopes-month-overview'] });
      queryClient.invalidateQueries({ queryKey: ['graph-analytics-envelopes-by-year'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'errors.unexpected';
      showToast(t(msg), 'error');
    },
  });
}

export function useCreateProcessedIncomes() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (payload: ProcessedIncomesPayload) => apiService.processIncome(payload),
    onSuccess: () => {
      showToast(t('notifications.processed_incomes.created'), 'success');
      queryClient.invalidateQueries({ queryKey: ['processed-incomes'] });
      queryClient.invalidateQueries({ queryKey: ['processed-incomes-total'] });
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-pending'] });
      queryClient.invalidateQueries({ queryKey: ['graph-analytics-current-envelopes'] });
      queryClient.invalidateQueries({ queryKey: ['graph-analytics-envelopes-month-overview'] });
      queryClient.invalidateQueries({ queryKey: ['graph-analytics-envelopes-by-year'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'errors.unexpected';
      showToast(t(msg), 'error');
    },
  });
}

export function useUpdateProcessedIncomes() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (payload: ProcessedIncomes) => apiService.updateProcessedIncomes(payload),
    onSuccess: () => {
      showToast(t('notifications.processed_incomes.updated'), 'success');
      queryClient.invalidateQueries({ queryKey: ['processed-incomes'] });
      queryClient.invalidateQueries({ queryKey: ['processed-incomes-total'] });
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeleteProcessedIncomes() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiService.deleteProcessedIncome(id),
    onSuccess: () => {
      showToast(t('notifications.processed_incomes.deleted'), 'success');
      queryClient.invalidateQueries({ queryKey: ['processed-incomes'] });
      queryClient.invalidateQueries({ queryKey: ['processed-incomes-total'] });
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeleteProcessedIncomesByMonth() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      apiService.deleteProcessedIncomesByMonth(year, month),
    onSuccess: () => {
      showToast(t('notifications.processed_incomes.deleted_month'), 'success');
      queryClient.invalidateQueries({ queryKey: ['processed-incomes'] });
      queryClient.invalidateQueries({ queryKey: ['processed-incomes-total'] });
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-pending'] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
    onError: () => {
      showToast(t('notifications.processed_incomes.error_delete_month'), 'error');
    },
  });
}
