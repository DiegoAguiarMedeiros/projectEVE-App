import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from 'src/components/Toast';
import * as apiService from 'src/api/services';

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => apiService.getUser().then((res) => res.data),
    retry: false,
    staleTime: 30000,
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
