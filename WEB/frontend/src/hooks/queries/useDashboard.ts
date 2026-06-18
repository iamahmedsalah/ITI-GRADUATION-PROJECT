import { useQuery } from '@tanstack/react-query'
import { fetchDashboardSummary } from '../../libs/user-api'

export const dashboardSummaryQueryKey = ['dashboard', 'summary'] as const

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardSummaryQueryKey,
    queryFn: fetchDashboardSummary,
  })
}
