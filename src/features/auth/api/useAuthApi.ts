import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as apiService from 'src/api/services';
import { useIncomeStore } from 'src/store/useIncomeStore';
import { useSelectedMonthYearStore } from 'src/store/useSelectedMonthYearStore';
import { LoginPayload, RegisterPayload } from 'src/types';

export function useLogin(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoginPayload) => apiService.login(payload),
    onSuccess: async () => {
      queryClient.clear();
      useIncomeStore.getState().setIncome(0);
      useSelectedMonthYearStore.getState().reset();
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
    onSettled: () => {
      queryClient.setQueryData(['user'], null);
      queryClient.clear();
      useIncomeStore.getState().setIncome(0);
      useSelectedMonthYearStore.getState().reset();
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
