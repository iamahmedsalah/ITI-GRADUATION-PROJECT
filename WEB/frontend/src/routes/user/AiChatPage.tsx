import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AiChat02Icon,
  AiMagicIcon,
  Delete02Icon,
  MailSend01Icon,
  SentIcon,
  UserEdit01Icon,
} from '@hugeicons/core-free-icons'
import {
  createAiChatConversation,
  deleteAiChatConversation,
  fetchAiChatConversations,
  fetchAiChatMessages,
  fetchAiFeatureAccess,
  renameAiChatConversation,
  sendAiChatMessage,
  type AiChatConversation,
  type AiChatLink,
  type AiChatMessage,
} from '../../libs/ai-api'
import { authQueryKey, fetchCurrentUser } from '../../libs/react-query'
import { useLanguage } from '../../context/LanguageContext'
import ConfirmActionModal from '../../components/models/ConfirmActionModal'

function formatChatDate(value?: string) {
  if (!value) return ''

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return ''
  }
}

function ConversationList({
  conversations,
  activeId,
  isLoading,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: {
  conversations: AiChatConversation[]
  activeId: string
  isLoading: boolean
  onSelect: (conversationId: string) => void
  onNew: () => void
  onRename: (conversation: AiChatConversation) => void
  onDelete: (conversation: AiChatConversation) => void
}) {
  const { t } = useTranslation()

  return (
    <aside className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] rounded-xl border border-(--border) bg-(--surface) shadow-(--shadow)">
      <div className="border-b border-(--border) p-4">
        <button
          type="button"
          onClick={onNew}
          className="inline-flex w-full items-center justify-center gap-2 rounded-squircle bg-(--gd-primary) px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover)"
        >
          <HugeiconsIcon icon={AiChat02Icon} size={18} />
          {t('aiChat.newChat')}
        </button>
      </div>

      <div className="min-h-0 overflow-y-auto p-3">
        {isLoading ? (
          <p className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text)">
            {t('aiChat.loadingConversations')}
          </p>
        ) : conversations.length ? (
          <ul className="grid gap-2">
            {conversations.map((conversation) => {
              const isActive = conversation._id === activeId
              return (
                <li key={conversation._id}>
                  <div
                    className={[
                      'group grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-squircle border px-3 py-3 transition',
                      isActive
                        ? 'border-(--accent-border) bg-(--accent-bg)'
                        : 'border-(--border) bg-(--surface-2) hover:border-(--accent-border)',
                    ].join(' ')}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(conversation._id)}
                      className="min-w-0 text-start"
                    >
                      <span className="block truncate text-sm font-semibold text-(--text-h)">
                        {conversation.title || t('aiChat.untitled')}
                      </span>
                      <span className="mt-1 block truncate text-xs text-(--text)">
                        {formatChatDate(conversation.lastMessageAt)}
                      </span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onRename(conversation)}
                        className="grid size-8 place-items-center rounded-md text-(--text) transition hover:bg-(--surface-3) hover:text-(--text-h)"
                        aria-label={t('aiChat.rename')}
                      >
                        <HugeiconsIcon icon={UserEdit01Icon} size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(conversation)}
                        className="grid size-8 place-items-center rounded-md text-(--text) transition hover:bg-[rgba(226,33,52,0.12)] hover:text-(--error)"
                        aria-label={t('aiChat.delete')}
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={15} />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm leading-6 text-(--text)">
            {t('aiChat.emptyConversations')}
          </p>
        )}
      </div>
    </aside>
  )
}

function ChatLinkCard({ link, language }: { link: AiChatLink; language: string }) {
  const { t } = useTranslation()

  return (
    <Link
      to={`/${language}${link.path}`}
      className="grid gap-1 rounded-squircle border border-(--border) bg-(--surface) px-3 py-2 text-start transition hover:border-(--accent-border) hover:bg-(--surface-2)"
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--accent)">
        {t(`aiChat.links.${link.type}`)}
      </span>
      <span className="text-sm font-semibold text-(--text-h)">{link.title}</span>
      {link.description ? (
        <span className="line-clamp-2 text-xs leading-5 text-(--text)">{link.description}</span>
      ) : null}
      {[link.level, link.category].filter(Boolean).length ? (
        <span className="text-[11px] text-(--text)">{[link.level, link.category].filter(Boolean).join(' / ')}</span>
      ) : null}
    </Link>
  )
}

function getChatHref(href: string, language: string) {
  const normalized = href.trim()

  if (/^https?:\/\//i.test(normalized)) {
    return { href: normalized, external: true }
  }

  if (normalized.startsWith(`/${language}/`)) {
    return { href: normalized, external: false }
  }

  if (normalized.startsWith('/roadmaps/') || normalized.startsWith('/courses/')) {
    return { href: `/${language}${normalized}`, external: false }
  }

  return { href: normalized || '#', external: normalized.startsWith('/') === false }
}

function renderInlineMarkdown(text: string, language: string, keyPrefix: string) {
  const nodes: ReactNode[] = []
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  const renderTextRuns = (value: string, prefix: string) => {
    const parts: ReactNode[] = []
    const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`)/g
    let tokenLastIndex = 0
    let tokenMatch: RegExpExecArray | null

    while ((tokenMatch = tokenRegex.exec(value))) {
      if (tokenMatch.index > tokenLastIndex) {
        parts.push(value.slice(tokenLastIndex, tokenMatch.index))
      }

      const token = tokenMatch[0]
      if (token.startsWith('**')) {
        parts.push(
          <strong key={`${prefix}-strong-${tokenMatch.index}`} className="font-semibold text-(--text-h)">
            {token.slice(2, -2)}
          </strong>,
        )
      } else {
        parts.push(
          <code key={`${prefix}-code-${tokenMatch.index}`} className="rounded bg-(--surface-3) px-1.5 py-0.5 text-[0.92em] text-(--text-h)">
            {token.slice(1, -1)}
          </code>,
        )
      }
      tokenLastIndex = tokenMatch.index + token.length
    }

    if (tokenLastIndex < value.length) {
      parts.push(value.slice(tokenLastIndex))
    }

    return parts
  }

  while ((match = linkRegex.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push(...renderTextRuns(text.slice(lastIndex, match.index), `${keyPrefix}-text-${lastIndex}`))
    }

    const { href, external } = getChatHref(match[2], language)
    const label = renderTextRuns(match[1], `${keyPrefix}-link-label-${match.index}`)

    nodes.push(
      external ? (
        <a
          key={`${keyPrefix}-link-${match.index}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-(--accent) underline-offset-4 hover:underline"
        >
          {label}
        </a>
      ) : (
        <Link
          key={`${keyPrefix}-link-${match.index}`}
          to={href}
          className="font-semibold text-(--accent) underline-offset-4 hover:underline"
        >
          {label}
        </Link>
      ),
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(...renderTextRuns(text.slice(lastIndex), `${keyPrefix}-text-${lastIndex}`))
  }

  return nodes
}

function MessageContent({ content, language }: { content: string; language: string }) {
  const chunks = content.split(/```/g)

  return (
    <div className="grid gap-3">
      {chunks.map((chunk, chunkIndex) => {
        const isCode = chunkIndex % 2 === 1
        const key = `chunk-${chunkIndex}`

        if (isCode) {
          const lines = chunk.replace(/^\w+\n/, '').trim()
          return (
            <pre key={key} className="overflow-x-auto rounded-squircle border border-(--border) bg-(--surface-3) p-3 text-xs leading-6 text-(--text-h)">
              <code>{lines}</code>
            </pre>
          )
        }

        return chunk
          .split(/\n{2,}/)
          .map((paragraph, paragraphIndex) => {
            const trimmed = paragraph.trim()
            const paragraphKey = `${key}-p-${paragraphIndex}`
            if (!trimmed) return null

            const lines = trimmed.split('\n').map((line) => line.trim()).filter(Boolean)
            const isBulletList = lines.every((line) => /^[-*]\s+/.test(line))
            const isNumberedList = lines.every((line) => /^\d+[.)]\s+/.test(line))

            if (isBulletList) {
              return (
                <ul key={paragraphKey} className="grid list-disc gap-1 ps-5">
                  {lines.map((line, lineIndex) => (
                    <li key={`${paragraphKey}-li-${lineIndex}`}>
                      {renderInlineMarkdown(line.replace(/^[-*]\s+/, ''), language, `${paragraphKey}-li-${lineIndex}`)}
                    </li>
                  ))}
                </ul>
              )
            }

            if (isNumberedList) {
              return (
                <ol key={paragraphKey} className="grid list-decimal gap-1 ps-5">
                  {lines.map((line, lineIndex) => (
                    <li key={`${paragraphKey}-li-${lineIndex}`}>
                      {renderInlineMarkdown(line.replace(/^\d+[.)]\s+/, ''), language, `${paragraphKey}-li-${lineIndex}`)}
                    </li>
                  ))}
                </ol>
              )
            }

            return (
              <p key={paragraphKey} className="whitespace-pre-wrap wrap-break-word">
                {renderInlineMarkdown(trimmed, language, paragraphKey)}
              </p>
            )
          })
      })}
    </div>
  )
}

function MessageBubble({ message, language }: { message: AiChatMessage; language: string }) {
  const isUser = message.role === 'user'
  const links = !isUser ? message.links ?? [] : []

  return (
    <article className={['flex w-full', isUser ? 'justify-end' : 'justify-start'].join(' ')}>
      <div
        className={[
          'max-w-[min(760px,92%)] text-sm leading-7',
          isUser
            ? 'rounded-2xl bg-(--gd-primary) px-4 py-3 text-white shadow-sm'
            : 'text-(--text-h)',
        ].join(' ')}
      >
        <MessageContent content={message.content} language={language} />
        {links.length ? (
          <div className="mt-4 grid gap-2">
            {links.map((link) => (
              <ChatLinkCard key={`${link.type}-${link.path}`} link={link} language={language} />
            ))}
          </div>
        ) : null}
        {!isUser && (message.provider || message.model) ? (
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-(--text)">
            {[message.provider, message.model].filter(Boolean).join(' / ')}
          </p>
        ) : null}
      </div>
    </article>
  )
}

function RenameChatModal({
  conversation,
  title,
  isPending,
  onTitleChange,
  onCancel,
  onSave,
}: {
  conversation: AiChatConversation | null
  title: string
  isPending: boolean
  onTitleChange: (value: string) => void
  onCancel: () => void
  onSave: () => void
}) {
  const { t } = useTranslation()
  const trimmedTitle = title.trim()
  const isInvalid = trimmedTitle.length < 1 || trimmedTitle.length > 30

  if (!conversation) return null

  return (
    <div className="fixed inset-0 z-120 grid place-items-center bg-black/70 px-4 py-8">
      <form
        className="w-full max-w-md rounded-xl border border-(--border) bg-(--surface) p-5 shadow-[0_24px_80px_rgba(0,0,0,0.4)]"
        onSubmit={(event) => {
          event.preventDefault()
          if (!isInvalid && !isPending) onSave()
        }}
      >
        <h2 className="text-xl font-semibold text-(--text-h)">{t('aiChat.renameModalTitle')}</h2>
        <p className="mt-2 text-sm leading-6 text-(--text)">{t('aiChat.renameModalText')}</p>
        <label className="mt-5 grid gap-2 text-sm font-semibold text-(--text-h)">
          {t('aiChat.renameLabel')}
          <input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            maxLength={30}
            autoFocus
            className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none transition focus:border-(--accent-border)"
          />
        </label>
        <p className={['mt-2 text-xs', isInvalid ? 'text-(--error)' : 'text-(--text)'].join(' ')}>
          {t('aiChat.renameHelper', { count: trimmedTitle.length })}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-squircle border border-(--border) px-4 py-2 text-sm font-semibold text-(--text-h) transition hover:bg-(--surface-2)"
            onClick={onCancel}
          >
            {t('aiChat.cancel')}
          </button>
          <button
            type="submit"
            disabled={isInvalid || isPending}
            className="rounded-squircle bg-(--gd-primary) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? t('aiChat.savingRename') : t('aiChat.saveRename')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function AiChatPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [activeConversationId, setActiveConversationId] = useState('')
  const [draftMessage, setDraftMessage] = useState('')
  const [isMobileListOpen, setIsMobileListOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<AiChatConversation | null>(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<AiChatConversation | null>(null)

  const authQuery = useQuery({
    queryKey: authQueryKey,
    queryFn: fetchCurrentUser,
    staleTime: 0,
  })

  const accessQuery = useQuery({
    queryKey: ['ai', 'feature-access'],
    queryFn: fetchAiFeatureAccess,
    staleTime: 30_000,
    enabled: Boolean(authQuery.data),
  })

  const conversationsQuery = useQuery({
    queryKey: ['ai', 'chat', 'conversations'],
    queryFn: fetchAiChatConversations,
    enabled: Boolean(authQuery.data),
  })

  const conversations = useMemo(() => conversationsQuery.data ?? [], [conversationsQuery.data])

  const messagesQuery = useQuery({
    queryKey: ['ai', 'chat', 'messages', activeConversationId],
    queryFn: () => fetchAiChatMessages(activeConversationId),
    enabled: Boolean(authQuery.data && activeConversationId),
  })

  const messages = messagesQuery.data?.messages ?? []
  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === activeConversationId),
    [activeConversationId, conversations],
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, activeConversationId])

  const handleAccessError = (error: unknown, fallbackKey: string) => {
    const typedError = error as Error & { access?: unknown }
    if (typedError.access) {
      queryClient.setQueryData(['ai', 'feature-access'], typedError.access)
    }
    toast.error(error instanceof Error ? error.message : t(fallbackKey))
  }

  const createConversationMutation = useMutation({
    mutationFn: createAiChatConversation,
    onSuccess: async (payload) => {
      if (payload.conversation) {
        setActiveConversationId(payload.conversation._id)
      }
      if (payload.access) {
        queryClient.setQueryData(['ai', 'feature-access'], payload.access)
      }
      await queryClient.invalidateQueries({ queryKey: ['ai', 'chat'] })
    },
    onError: (error) => handleAccessError(error, 'aiChat.createFailed'),
  })

  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, message }: { conversationId: string; message: string }) =>
      sendAiChatMessage(conversationId, {
        message,
        context: { page: 'ai-chat' },
      }),
    onSuccess: async (payload) => {
      if (payload.access) {
        queryClient.setQueryData(['ai', 'feature-access'], payload.access)
      }
      await queryClient.invalidateQueries({ queryKey: ['ai', 'chat'] })
    },
    onError: (error) => handleAccessError(error, 'aiChat.sendFailed'),
  })

  const renameMutation = useMutation({
    mutationFn: ({ conversationId, title }: { conversationId: string; title: string }) =>
      renameAiChatConversation(conversationId, title),
    onSuccess: async () => {
      setRenameTarget(null)
      setRenameTitle('')
      toast.success(t('aiChat.renamed'))
      await queryClient.invalidateQueries({ queryKey: ['ai', 'chat', 'conversations'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('aiChat.renameFailed'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAiChatConversation,
    onSuccess: async (_payload, conversationId) => {
      setDeleteTarget(null)
      if (activeConversationId === conversationId) {
        setActiveConversationId('')
      }
      toast.success(t('aiChat.deleted'))
      await queryClient.invalidateQueries({ queryKey: ['ai', 'chat'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('aiChat.deleteFailed'))
    },
  })

  const isAuthenticated = Boolean(authQuery.data)
  const access = accessQuery.data
  const chatRemaining = access?.usage.chatRemaining ?? access?.usage.chatLimit ?? 0
  const chatLimit = access?.usage.chatLimit ?? access?.usage.freeChatLimit ?? 0
  const canUseChat = Boolean(isAuthenticated && (access?.capabilities.canUseChat ?? true))
  const isSending = createConversationMutation.isPending || sendMessageMutation.isPending

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = draftMessage.trim()
    if (!message || isSending) return

    if (!isAuthenticated) {
      toast.error(t('aiChat.loginRequired'))
      return
    }

    if (!canUseChat) {
      toast.error(t('aiChat.limitReached'))
      return
    }

    setDraftMessage('')

    if (!activeConversationId) {
      createConversationMutation.mutate({
        message,
        context: { page: 'ai-chat' },
      })
      return
    }

    sendMessageMutation.mutate({
      conversationId: activeConversationId,
      message,
    })
  }

  const handleRename = (conversation: AiChatConversation) => {
    setRenameTarget(conversation)
    setRenameTitle((conversation.title || '').slice(0, 30))
  }

  const handleDelete = (conversation: AiChatConversation) => {
    setDeleteTarget(conversation)
  }

  const sidebar = (
    <ConversationList
      conversations={conversations}
      activeId={activeConversationId}
      isLoading={conversationsQuery.isLoading}
      onSelect={(conversationId) => {
        setActiveConversationId(conversationId)
        setIsMobileListOpen(false)
      }}
      onNew={() => {
        setActiveConversationId('')
        setIsMobileListOpen(false)
      }}
      onRename={handleRename}
      onDelete={handleDelete}
    />
  )

  return (
    <main className="h-[calc(100vh-4rem)] min-h-170 overflow-hidden bg-(--bg) px-4 py-4 text-(--text-h) sm:px-6 lg:px-8">
      <div className="mx-auto grid h-full max-w-7xl gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="hidden min-h-0 lg:block">{sidebar}</div>

        <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-xl border border-(--border) bg-(--surface-2) shadow-(--shadow)">
          <header className="flex items-center justify-between gap-3 border-b border-(--border) bg-(--surface) px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-(--accent)">
                <HugeiconsIcon icon={AiMagicIcon} size={16} />
                {t('aiChat.overline')}
              </div>
              <p className="mt-1 truncate text-sm font-semibold text-(--text-h)">
                {activeConversation?.title || t('aiChat.newChat')}
              </p>
              <p className="text-xs text-(--text)">
                {isAuthenticated
                  ? t('aiChat.quota', { count: chatRemaining, limit: chatLimit })
                  : t('aiChat.guestQuota')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated && !canUseChat ? (
                <Link to={`/${language}/upgrade`} className="hidden text-sm font-semibold text-(--accent) sm:inline">
                  {t('aiChat.upgrade')}
                </Link>
              ) : null}
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-squircle border border-(--border) px-3 py-2 text-sm font-semibold text-(--text-h) lg:hidden"
                onClick={() => setIsMobileListOpen(true)}
              >
                <HugeiconsIcon icon={AiChat02Icon} size={17} />
                {t('aiChat.chats')}
              </button>
            </div>
          </header>

          <div className="min-h-0 overflow-y-auto px-4 py-6">
            <div className="mx-auto grid w-full max-w-3xl gap-6">
              {!isAuthenticated ? (
                <div className="mx-auto grid max-w-lg place-items-center gap-4 rounded-xl border border-(--border) bg-(--surface) p-6 text-center">
                  <HugeiconsIcon icon={AiChat02Icon} size={34} />
                  <h2 className="text-xl font-bold text-(--text-h)">{t('aiChat.loginTitle')}</h2>
                  <p className="text-sm leading-7 text-(--text)">{t('aiChat.loginText')}</p>
                  <Link
                    to={`/${language}/login`}
                    className="rounded-squircle bg-(--gd-primary) px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    {t('navbar.login')}
                  </Link>
                </div>
              ) : messagesQuery.isLoading && activeConversationId ? (
                <p className="rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text)">
                  {t('aiChat.loadingMessages')}
                </p>
              ) : messages.length ? (
                <>
                  {messages.map((message) => (
                    <MessageBubble key={message._id} message={message} language={language} />
                  ))}
                  {isSending ? (
                    <article className="flex justify-start">
                      <div className="rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text)">
                        {t('aiChat.thinking')}
                      </div>
                    </article>
                  ) : null}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="mx-auto grid max-w-2xl gap-4 text-center">
                  <div className="mx-auto grid size-14 place-items-center rounded-xl border border-(--border) bg-(--surface)">
                    <HugeiconsIcon icon={AiChat02Icon} size={28} />
                  </div>
                  <h2 className="text-2xl font-bold text-(--text-h)">{t('aiChat.emptyTitle')}</h2>
                  <p className="text-sm leading-7 text-(--text)">{t('aiChat.emptyText')}</p>
                </div>
              )}
            </div>
          </div>

          <form className="border-t border-(--border) bg-(--surface) p-4" onSubmit={handleSubmit}>
            <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <textarea
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                  maxLength={2000}
                  rows={2}
                  disabled={!isAuthenticated || !canUseChat || isSending}
                  placeholder={t('aiChat.placeholder')}
                  className="min-h-16 rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm leading-6 text-(--text-h) outline-none transition focus:border-(--accent-border) disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!draftMessage.trim() || !isAuthenticated || !canUseChat || isSending}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-squircle bg-(--gd-primary) px-5 py-3 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover) disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <HugeiconsIcon icon={isSending ? SentIcon : MailSend01Icon} size={18} />
                  {isSending ? t('aiChat.sending') : t('aiChat.send')}
                </button>
              </div>
              {isAuthenticated && !canUseChat ? (
                <p className="mx-auto mt-3 max-w-3xl text-sm text-(--error)">{t('aiChat.limitReached')}</p>
              ) : null}
            </form>
        </section>
      </div>

      {isMobileListOpen ? (
        <div className="fixed inset-0 z-60 grid bg-black/70 px-4 py-6 lg:hidden">
          <button
            type="button"
            aria-label={t('roadmapDetail.closePanel')}
            className="absolute inset-0"
            onClick={() => setIsMobileListOpen(false)}
          />
          <div className="relative z-10 min-h-0 w-full max-w-sm">{sidebar}</div>
        </div>
      ) : null}
      <RenameChatModal
        conversation={renameTarget}
        title={renameTitle}
        isPending={renameMutation.isPending}
        onTitleChange={setRenameTitle}
        onCancel={() => {
          setRenameTarget(null)
          setRenameTitle('')
        }}
        onSave={() => {
          if (!renameTarget) return
          const title = renameTitle.trim()
          if (!title || title === renameTarget.title) {
            setRenameTarget(null)
            setRenameTitle('')
            return
          }
          renameMutation.mutate({
            conversationId: renameTarget._id,
            title,
          })
        }}
      />
      <ConfirmActionModal
        open={Boolean(deleteTarget)}
        title={t('aiChat.deleteModalTitle')}
        message={t('aiChat.deleteModalText', { title: deleteTarget?.title || t('aiChat.untitled') })}
        confirmLabel={t('aiChat.delete')}
        cancelLabel={t('aiChat.cancel')}
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget._id)
        }}
      />
    </main>
  )
}
