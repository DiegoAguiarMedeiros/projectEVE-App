import { useQuery } from '@tanstack/react-query';
import * as apiService from 'src/api/services';

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
