import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from 'src/components/Toast';
import * as apiService from 'src/api/services';
import { Envelopes } from 'src/types';

export function useListEnvelopes() {
  return useQuery({
    queryKey: ['envelopes'],
    queryFn: () => apiService.listEnvelopes().then((res) => res.data),
  });
}

export function useListEnvelopesWithAmount(year: number, month: number) {
  return useQuery({
    queryKey: ['envelopes', 'with-amount', year, month],
    queryFn: () => apiService.listWithAmount(year, month).then((res) => res.data),
  });
}

export function useUpdateEnvelopes() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (payload: Envelopes) => apiService.updateEnvelopes(payload),
    onSuccess: () => {
      showToast(t('notifications.envelopes.updated'), 'success');
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'notifications.envelopes.error_update';
      showToast(t(msg), 'error');
    },
  });
}

export function useTransferBalance() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: apiService.transferEnvelopeBalance,
    onSuccess: () => {
      showToast(t('notifications.envelopes.transfer_success'), 'success');
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
      queryClient.invalidateQueries({ queryKey: ['processed-incomes'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['graph-analytics-current-envelopes'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'notifications.envelopes.error_transfer';
      showToast(t(msg), 'error');
    },
  });
}
