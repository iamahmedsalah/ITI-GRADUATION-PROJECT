import { useMemo, useState, type ReactNode } from 'react'
import { useLoaderData, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { AiMagicIcon, UserSettings01Icon } from '@hugeicons/core-free-icons'
import { useLanguage } from '../../context/LanguageContext'
import {
  createHeroLineVariants,
  createPageVariants,
  createPreferenceStepVariants,
  createStaggerContainerVariants,
  preferenceProgressTransition,
  preferenceStepItemVariants,
} from '../../libs/motionVariants'
import type { PreferencesLoaderData } from '../../utils/route-utils'
import { authQueryKey } from '../../libs/react-query'
import {
  fetchCurrentUserPreferences,
  updateCurrentUserPreferences,
  type UserPreferences,
} from '../../libs/user-api'

type PreferenceFormState = {
  interests: string
  preferredLanguages: string
  learningGoals: string
  preferredCategories: string
  skillLevel: NonNullable<UserPreferences['skillLevel']>
  preferredDifficulty: NonNullable<UserPreferences['preferredDifficulty']>
  learningPace: NonNullable<UserPreferences['learningPace']>
  weeklyStudyHours: number
  reminderPreference: NonNullable<UserPreferences['reminderPreference']>
}

type ChoiceOption<TValue extends string> = {
  value: TValue
  label: string
  description?: string
}

const splitList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const joinList = (value?: string[]) => value?.join(', ') ?? ''

const inputClassName =
  'w-full rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none transition focus:border-(--accent-border) focus:bg-(--surface-3)'

function TagPreview({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (!items.length) {
    return <p className="text-sm text-(--text)">{emptyLabel}</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full border border-(--accent-border) bg-(--accent-bg) px-3 py-1 text-xs font-semibold text-(--accent)">
          {item}
        </span>
      ))}
    </div>
  )
}

function ChoiceGrid<TValue extends string>({
  options,
  value,
  onChange,
}: {
  options: ChoiceOption<TValue>[]
  value: TValue
  onChange: (value: TValue) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {options.map((option) => {
        const selected = value === option.value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-2xl border p-4 text-start transition ${
              selected
                ? 'border-(--accent-border) bg-(--accent-bg) text-(--text-h) shadow-[0_0_0_1px_rgba(29,185,84,0.2)]'
                : 'border-(--border) bg-(--surface-2) text-(--text) hover:border-(--accent-border) hover:text-(--text-h)'
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span className={`size-2 rounded-full ${selected ? 'bg-(--accent)' : 'bg-(--surface-3)'}`} />
              {option.label}
            </span>
            {option.description ? (
              <span className="mt-2 block text-xs leading-5 text-(--text)">{option.description}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

function ReviewRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-(--border) bg-(--surface-2) p-4">
      <p className="mb-3 text-xs font-semibold uppercase text-(--text)">{label}</p>
      {children}
    </div>
  )
}

function PreferencesForm({ initialPreferences }: { initialPreferences: UserPreferences | null }) {
  const { t } = useTranslation()
  const { language, direction } = useLanguage()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [slideDirection, setSlideDirection] = useState(1)
  const [fieldError, setFieldError] = useState('')
  const [form, setForm] = useState<PreferenceFormState>({
    interests: joinList(initialPreferences?.interests),
    preferredLanguages: joinList(initialPreferences?.preferredLanguages) || 'english',
    learningGoals: joinList(initialPreferences?.learningGoals),
    preferredCategories: joinList(initialPreferences?.preferredCategories),
    skillLevel: initialPreferences?.skillLevel ?? 'beginner',
    preferredDifficulty: initialPreferences?.preferredDifficulty ?? initialPreferences?.skillLevel ?? 'beginner',
    learningPace: initialPreferences?.learningPace ?? 'medium',
    weeklyStudyHours: initialPreferences?.weeklyStudyHours ?? 6,
    reminderPreference: initialPreferences?.reminderPreference ?? 'email',
  })

  const skillOptions: ChoiceOption<PreferenceFormState['skillLevel']>[] = [
    {
      value: 'beginner',
      label: t('adminUi.levels.beginner', 'Beginner'),
      description: t('preferences.level.beginnerHint', 'I need clear basics and guided first steps.'),
    },
    {
      value: 'intermediate',
      label: t('adminUi.levels.intermediate', 'Intermediate'),
      description: t('preferences.level.intermediateHint', 'I know the basics and want stronger projects.'),
    },
    {
      value: 'advanced',
      label: t('adminUi.levels.advanced', 'Advanced'),
      description: t('preferences.level.advancedHint', 'I want deeper material and fewer hand-holds.'),
    },
  ]
  const paceOptions: ChoiceOption<PreferenceFormState['learningPace']>[] = [
    {
      value: 'slow',
      label: t('preferences.pace.slow', 'Slow'),
      description: t('preferences.pace.slowHint', 'Small sessions, more review.'),
    },
    {
      value: 'medium',
      label: t('preferences.pace.medium', 'Medium'),
      description: t('preferences.pace.mediumHint', 'Balanced progress each week.'),
    },
    {
      value: 'fast',
      label: t('preferences.pace.fast', 'Fast'),
      description: t('preferences.pace.fastHint', 'Push me with a tighter path.'),
    },
  ]
  const reminderOptions: ChoiceOption<PreferenceFormState['reminderPreference']>[] = [
    {
      value: 'email',
      label: t('preferences.reminders.email', 'Email'),
      description: t('preferences.reminders.emailHint', 'Send reminders to my account email.'),
    },
    {
      value: 'push',
      label: t('preferences.reminders.push', 'Push'),
      description: t('preferences.reminders.pushHint', 'Use in-app reminders when available.'),
    },
    {
      value: 'none',
      label: t('preferences.reminders.none', 'None'),
      description: t('preferences.reminders.noneHint', 'Keep the plan quiet.'),
    },
  ]

  const saveMutation = useMutation({
    mutationFn: updateCurrentUserPreferences,
    onSuccess: async (result) => {
      if (result.user) {
        queryClient.setQueryData(authQueryKey, result.user)
      }
      await queryClient.invalidateQueries({ queryKey: authQueryKey })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(t('preferences.saved', 'Preferences saved.'))
      navigate(`/${language}/dashboard`, { replace: true })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('preferences.failed', 'Could not save preferences.'))
    },
  })

  const updateField = <TKey extends keyof PreferenceFormState>(field: TKey, value: PreferenceFormState[TKey]) => {
    setFieldError('')
    setForm((current) => ({ ...current, [field]: value }))
  }

  const stepError = (targetStep: number) => {
    if (targetStep === 0 && !splitList(form.interests).length) {
      return t('preferences.errors.interests', 'Add at least one interest.')
    }

    if (targetStep === 1 && !splitList(form.learningGoals).length) {
      return t('preferences.errors.goals', 'Add at least one learning goal.')
    }

    if (targetStep === 3 && (Number.isNaN(form.weeklyStudyHours) || form.weeklyStudyHours < 0 || form.weeklyStudyHours > 80)) {
      return t('preferences.errors.hours', 'Weekly study hours must be between 0 and 80.')
    }

    return ''
  }

  const validateStep = (targetStep: number) => {
    const error = stepError(targetStep)
    setFieldError(error)

    if (error) {
      toast.error(error)
      return false
    }

    return true
  }

  const submitPreferences = () => {
    const invalidStep = [0, 1, 2, 3, 4].find((targetStep) => Boolean(stepError(targetStep)))

    if (invalidStep !== undefined) {
      setStep(invalidStep)
      setSlideDirection(-1)
      validateStep(invalidStep)
      return
    }

    saveMutation.mutate({
      interests: splitList(form.interests),
      preferredLanguages: splitList(form.preferredLanguages),
      learningGoals: splitList(form.learningGoals),
      preferredCategories: splitList(form.preferredCategories),
      skillLevel: form.skillLevel,
      preferredDifficulty: form.preferredDifficulty,
      learningPace: form.learningPace,
      weeklyStudyHours: form.weeklyStudyHours,
      reminderPreference: form.reminderPreference,
    })
  }

  const steps = [
    {
      eyebrow: t('preferences.steps.interestsEyebrow', 'Step 1'),
      title: t('preferences.steps.interestsTitle', 'What do you want to learn?'),
      copy: t('preferences.steps.interestsCopy', 'Add the topics that should shape your roadmaps and course suggestions.'),
      content: (
        <div className="grid gap-5">
          <label className="grid gap-3 text-sm font-semibold text-(--text-h)">
            {t('preferences.fields.interests', 'Interests')}
            <input
              value={form.interests}
              onChange={(event) => updateField('interests', event.target.value)}
              placeholder={t('preferences.placeholders.interests', 'frontend, backend, ai')}
              className={inputClassName}
              autoFocus
            />
          </label>
          <TagPreview items={splitList(form.interests)} emptyLabel={t('preferences.preview.interests', 'Your interests will appear here.')} />
        </div>
      ),
    },
    {
      eyebrow: t('preferences.steps.goalsEyebrow', 'Step 2'),
      title: t('preferences.steps.goalsTitle', 'What is your main goal?'),
      copy: t('preferences.steps.goalsCopy', 'Tell ILMA what result you are aiming for, like a job, stronger projects, or interview preparation.'),
      content: (
        <div className="grid gap-5">
          <label className="grid gap-3 text-sm font-semibold text-(--text-h)">
            {t('preferences.fields.goals', 'Learning goals')}
            <input
              value={form.learningGoals}
              onChange={(event) => updateField('learningGoals', event.target.value)}
              placeholder={t('preferences.placeholders.goals', 'get a job, build projects')}
              className={inputClassName}
              autoFocus
            />
          </label>
          <TagPreview items={splitList(form.learningGoals)} emptyLabel={t('preferences.preview.goals', 'Your goals will appear here.')} />
        </div>
      ),
    },
    {
      eyebrow: t('preferences.steps.levelEyebrow', 'Step 3'),
      title: t('preferences.steps.levelTitle', 'How hard should the path feel?'),
      copy: t('preferences.steps.levelCopy', 'Choose your current level and the difficulty you prefer for new recommendations.'),
      content: (
        <div className="grid gap-6">
          <div className="grid gap-3">
            <p className="text-sm font-semibold text-(--text-h)">{t('preferences.fields.skillLevel', 'Current skill level')}</p>
            <ChoiceGrid options={skillOptions} value={form.skillLevel} onChange={(value) => updateField('skillLevel', value)} />
          </div>
          <div className="grid gap-3">
            <p className="text-sm font-semibold text-(--text-h)">{t('preferences.fields.difficulty', 'Preferred difficulty')}</p>
            <ChoiceGrid options={skillOptions} value={form.preferredDifficulty} onChange={(value) => updateField('preferredDifficulty', value)} />
          </div>
        </div>
      ),
    },
    {
      eyebrow: t('preferences.steps.paceEyebrow', 'Step 4'),
      title: t('preferences.steps.paceTitle', 'How fast do you want to move?'),
      copy: t('preferences.steps.paceCopy', 'Set a weekly rhythm so generated plans do not ask too much or too little from you.'),
      content: (
        <div className="grid gap-6">
          <div className="grid gap-3">
            <p className="text-sm font-semibold text-(--text-h)">{t('preferences.fields.pace', 'Learning pace')}</p>
            <ChoiceGrid options={paceOptions} value={form.learningPace} onChange={(value) => updateField('learningPace', value)} />
          </div>
          <label className="grid gap-3 text-sm font-semibold text-(--text-h)">
            {t('preferences.fields.hours', 'Weekly hours')}
            <input
              type="number"
              min={0}
              max={80}
              value={form.weeklyStudyHours}
              onChange={(event) => updateField('weeklyStudyHours', Number(event.target.value))}
              className={inputClassName}
            />
          </label>
        </div>
      ),
    },
    {
      eyebrow: t('preferences.steps.detailsEyebrow', 'Step 5'),
      title: t('preferences.steps.detailsTitle', 'Any final preferences?'),
      copy: t('preferences.steps.detailsCopy', 'Add language, category, and reminder preferences before reviewing your setup.'),
      content: (
        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-3 text-sm font-semibold text-(--text-h)">
              {t('preferences.fields.languages', 'Preferred languages')}
              <input
                value={form.preferredLanguages}
                onChange={(event) => updateField('preferredLanguages', event.target.value)}
                placeholder={t('preferences.placeholders.languages', 'english, arabic')}
                className={inputClassName}
              />
            </label>
            <label className="grid gap-3 text-sm font-semibold text-(--text-h)">
              {t('preferences.fields.categories', 'Preferred categories')}
              <input
                value={form.preferredCategories}
                onChange={(event) => updateField('preferredCategories', event.target.value)}
                placeholder={t('preferences.placeholders.categories', 'web, databases, cloud')}
                className={inputClassName}
              />
            </label>
          </div>
          <div className="grid gap-3">
            <p className="text-sm font-semibold text-(--text-h)">{t('preferences.fields.reminders', 'Reminders')}</p>
            <ChoiceGrid options={reminderOptions} value={form.reminderPreference} onChange={(value) => updateField('reminderPreference', value)} />
          </div>
        </div>
      ),
    },
    {
      eyebrow: t('preferences.steps.reviewEyebrow', 'Review'),
      title: t('preferences.steps.reviewTitle', 'Ready to tune your account?'),
      copy: t('preferences.steps.reviewCopy', 'Check the answers once, then update your recommendations.'),
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <ReviewRow label={t('preferences.fields.interests', 'Interests')}>
            <TagPreview items={splitList(form.interests)} emptyLabel={t('preferences.empty', 'Nothing added yet.')} />
          </ReviewRow>
          <ReviewRow label={t('preferences.fields.goals', 'Learning goals')}>
            <TagPreview items={splitList(form.learningGoals)} emptyLabel={t('preferences.empty', 'Nothing added yet.')} />
          </ReviewRow>
          <ReviewRow label={t('preferences.fields.skillLevel', 'Current skill level')}>
            <p className="text-sm font-semibold capitalize text-(--text-h)">{form.skillLevel}</p>
          </ReviewRow>
          <ReviewRow label={t('preferences.fields.difficulty', 'Preferred difficulty')}>
            <p className="text-sm font-semibold capitalize text-(--text-h)">{form.preferredDifficulty}</p>
          </ReviewRow>
          <ReviewRow label={t('preferences.fields.pace', 'Learning pace')}>
            <p className="text-sm font-semibold capitalize text-(--text-h)">
              {form.learningPace} · {form.weeklyStudyHours}h
            </p>
          </ReviewRow>
          <ReviewRow label={t('preferences.fields.reminders', 'Reminders')}>
            <p className="text-sm font-semibold capitalize text-(--text-h)">{form.reminderPreference}</p>
          </ReviewRow>
        </div>
      ),
    },
  ]

  const isLastStep = step === steps.length - 1
  const currentStep = steps[step]
  const progress = ((step + 1) / steps.length) * 100
  const preferenceStepVariants = useMemo(() => createPreferenceStepVariants(direction), [direction])

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault()

        if (isLastStep) {
          submitPreferences()
          return
        }

        if (validateStep(step)) {
          setSlideDirection(1)
          setStep((current) => Math.min(current + 1, steps.length - 1))
        }
      }}
    >
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-4 text-xs font-semibold text-(--text)">
          <span>
            {t('preferences.progress', {
              current: step + 1,
              total: steps.length,
              defaultValue: 'Question {{current}} of {{total}}',
            })}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-(--surface-2)">
          <motion.div
            className="h-full rounded-full bg-(--gd-primary)"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={preferenceProgressTransition}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-(--border) bg-(--surface-muted) p-4 sm:p-6">
        <AnimatePresence mode="wait" custom={slideDirection}>
          <motion.div
            key={step}
            custom={slideDirection}
            variants={preferenceStepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="grid min-h-[360px] content-start gap-6"
          >
            <motion.div variants={preferenceStepItemVariants}>
              <p className="text-xs font-semibold uppercase text-(--accent)">{currentStep.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-semibold text-(--text-h)">{currentStep.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-(--text)">{currentStep.copy}</p>
            </motion.div>

            <motion.div variants={preferenceStepItemVariants}>
              {currentStep.content}
            </motion.div>

            {fieldError ? (
              <motion.p variants={preferenceStepItemVariants} className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                {fieldError}
              </motion.p>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={step === 0 || saveMutation.isPending}
          onClick={() => {
            setFieldError('')
            setSlideDirection(-1)
            setStep((current) => Math.max(current - 1, 0))
          }}
          className="rounded-squircle border border-(--border) px-5 py-3 text-sm font-semibold text-(--text-h) transition hover:border-(--accent-border) disabled:cursor-not-allowed disabled:opacity-45"
        >
          {t('common.back', 'Back')}
        </button>

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="rounded-squircle bg-(--gd-primary) px-6 py-3 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover) disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveMutation.isPending
            ? t('profile.settings.saving', 'Saving...')
            : isLastStep
              ? t(initialPreferences ? 'preferences.update' : 'preferences.save', initialPreferences ? 'Update preferences' : 'Save preferences')
              : t('common.next', 'Next')}
        </button>
      </div>
    </form>
  )
}

export default function PreferencesPage() {
  const { direction } = useLanguage()
  const { t } = useTranslation()
  const { user } = useLoaderData() as PreferencesLoaderData
  const pageVariants = createPageVariants(direction)
  const heroLineVariants = createHeroLineVariants(direction)
  const staggerContainerVariants = createStaggerContainerVariants(direction)
  const preferencesQuery = useQuery({
    queryKey: ['auth', 'preferences'],
    queryFn: fetchCurrentUserPreferences,
  })
  const formKey = useMemo(
    () => preferencesQuery.data?._id ?? (preferencesQuery.isLoading ? 'loading' : 'new'),
    [preferencesQuery.data?._id, preferencesQuery.isLoading],
  )

  return (
    <motion.main className="px-4 py-8 sm:px-8" variants={pageVariants} initial="hidden" animate="show">
      <motion.section
        className="mx-auto grid max-w-4xl gap-6 rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] sm:p-7"
        variants={staggerContainerVariants}
      >
        <motion.div variants={heroLineVariants} className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-(--accent)">
              {t('preferences.overline', 'Learning setup')}
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-(--text-h)">
              {t('preferences.title', 'Tune your recommendations')}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-(--text)">
              {t('preferences.subtitle', {
                name: user.Fname ?? user.name,
                defaultValue: 'Answer a few quick questions so roadmaps, courses, and AI suggestions start in the right direction.',
              })}
            </p>
          </div>
          <span className="grid size-12 place-items-center rounded-squircle border border-(--border) bg-(--surface-2) text-(--accent)">
            <HugeiconsIcon icon={user.hasPreferences ? UserSettings01Icon : AiMagicIcon} size={22} />
          </span>
        </motion.div>

        {preferencesQuery.isLoading ? (
          <p className="rounded-2xl border border-(--border) bg-(--surface-2) p-5 text-sm text-(--text)">
            {t('dashboard.loading', 'Loading...')}
          </p>
        ) : (
          <PreferencesForm key={formKey} initialPreferences={preferencesQuery.data ?? null} />
        )}
      </motion.section>
    </motion.main>
  )
}
