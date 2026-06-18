import { useQuery } from '@tanstack/react-query'
import {
  fetchAdminContactMessages,
  fetchAdminCourseDetail,
  fetchAdminCourses,
  fetchAdminOverview,
  fetchAdminRoadmapDetail,
  fetchAdminRoadmaps,
  fetchAdminUserDetail,
  fetchAdminUsers,
} from '../../libs/admin-api'

type AdminUsersParams = Parameters<typeof fetchAdminUsers>[0]
type AdminRoadmapsParams = Parameters<typeof fetchAdminRoadmaps>[0]
type AdminCoursesParams = Parameters<typeof fetchAdminCourses>[0]
type AdminContactMessagesParams = Parameters<typeof fetchAdminContactMessages>[0]

export const adminOverviewQueryKey = ['admin', 'overview'] as const
export const adminUsersQueryKey = (params: AdminUsersParams) =>
  ['admin', 'users', params] as const
export const adminUserDetailQueryKey = (userId: string) =>
  ['admin', 'users', userId] as const
export const adminRoadmapsQueryKey = (params: AdminRoadmapsParams) =>
  ['admin', 'roadmaps', params] as const
export const adminRoadmapDetailQueryKey = (templateId: string) =>
  ['admin', 'roadmaps', templateId] as const
export const adminCoursesQueryKey = (params: AdminCoursesParams) =>
  ['admin', 'courses', params] as const
export const adminCourseDetailQueryKey = (courseId: string) =>
  ['admin', 'courses', courseId] as const
export const adminContactMessagesQueryKey = (params: AdminContactMessagesParams) =>
  ['admin', 'contact-messages', params] as const

export function useAdminOverview() {
  return useQuery({
    queryKey: adminOverviewQueryKey,
    queryFn: fetchAdminOverview,
  })
}

export function useAdminUsers(params: AdminUsersParams) {
  return useQuery({
    queryKey: adminUsersQueryKey(params),
    queryFn: () => fetchAdminUsers(params),
  })
}

export function useAdminUserDetail(userId: string) {
  return useQuery({
    queryKey: adminUserDetailQueryKey(userId),
    queryFn: () => fetchAdminUserDetail(userId),
    enabled: Boolean(userId),
  })
}

export function useAdminRoadmaps(params: AdminRoadmapsParams) {
  return useQuery({
    queryKey: adminRoadmapsQueryKey(params),
    queryFn: () => fetchAdminRoadmaps(params),
  })
}

export function useAdminRoadmapDetail(templateId: string) {
  return useQuery({
    queryKey: adminRoadmapDetailQueryKey(templateId),
    queryFn: () => fetchAdminRoadmapDetail(templateId),
    enabled: Boolean(templateId),
  })
}

export function useAdminCourses(params: AdminCoursesParams) {
  return useQuery({
    queryKey: adminCoursesQueryKey(params),
    queryFn: () => fetchAdminCourses(params),
  })
}

export function useAdminCourseDetail(courseId: string) {
  return useQuery({
    queryKey: adminCourseDetailQueryKey(courseId),
    queryFn: () => fetchAdminCourseDetail(courseId),
    enabled: Boolean(courseId),
  })
}

export function useAdminContactMessages(params: AdminContactMessagesParams) {
  return useQuery({
    queryKey: adminContactMessagesQueryKey(params),
    queryFn: () => fetchAdminContactMessages(params),
  })
}
