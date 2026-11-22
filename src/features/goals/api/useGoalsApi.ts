import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from 'src/components/Toast';
import * as apiService from 'src/api/services';
import { Goals, GoalsPost } from 'src/types';
import {
  useListEnvelopes,
  useListEnvelopesWithAmount,
} from 'src/features/envelopes/api/useEnvelopesApi';
import { useTotalProcessedIncomes } from 'src/features/incomes/api/useIncomesApi';

export function useListGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: () => apiService.listGoals({ page: 0, pageSize: 100 }).then((res) => res.data),
  });
}

export function useHasGoals(_year?: number, _month?: number) {
  const { data: baseEnvelopes, isLoading } = useListEnvelopes();
  const goalsEnvelope = baseEnvelopes?.find((e) => e.name === 'goals');
  return {
    hasGoals: (goalsEnvelope?.percentage ?? 0) > 0,
    goalsEnvelope,
    isLoading,
  };
}

export function useGoalsCumulativeAmount(year: number, month: number) {
  return useQuery({
    queryKey: ['goals-cumulative', year, month],
    queryFn: () => apiService.getGoalsCumulativeAmount(year, month).then((res) => res.data),
  });
}

export function useEffectiveGoalsCumulative(year: number, month: number): number {
  const { data: cumulativeTotal = 0 } = useGoalsCumulativeAmount(year, month);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const { data: envelopes } = useListEnvelopesWithAmount(currentYear, currentMonth);
  const { data: processedIncome } = useTotalProcessedIncomes(currentYear, currentMonth);

  const goalsPercentage = envelopes?.find((e) => e.name === 'goals')?.percentage ?? 0;
  const monthlyIncome = processedIncome?.total ?? 0;
  const monthlyContribution = monthlyIncome * (goalsPercentage / 100);

  const offsetFromNow = (year - currentYear) * 12 + (month - currentMonth);
  if (offsetFromNow > 0) {
    return Number(cumulativeTotal) + offsetFromNow * monthlyContribution;
  }
  return Number(cumulativeTotal);
}

export function useCreateGoals() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (payload: GoalsPost) => apiService.createGoals(payload),
    onSuccess: () => {
      showToast(t('notifications.goals.created'), 'success');
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'errors.unexpected';
      showToast(t(msg), 'error');
    },
  });
}

export function useUpdateGoals() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (payload: Goals) => apiService.updateGoals(payload),
    onSuccess: () => {
      showToast(t('notifications.goals.updated'), 'success');
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'errors.unexpected';
      showToast(t(msg), 'error');
    },
  });
}

export function useDeleteGoals() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (id: string) => apiService.deleteGoals(id),
    onSuccess: () => {
      showToast(t('notifications.goals.deleted'), 'success');
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'errors.unexpected';
      showToast(t(msg), 'error');
    },
  });
}
