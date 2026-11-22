import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from 'src/components/Toast';
import * as apiService from 'src/api/services';
import {
  CreditCards,
  CreditCardsPost,
  FixedExpenses,
  FixedExpensesPost,
} from 'src/types';

export function useListFixedExpenses() {
  return useQuery({
    queryKey: ['fixed-expenses'],
    queryFn: () =>
      apiService.listFixedExpenses({ page: 0, pageSize: 100 }).then((res) => res.data),
  });
}

export function useCreateFixedExpenses() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (payload: FixedExpensesPost) => apiService.createFixedExpenses(payload),
    onSuccess: () => {
      showToast(t('notifications.fixed_expenses.created'), 'success');
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
    },
  });
}

export function useUpdateFixedExpenses() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (payload: FixedExpenses) => apiService.updateFixedExpenses(payload),
    onSuccess: () => {
      showToast(t('notifications.fixed_expenses.updated'), 'success');
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
    },
  });
}

export function useDeleteFixedExpenses() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiService.deleteFixedExpenses(id),
    onSuccess: () => {
      showToast(t('notifications.fixed_expenses.deleted'), 'success');
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
    },
  });
}

export function useListCreditCards() {
  return useQuery({
    queryKey: ['credit-cards'],
    queryFn: () =>
      apiService.listCreditCards({ page: 0, pageSize: 100 }).then((res) => res.data),
  });
}

export function useCreateCreditCards() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (payload: CreditCardsPost) => apiService.createCreditCards(payload),
    onSuccess: () => {
      showToast(t('notifications.credit_cards.created'), 'success');
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
    },
  });
}

export function useUpdateCreditCards() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (payload: CreditCards) => apiService.updateCreditCards(payload),
    onSuccess: () => {
      showToast(t('notifications.credit_cards.updated'), 'success');
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
    },
  });
}

export function useDeleteCreditCards() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiService.deleteCreditCards(id),
    onSuccess: () => {
      showToast(t('notifications.credit_cards.deleted'), 'success');
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
    },
  });
}
