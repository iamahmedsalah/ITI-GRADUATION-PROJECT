import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useLanguage } from '../../context/LanguageContext'
import { createPageVariants } from '../../libs/motionVariants'
import {
  createAdminRoadmap,
  deleteAdminRoadmap,
  fetchAdminRoadmaps,
  toggleAdminRoadmapPublish,
  updateAdminRoadmap,
} from '../../libs/admin-api'

type RoleOption = 'student' | 'instructor' | 'admin' | 'jobSeeker' | 'careerSwitcher'
type LevelOption = 'beginner' | 'intermediate' | 'advanced'
type TemplateTypeOption = 'roleBased' | 'skillBased'

export default function AdminRoadmapsPage() {
  const { direction } = useLanguage()
  const { t } = useTranslation()
  const pageVariants = createPageVariants(direction)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [targetLevel, setTargetLevel] = useState('')
  const [templateType, setTemplateType] = useState('')
  const [isActive, setIsActive] = useState('')

  const [newTitle, setNewTitle] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newGoal, setNewGoal] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newTargetRole, setNewTargetRole] = useState<RoleOption>('student')
  const [newTargetLevel, setNewTargetLevel] = useState<LevelOption>('beginner')
  const [newTemplateType, setNewTemplateType] = useState<TemplateTypeOption>('roleBased')
  const [newMarkdown, setNewMarkdown] = useState('## Step One\nDescribe the first milestone.\n\n## Step Two\nDescribe the second milestone.')

  const queryKey = useMemo(
    () => ['admin', 'roadmaps', search, targetRole, targetLevel, templateType, isActive],
    [search, targetRole, targetLevel, templateType, isActive],
  )

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchAdminRoadmaps({
        q: search || undefined,
        targetRole: targetRole || undefined,
        targetLevel: targetLevel || undefined,
        templateType: templateType || undefined,
        isActive: isActive || undefined,
      }),
    staleTime: 0,
  })

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'roadmaps'] })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
  }

  const createMutation = useMutation({
    mutationFn: createAdminRoadmap,
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      setNewTitle('')
      setNewSlug('')
      setNewGoal('')
      setNewDescription('')
      setNewTemplateType('roleBased')
      setNewMarkdown('## Step One\nDescribe the first milestone.\n\n## Step Two\nDescribe the second milestone.')
      refresh()
    },
    onError: () => toast.error(t('adminUi.roadmaps.createFailed')),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      templateId,
      payload,
    }: {
      templateId: string
      payload: Partial<{
        title: string
        slug: string
        goal: string
        description: string
        targetRole: RoleOption
        targetLevel: LevelOption
        templateType: TemplateTypeOption
        isActive: boolean
      }>
    }) => updateAdminRoadmap(templateId, payload),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      refresh()
    },
    onError: () => toast.error(t('adminUi.roadmaps.updateFailed')),
  })

  const publishMutation = useMutation({
    mutationFn: ({ templateId, makeActive }: { templateId: string; makeActive: boolean }) =>
      toggleAdminRoadmapPublish(templateId, makeActive),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      refresh()
    },
    onError: () => toast.error(t('adminUi.roadmaps.publishFailed')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAdminRoadmap,
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      refresh()
    },
    onError: () => toast.error(t('adminUi.roadmaps.deleteFailed')),
  })

  return (
    <motion.main className="px-6 py-6 lg:px-8 lg:py-8" variants={pageVariants} initial="hidden" animate="show">
      <section className="grid gap-5 rounded-3xl border border-(--border) bg-(--surface) p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-(--text)">{t('adminUi.roadmaps.overline')}</p>
            <h1 className="mt-2 text-3xl font-semibold text-(--text-h)">{t('adminUi.roadmaps.title')}</h1>
            <p className="mt-2 text-sm leading-6 text-(--text)">{t('adminUi.roadmaps.subtitle')}</p>
          </div>
          <div className="rounded-squircle border border-(--border) px-4 py-2 text-sm text-(--text-h)">
            {isFetching ? t('adminUi.common.refreshing') : data ? t('adminUi.roadmaps.total', { count: data.pagination.total }) : t('adminUi.common.noData')}
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-(--border) bg-(--surface-muted) p-4 md:grid-cols-2">
          <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder={t('adminUi.roadmaps.form.title')} className="rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <input value={newSlug} onChange={(event) => setNewSlug(event.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder={t('adminUi.roadmaps.form.slug')} className="rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <input value={newGoal} onChange={(event) => setNewGoal(event.target.value)} placeholder={t('adminUi.roadmaps.form.goal')} className="rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h) outline-none md:col-span-2" />
          <textarea value={newDescription} onChange={(event) => setNewDescription(event.target.value)} placeholder={t('adminUi.roadmaps.form.description')} rows={2} className="rounded-2xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h) outline-none md:col-span-2" />
          <select value={newTargetRole} onChange={(event) => setNewTargetRole(event.target.value as RoleOption)} className="rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h) outline-none">
            <option value="student">{t('adminUi.roles.student')}</option>
            <option value="instructor">{t('adminUi.roles.instructor')}</option>
            <option value="admin">{t('adminUi.roles.admin')}</option>
            <option value="jobSeeker">{t('adminUi.roles.jobSeeker')}</option>
            <option value="careerSwitcher">{t('adminUi.roles.careerSwitcher')}</option>
          </select>
          <select value={newTargetLevel} onChange={(event) => setNewTargetLevel(event.target.value as LevelOption)} className="rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h) outline-none">
            <option value="beginner">{t('adminUi.levels.beginner')}</option>
            <option value="intermediate">{t('adminUi.levels.intermediate')}</option>
            <option value="advanced">{t('adminUi.levels.advanced')}</option>
          </select>
          <select value={newTemplateType} onChange={(event) => setNewTemplateType(event.target.value as TemplateTypeOption)} className="rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h) outline-none md:col-span-2">
            <option value="roleBased">{t('adminUi.roadmapTypes.roleBased')}</option>
            <option value="skillBased">{t('adminUi.roadmapTypes.skillBased')}</option>
          </select>
          <textarea value={newMarkdown} onChange={(event) => setNewMarkdown(event.target.value)} rows={5} className="rounded-2xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h) outline-none md:col-span-2" />
          <button
            type="button"
            disabled={createMutation.isPending}
            className="inline-flex cursor-pointer items-center justify-center rounded-full bg-(--gd-primary) px-5 py-3 text-sm font-semibold uppercase tracking-[0.04em] text-white shadow-[0_12px_24px_rgba(29,185,84,0.22)] transition-transform duration-200 hover:scale-[1.04] hover:bg-(--gd-primary-hover) disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
            onClick={() => {
              if (newTitle.trim().length < 3 || newSlug.trim().length < 3 || newGoal.trim().length < 10 || newMarkdown.trim().length < 4) {
                toast.error(t('adminUi.roadmaps.form.invalid'))
                return
              }

              createMutation.mutate({
                title: newTitle.trim(),
                slug: newSlug.trim(),
                goal: newGoal.trim(),
                description: newDescription.trim() || undefined,
                targetRole: newTargetRole,
                targetLevel: newTargetLevel,
                templateType: newTemplateType,
                contentFormat: 'markdown',
                contentMarkdown: newMarkdown.trim(),
              })
            }}
          >
            {createMutation.isPending ? t('adminUi.common.creating') : t('adminUi.roadmaps.form.create')}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('adminUi.roadmaps.searchPlaceholder')} className="rounded-squircle border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <select value={targetRole} onChange={(event) => setTargetRole(event.target.value)} className="rounded-squircle border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text-h) outline-none">
            <option value="">{t('adminUi.roadmaps.filters.allRoles')}</option>
            <option value="student">{t('adminUi.roles.student')}</option>
            <option value="instructor">{t('adminUi.roles.instructor')}</option>
            <option value="admin">{t('adminUi.roles.admin')}</option>
            <option value="careerSwitcher">{t('adminUi.roles.careerSwitcher')}</option>
            <option value="jobSeeker">{t('adminUi.roles.jobSeeker')}</option>
          </select>
          <select value={targetLevel} onChange={(event) => setTargetLevel(event.target.value)} className="rounded-squircle border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text-h) outline-none">
            <option value="">{t('adminUi.roadmaps.filters.allLevels')}</option>
            <option value="beginner">{t('adminUi.levels.beginner')}</option>
            <option value="intermediate">{t('adminUi.levels.intermediate')}</option>
            <option value="advanced">{t('adminUi.levels.advanced')}</option>
          </select>
          <select value={templateType} onChange={(event) => setTemplateType(event.target.value)} className="rounded-squircle border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text-h) outline-none">
            <option value="">{t('adminUi.roadmaps.filters.allTypes')}</option>
            <option value="roleBased">{t('adminUi.roadmapTypes.roleBased')}</option>
            <option value="skillBased">{t('adminUi.roadmapTypes.skillBased')}</option>
          </select>
          <select value={isActive} onChange={(event) => setIsActive(event.target.value)} className="rounded-squircle border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text-h) outline-none">
            <option value="">{t('adminUi.roadmaps.filters.allStatus')}</option>
            <option value="true">{t('adminUi.status.active')}</option>
            <option value="false">{t('adminUi.status.inactive')}</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-3xl border border-(--border)">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead className="bg-(--surface-soft)">
              <tr className="text-left text-(--text)">
                <th className="px-4 py-3 font-medium">{t('adminUi.roadmaps.table.template')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.roadmaps.table.type')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.roadmaps.table.target')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.roadmaps.table.status')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.roadmaps.table.assigned')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.roadmaps.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-4 py-6 text-(--text)" colSpan={6}>{t('adminUi.roadmaps.loading')}</td></tr>
              ) : data?.data.length ? data.data.map((roadmap) => (
                <tr key={roadmap._id} className="border-t border-(--border)">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-(--text-h)">{roadmap.title}</div>
                    <div className="text-xs text-(--text)">{roadmap.slug}</div>
                  </td>
                  <td className="px-4 py-4 text-(--text)">{t(`adminUi.roadmapTypes.${roadmap.templateType ?? 'roleBased'}`)}</td>
                  <td className="px-4 py-4 text-(--text)">{roadmap.targetRole || t('adminUi.common.any')} | {roadmap.targetLevel || t('adminUi.common.any')}</td>
                  <td className="px-4 py-4 text-(--text)">{roadmap.isActive ? t('adminUi.status.active') : t('adminUi.status.inactive')}</td>
                  <td className="px-4 py-4 text-(--text)">{roadmap.assignedUsers ?? 0}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="cursor-pointer rounded-full border border-(--border) px-3 py-2 text-xs font-semibold text-(--text-h) transition-transform duration-200 hover:scale-[1.04] hover:bg-(--surface-soft)"
                        disabled={publishMutation.isPending}
                        onClick={() => publishMutation.mutate({ templateId: roadmap._id, makeActive: !roadmap.isActive })}
                      >
                        {roadmap.isActive ? t('adminUi.roadmaps.actions.unpublish') : t('adminUi.roadmaps.actions.publish')}
                      </button>
                      <button
                        type="button"
                        className="cursor-pointer rounded-full border border-(--border) px-3 py-2 text-xs font-semibold text-(--text-h) transition-transform duration-200 hover:scale-[1.04] hover:bg-(--surface-soft)"
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          const nextTitle = window.prompt(t('adminUi.roadmaps.actions.renamePrompt'), roadmap.title)?.trim()
                          if (!nextTitle || nextTitle.length < 3) {
                            return
                          }

                          updateMutation.mutate({
                            templateId: roadmap._id,
                            payload: { title: nextTitle },
                          })
                        }}
                      >
                        {t('adminUi.roadmaps.actions.rename')}
                      </button>
                      <button
                        type="button"
                        className="cursor-pointer rounded-full border border-[rgba(226,33,52,0.4)] px-3 py-2 text-xs font-semibold text-[#ffb8c0] transition-transform duration-200 hover:scale-[1.04] hover:bg-[rgba(226,33,52,0.08)]"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          const confirmed = window.confirm(t('adminUi.roadmaps.actions.deleteConfirm', { title: roadmap.title }))
                          if (!confirmed) {
                            return
                          }
                          deleteMutation.mutate(roadmap._id)
                        }}
                      >
                        {t('adminUi.roadmaps.actions.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td className="px-4 py-6 text-(--text)" colSpan={6}>{t('adminUi.roadmaps.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </motion.main>
  )
}
