import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from 'src/components/Toast';
import * as apiService from 'src/api/services';
import {
  GetAllParams,
  Transactions,
  TransactionsPost,
  TransactionsUpdateStatus,
} from 'src/types';

export function useListTransactionsByEnvelope(
  envelopeId: string,
  year: number,
  month: number,
  params?: GetAllParams
) {
  return useQuery({
    queryKey: ['transactions', envelopeId, year, month, params],
    queryFn: () =>
      apiService
        .listTransactionsByEnvelope(envelopeId, year, month, {
          page: 0,
          pageSize: 100,
          orderBy: 'date',
          order: 'desc',
          ...params,
        })
        .then((res) => res.data),
    enabled: !!envelopeId,
  });
}

export function useGetUpcomingPendingPayments(year: number, month: number) {
  return useQuery({
    queryKey: ['upcoming-pending', year, month],
    queryFn: () =>
      apiService
        .getUpcomingPendingPayments({
          page: 0,
          pageSize: 100,
          orderBy: 'date',
          order: 'asc',
          year,
          month,
        })
        .then((res) => res.data),
  });
}

export function useCreateTransactions() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (payload: TransactionsPost) => apiService.createTransactions(payload),
    onSuccess: () => {
      showToast(t('notifications.transactions.created'), 'success');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-pending'] });
      queryClient.invalidateQueries({ queryKey: ['graph-analytics-current-envelopes'] });
      queryClient.invalidateQueries({ queryKey: ['graph-analytics-envelopes-month-overview'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      showToast(
        msg === 'transaction.errors.exceeds_envelope_budget'
          ? t('errors.transactions.exceeds_budget')
          : t(msg || 'errors.unexpected'),
        'error'
      );
    },
  });
}

export function useUpdateTransactions() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (payload: Transactions) => apiService.updateTransactions(payload),
    onSuccess: () => {
      showToast(t('notifications.transactions.updated'), 'success');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-pending'] });
      queryClient.invalidateQueries({ queryKey: ['graph-analytics-current-envelopes'] });
      queryClient.invalidateQueries({ queryKey: ['graph-analytics-envelopes-month-overview'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      showToast(
        msg === 'transaction.errors.exceeds_envelope_budget'
          ? t('errors.transactions.exceeds_budget')
          : t(msg || 'errors.unexpected'),
        'error'
      );
    },
  });
}

export function useUpdateStatusTransactions() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (payload: TransactionsUpdateStatus) =>
      apiService.updateStatusTransactions(payload),
    onSuccess: () => {
      showToast(t('notifications.transactions.updated'), 'success');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-pending'] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['graph-analytics-current-envelopes'] });
      queryClient.invalidateQueries({ queryKey: ['graph-analytics-envelopes-month-overview'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'errors.unexpected';
      showToast(t(msg), 'error');
    },
  });
}

export function useDeleteTransactions() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiService.deleteTransactions(id),
    onSuccess: () => {
      showToast(t('notifications.transactions.deleted'), 'success');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-pending'] });
      queryClient.invalidateQueries({ queryKey: ['graph-analytics-current-envelopes'] });
      queryClient.invalidateQueries({ queryKey: ['graph-analytics-envelopes-month-overview'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'errors.unexpected';
      showToast(t(msg), 'error');
    },
  });
}
