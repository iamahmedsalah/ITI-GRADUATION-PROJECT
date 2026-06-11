import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Mail01Icon, MailReply01Icon } from '@hugeicons/core-free-icons'
import { useLanguage } from '../../context/LanguageContext'
import { createPageVariants } from '../../libs/motionVariants'
import {
  fetchAdminContactMessages,
  replyToAdminContactMessage,
  type AdminContactMessageRow,
} from '../../libs/admin-api'
import { AdminFilterToggleButton } from '../../components/ui/AdminActionButtons'
import AdminPagination from '../../components/ui/AdminPagination'
import CustomDropdown from '../../components/ui/CustomDropdown'

function statusBadgeClass(status: AdminContactMessageRow['status']) {
  if (status === 'replied') {
    return 'border-[rgba(29,185,84,0.25)] bg-[rgba(29,185,84,0.12)] text-(--success)'
  }

  if (status === 'read') {
    return 'border-[rgba(245,155,35,0.28)] bg-[rgba(245,155,35,0.12)] text-(--warning)'
  }

  return 'border-[rgba(226,33,52,0.25)] bg-[rgba(226,33,52,0.12)] text-(--error)'
}

function formatDate(value: string | undefined, locale: string) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function AdminContactMessagesPage() {
  const { direction, language } = useLanguage()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const pageVariants = createPageVariants(direction)
  const locale = language === 'ar' ? 'ar-EG' : 'en-US'
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})

  const queryKey = useMemo(
    () => ['admin', 'contact-messages', search, status, page],
    [search, status, page],
  )

  const statusOptions = [
    { value: '', label: t('adminUi.contactMessages.filters.allStatus') },
    { value: 'unread', label: t('adminUi.contactMessages.status.unread') },
    { value: 'read', label: t('adminUi.contactMessages.status.read') },
    { value: 'replied', label: t('adminUi.contactMessages.status.replied') },
  ]

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchAdminContactMessages({
        q: search || undefined,
        status: status || undefined,
        page,
        limit: 10,
      }),
    staleTime: 0,
  })

  const replyMutation = useMutation({
    mutationFn: ({ messageId, reply }: { messageId: string; reply: string }) =>
      replyToAdminContactMessage(messageId, reply),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      if (result.data?._id) {
        setReplyDrafts((previous) => ({ ...previous, [result.data!._id]: '' }))
        setExpandedId(null)
      }
      void queryClient.invalidateQueries({ queryKey: ['admin', 'contact-messages'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
    onError: () => {
      toast.error(t('adminUi.contactMessages.replyFailed'))
    },
  })

  const messages = data?.data ?? []

  const renderReplyBox = (message: AdminContactMessageRow) => {
    const draft = replyDrafts[message._id] ?? ''
    const disabled = replyMutation.isPending || draft.trim().length < 10

    return (
      <div className="grid gap-3 rounded-3xl border border-(--border) bg-(--surface-muted) p-4">
        <label className="grid gap-2 text-sm font-semibold text-(--text-h)">
          {t('adminUi.contactMessages.replyLabel')}
          <textarea
            value={draft}
            onChange={(event) =>
              setReplyDrafts((previous) => ({
                ...previous,
                [message._id]: event.target.value,
              }))
            }
            rows={4}
            placeholder={t('adminUi.contactMessages.replyPlaceholder')}
            className="min-h-28 rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h) outline-none transition focus:border-(--gd-primary)"
          />
        </label>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => setExpandedId(null)}
            className="rounded-squircle border  border-(--border) px-4 py-2 text-sm font-semibold text-(--text-h) transition hover:bg-(--surface-soft)"
          >
            {t('adminUi.common.close')}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => replyMutation.mutate({ messageId: message._id, reply: draft.trim() })}
            className="inline-flex cursor-pointer items-center gap-2 rounded-squircle bg-(--gd-primary) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover) disabled:cursor-not-allowed disabled:opacity-55"
          >
            <HugeiconsIcon icon={MailReply01Icon} size={16} />
            {replyMutation.isPending ? t('adminUi.contactMessages.sendingReply') : t('adminUi.contactMessages.sendReply')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.main className="px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-8" variants={pageVariants} initial="hidden" animate="show">
      <section className="grid gap-4 rounded-3xl border border-(--border) bg-(--surface) p-3 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:gap-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-(--text)">{t('adminUi.contactMessages.overline')}</p>
            <h1 className="mt-2 text-3xl font-semibold text-(--text-h)">{t('adminUi.contactMessages.title')}</h1>
            <p className="mt-2 text-sm leading-6 text-(--text)">{t('adminUi.contactMessages.subtitle')}</p>
          </div>
          <div className="rounded-squircle border border-(--border) px-4 py-2 text-sm text-(--text-h)">
            {isFetching
              ? t('adminUi.common.refreshing')
              : data
                ? t('adminUi.contactMessages.total', { count: data.pagination.total })
                : t('adminUi.common.noData')}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <AdminFilterToggleButton
            open={isFiltersOpen}
            onClick={() => setIsFiltersOpen((previous) => !previous)}
            showLabel={t('adminUi.common.showFilters')}
            hideLabel={t('adminUi.common.hideFilters')}
          />
        </div>

        {isFiltersOpen ? (
          <div className="grid gap-3 rounded-squircle border border-(--border) bg-(--surface-muted) p-4 md:grid-cols-2">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder={t('adminUi.contactMessages.searchPlaceholder')}
              className="rounded-squircle border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text-h) outline-none transition focus:border-(--accent-border)"
            />
            <CustomDropdown
              value={status}
              options={statusOptions}
              onChange={(value) => {
                setStatus(value)
                setPage(1)
              }}
              buttonClassName="bg-(--surface-muted)! px-4! py-3!"
            />
          </div>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-(--border)">
          <div className="grid gap-3 p-2 sm:p-3 md:hidden">
            {isLoading ? (
              <div className="rounded-squircle border border-(--border) bg-(--surface-muted) p-4 text-sm text-(--text)">
                {t('adminUi.contactMessages.loading')}
              </div>
            ) : messages.length ? messages.map((message) => (
              <article key={message._id} className="grid gap-4 rounded-3xl border border-(--border) bg-(--surface-muted) p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-squircle bg-(--accent-bg) text-(--gd-primary)">
                    <HugeiconsIcon icon={Mail01Icon} size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="wrap-break-word font-semibold text-(--text-h)">{message.name}</div>
                    <div className="wrap-break-word text-xs text-(--text)">{message.email}</div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(message.status)}`}>
                    {t(`adminUi.contactMessages.status.${message.status}`)}
                  </span>
                </div>
                <p className="text-sm leading-6 text-(--text-h)">{message.message}</p>
                <div className="text-xs text-(--text)">
                  {formatDate(message.createdAt, locale)}
                </div>
                {message.replies?.length ? (
                  <div className="rounded-squircle border border-(--border) bg-(--surface) p-3 text-xs text-(--text)">
                    {t('adminUi.contactMessages.repliesCount', { count: message.replies.length })}
                  </div>
                ) : null}
                {expandedId === message._id ? renderReplyBox(message) : (
                  <button
                    type="button"
                    onClick={() => setExpandedId(message._id)}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-squircle border border-(--border) px-4 py-2 text-sm font-semibold text-(--text-h) transition hover:bg-(--surface-soft)"
                  >
                    <HugeiconsIcon icon={MailReply01Icon} size={16} />
                    {t('adminUi.contactMessages.reply')}
                  </button>
                )}
              </article>
            )) : (
              <div className="rounded-squircle border border-(--border) bg-(--surface-muted) p-4 text-sm text-(--text)">
                {t('adminUi.contactMessages.empty')}
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead className="bg-(--surface-soft)">
                <tr className="text-left text-(--text)">
                  <th className="px-4 py-3 font-medium">{t('adminUi.contactMessages.table.sender')}</th>
                  <th className="px-4 py-3 font-medium">{t('adminUi.contactMessages.table.message')}</th>
                  <th className="px-4 py-3 font-medium">{t('adminUi.contactMessages.table.status')}</th>
                  <th className="px-4 py-3 font-medium">{t('adminUi.contactMessages.table.createdAt')}</th>
                  <th className="px-4 py-3 font-medium">{t('adminUi.contactMessages.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-(--text)" colSpan={5}>{t('adminUi.contactMessages.loading')}</td>
                  </tr>
                ) : messages.length ? messages.map((message) => (
                  <tr key={message._id} className="border-t border-(--border) align-top">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-(--text-h)">{message.name}</div>
                      <div className="text-xs text-(--text)">{message.email}</div>
                    </td>
                    <td className="max-w-md px-4 py-4">
                      <p className="line-clamp-3 leading-6 text-(--text-h)">{message.message}</p>
                      {message.replies?.length ? (
                        <p className="mt-2 text-xs text-(--text)">
                          {t('adminUi.contactMessages.repliesCount', { count: message.replies.length })}
                        </p>
                      ) : null}
                      {expandedId === message._id ? <div className="mt-3">{renderReplyBox(message)}</div> : null}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(message.status)}`}>
                        {t(`adminUi.contactMessages.status.${message.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-(--text)">{formatDate(message.createdAt, locale)}</td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => setExpandedId((current) => current === message._id ? null : message._id)}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-squircle border border-(--border) px-3 py-2 text-xs font-semibold text-(--text-h) transition hover:bg-(--surface-soft)"
                      >
                        <HugeiconsIcon icon={MailReply01Icon} size={14} />
                        {expandedId === message._id ? t('adminUi.common.close') : t('adminUi.contactMessages.reply')}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-4 py-6 text-(--text)" colSpan={5}>{t('adminUi.contactMessages.empty')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <AdminPagination
            pagination={data?.pagination}
            onPageChange={setPage}
            previousLabel={t('adminUi.common.previous')}
            nextLabel={t('adminUi.common.next')}
            summaryLabel={t('adminUi.common.pageSummary', {
              page: data?.pagination.page ?? 1,
              pages: data?.pagination.pages ?? 1,
              total: data?.pagination.total ?? 0,
            })}
          />
        </div>
      </section>
    </motion.main>
  )
}
