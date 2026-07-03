import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { ImageUploadIcon } from '@hugeicons/core-free-icons'
import { authQueryKey } from '../../libs/react-query'
import { updateCurrentUserAvatar } from '../../libs/user-api'
import type { AuthUser } from '../../utils/route-utils'

type ProfileAvatarUploaderProps = {
  user: AuthUser
  cacheQueryKey?: readonly unknown[]
}

const maxAvatarSizeBytes = 3 * 1024 * 1024

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Could not read image file.'))
    reader.readAsDataURL(file)
  })
}

export default function ProfileAvatarUploader({ user, cacheQueryKey = authQueryKey }: ProfileAvatarUploaderProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? null)
  const [pendingAvatarImage, setPendingAvatarImage] = useState<string | null>(null)
  const initial = (user.name || user.username || 'U').trim().charAt(0).toUpperCase()
  const avatarMutation = useMutation({
    mutationFn: updateCurrentUserAvatar,
    onSuccess: (updatedUser) => {
      setAvatarUrl(updatedUser.avatarUrl ?? null)
      setPendingAvatarImage(null)
      queryClient.setQueryData(cacheQueryKey, updatedUser)
      queryClient.setQueryData(authQueryKey, updatedUser)
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
      toast.success(t('profile.avatar.saved'))
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('profile.avatar.failed'))
    },
  })

  return (
    <div className="grid items-center gap-5 rounded-4xl border border-(--border) bg-(--surface) p-5 sm:p-6 md:grid-cols-[auto_minmax(0,1fr)] xl:grid-cols-[auto_minmax(0,1fr)_auto]">
      <div className="relative size-28 overflow-hidden rounded-squircle border border-(--accent-border) bg-(--surface-2) sm:size-32">
        {pendingAvatarImage || avatarUrl ? (
          <img src={pendingAvatarImage ?? avatarUrl ?? ''} alt={user.name} className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-3xl font-semibold text-(--text-h)">
            {initial}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-(--text-h)">{user.name}</h2>
        <p className="mt-1 wrap-break-word text-sm text-(--text)">{user.email}</p>
        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-(--accent)">@{user.username}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0]
          event.target.value = ''

          if (!file) return
          if (!file.type.startsWith('image/')) {
            toast.error(t('profile.avatar.invalidType'))
            return
          }
          if (file.size > maxAvatarSizeBytes) {
            toast.error(t('profile.avatar.tooLarge'))
            return
          }

          try {
            const avatarImage = await readFileAsDataUrl(file)
            setPendingAvatarImage(avatarImage)
          } catch (error) {
            toast.error(error instanceof Error ? error.message : t('profile.avatar.failed'))
          }
        }}
      />
      <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-1 xl:justify-end">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={avatarMutation.isPending}
          className="inline-flex items-center gap-2 rounded-squircle border border-(--border) px-4 py-3 text-sm font-semibold text-(--text-h) transition hover:border-(--accent-border) disabled:cursor-not-allowed disabled:opacity-60"
        >
          <HugeiconsIcon icon={ImageUploadIcon} size={17} />
          {t('profile.avatar.update', 'Update image')}
        </button>
        {pendingAvatarImage ? (
          <button
            type="button"
            onClick={() => avatarMutation.mutate({ avatarImage: pendingAvatarImage })}
            disabled={avatarMutation.isPending}
            className="inline-flex items-center gap-2 rounded-squircle bg-(--gd-primary) px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {avatarMutation.isPending ? (
              <>
                {t('profile.avatar.uploading')}
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              </>
            ) : (
              t('profile.avatar.save')
            )}
          </button>
        ) : null}
      </div>
    </div>
  )
}
