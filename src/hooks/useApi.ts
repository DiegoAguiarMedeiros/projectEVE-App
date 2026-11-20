import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from 'src/components/Toast';
import * as apiService from 'src/api/services';
import {
  CreditCards,
  CreditCardsPost,
  Debts,
  DebtsPost,
  Envelopes,
  FixedExpenses,
  FixedExpensesPost,
  GetAllParams,
  Goals,
  GoalsPost,
  Incomes,
  IncomesPost,
  LoginPayload,
  ProcessedIncomes,
  ProcessedIncomesPayload,
  RegisterPayload,
  Transactions,
  TransactionsPost,
  TransactionsUpdateStatus,
} from 'src/types';

// ─── User & Auth Hooks ────────────────────────────────────────────────────────

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => apiService.getUser().then((res) => res.data),
    retry: false,
    staleTime: 30000,
  });
}

export function useLogin(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoginPayload) => apiService.login(payload),
    onSuccess: async () => {
      await queryClient.resetQueries({ queryKey: ['user'] });
      onSuccess?.();
    },
  });
}

export function useRegister(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => apiService.register(payload),
    onSuccess: () => onSuccess?.(),
  });
}

export function useLogout(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiService.logout(),
    onSuccess: () => {
      queryClient.clear();
      onSuccess?.();
    },
  });
}

export function useVerifyEmail(token: string | null) {
  return useQuery({
    queryKey: ['verify-email', token],
    queryFn: () => apiService.verifyEmail(token!).then((res) => res.data),
    enabled: !!token,
    retry: false,
  });
}

export function useForgotPassword(onSuccess?: () => void) {
  return useMutation({
    mutationFn: ({ email, locale }: { email: string; locale?: string }) =>
      apiService.forgotPassword(email, locale),
    onSuccess: () => onSuccess?.(),
  });
}

export function useResetPassword(onSuccess?: () => void) {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      apiService.resetPassword(token, newPassword),
    onSuccess: () => onSuccess?.(),
  });
}

export function useUpdateUser(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string }) => apiService.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      onSuccess?.();
    },
  });
}

export function useChangePassword(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      apiService.changePassword(payload),
    onSuccess: () => onSuccess?.(),
  });
}

export function useCompleteRegistration(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: () => apiService.completeRegistration(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      onSuccess?.();
    },
    onError: () => {
      showToast(t('notifications.registration.error_complete'), 'error');
    },
  });
}

export function useDeleteAccount(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiService.deleteAccount(),
    onSuccess: () => {
      queryClient.clear();
      onSuccess?.();
    },
  });
}

// ─── Envelopes Hooks ──────────────────────────────────────────────────────────

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

// ─── Transactions Hooks ───────────────────────────────────────────────────────

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
  });
}

// ─── Incomes Hooks ────────────────────────────────────────────────────────────

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

// ─── Processed Incomes Hooks ──────────────────────────────────────────────────

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

// ─── Goals Hooks ──────────────────────────────────────────────────────────────

export function useListGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: () => apiService.listGoals({ page: 0, pageSize: 100 }).then((res) => res.data),
  });
}

export function useHasGoals(year: number, month: number) {
  const { data: envelopesWithAmount, isLoading: l1 } = useListEnvelopesWithAmount(year, month);
  const { data: baseEnvelopes, isLoading: l2 } = useListEnvelopes();
  const envelopes = envelopesWithAmount?.length ? envelopesWithAmount : baseEnvelopes;
  const goalsEnvelope = envelopes?.find((e) => e.name === 'goals');
  return {
    hasGoals: (goalsEnvelope?.percentage ?? 0) > 0,
    goalsEnvelope,
    isLoading: l1 || l2,
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
  });
}

// ─── Debts Hooks ──────────────────────────────────────────────────────────────

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
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['envelopes'] });
      }, 1000);
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
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['envelopes'] });
      }, 1000);
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
  });
}

// ─── Fixed Expenses Hooks ─────────────────────────────────────────────────────

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

// ─── Credit Cards Hooks ───────────────────────────────────────────────────────

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

// ─── Graph & Analytics Hooks ──────────────────────────────────────────────────

export function useListAnalyticsCurrentEnvelopes(year: number, month: number) {
  return useQuery({
    queryKey: ['graph-analytics-current-envelopes', year, month],
    queryFn: () =>
      apiService.listAnalyticsCurrentEnvelopes(year, month).then((res) => res.data),
  });
}

export function useListAnalyticsEnvelopesMonthOverview(year: number, month: number) {
  return useQuery({
    queryKey: ['graph-analytics-envelopes-month-overview', year, month],
    queryFn: () =>
      apiService.listAnalyticsEnvelopesMonthOverview(year, month).then((res) => res.data),
  });
}

export function useListAnalyticsEnvelopesByYear(year: number) {
  return useQuery({
    queryKey: ['graph-analytics-envelopes-by-year', year],
    queryFn: () => apiService.listAnalyticsEnvelopesByYear(year).then((res) => res.data),
  });
}
