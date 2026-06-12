import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AiChat02Icon,
  AiMagicIcon,
  CheckmarkCircle02Icon,
  CrownIcon,
  Route03Icon,
} from '@hugeicons/core-free-icons'
import { useLanguage } from '../../context/LanguageContext'
import { authQueryKey, fetchCurrentUser } from '../../libs/react-query'

const plans = [
  {
    key: 'free',
    name: 'Free',
    quota: '3 AI roadmaps / month',
    description: 'Preview AI features, generate a few drafts, and keep learning with public roadmaps.',
    features: [
      '3 AI roadmap drafts every month',
      'AI recommendations on your dashboard',
      'Track public roadmap progress',
      'Preview the AI roadmap builder',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    quota: '10 AI roadmaps / month',
    description: 'For users who want to generate, save, and learn from AI-built roadmaps more deeply.',
    features: [
      '10 AI roadmap drafts every month',
      'Save AI roadmaps to your account',
      'Ask AI to explain roadmap topics',
      'Ready for future AI chatbot access',
    ],
  },
] as const

export default function UpgradePage() {
  const { t } = useTranslation()
  const { language, direction } = useLanguage()
  const authQuery = useQuery({
    queryKey: authQueryKey,
    queryFn: fetchCurrentUser,
    staleTime: 0,
  })
  const user = authQuery.data
  const isPro = user?.subscription?.plan === 'pro' && ['active', 'trialing'].includes(user.subscription.status ?? '')

  return (
    <main className="min-h-screen bg-(--bg) px-4 py-8 text-(--text-h) sm:px-6 lg:px-8" dir={direction}>
      <div className="mx-auto grid max-w-6xl gap-6">
        <section className="rounded-xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow)">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-(--accent)">
                <HugeiconsIcon icon={CrownIcon} size={18} />
                {t('upgrade.overline', 'Upgrade')}
              </p>
              <h1 className="mt-3 text-4xl font-bold text-(--text-h)">
                {t('upgrade.title', 'Choose the AI plan that fits your learning pace')}
              </h1>
              <p className="mt-3 text-sm leading-7 text-(--text)">
                {t(
                  'upgrade.subtitle',
                  'Free users can try AI roadmap generation. Pro users get higher quota, saving, and AI topic explanations.',
                )}
              </p>
            </div>
            <Link
              to={`/${language}/ai`}
              className="inline-flex w-fit items-center gap-2 rounded-squircle bg-(--gd-primary) px-5 py-3 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover)"
            >
              <HugeiconsIcon icon={AiMagicIcon} size={18} />
              {t('upgrade.openAi', 'Open AI builder')}
            </Link>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => {
            const highlighted = plan.key === 'pro'
            const isCurrentPlan = (isPro && highlighted) || (!isPro && !highlighted)

            return (
              <article
                key={plan.key}
                className={[
                  'rounded-xl border bg-(--surface) p-6 shadow-(--shadow)',
                  highlighted ? 'border-(--accent-border)' : 'border-(--border)',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold text-(--text-h)">{plan.name}</p>
                    <p className="mt-2 text-sm text-(--accent)">{plan.quota}</p>
                  </div>
                  <span className="grid size-11 place-items-center rounded-squircle border border-(--border) bg-(--surface-2) text-(--accent)">
                    <HugeiconsIcon icon={highlighted ? CrownIcon : Route03Icon} size={21} />
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-(--text)">{plan.description}</p>
                <ul className="mt-5 grid gap-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-(--text-h)">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className="mt-1 shrink-0 text-(--accent)" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {isCurrentPlan ? (
                    <span className="rounded-squircle border border-(--accent-border) px-4 py-2 text-sm font-semibold text-(--accent)">
                      {t('upgrade.currentPlan', 'Current plan')}
                    </span>
                  ) : user ? (
                    <span className="rounded-squircle border border-(--border) px-4 py-2 text-sm font-semibold text-(--text)">
                      {t('upgrade.adminManaged', 'Admin managed for now')}
                    </span>
                  ) : (
                    <Link
                      to={`/${language}/login`}
                      className="inline-flex items-center gap-2 rounded-squircle bg-(--gd-primary) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover)"
                    >
                      <HugeiconsIcon icon={CrownIcon} size={17} />
                      {t('upgrade.loginToUpgrade', 'Login to upgrade')}
                    </Link>
                  )}
                </div>
              </article>
            )
          })}
        </section>

        <section className="grid gap-4 rounded-xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow) md:grid-cols-3">
          {[
            {
              icon: Route03Icon,
              title: t('upgrade.freeSummaryTitle', 'Free'),
              text: t('upgrade.freeSummaryText', 'Good for trying AI roadmaps and getting dashboard recommendations.'),
            },
            {
              icon: CrownIcon,
              title: t('upgrade.proSummaryTitle', 'Pro'),
              text: t('upgrade.proSummaryText', 'Best for saving AI roadmaps and asking AI to explain topics.'),
            },
            {
              icon: AiChat02Icon,
              title: t('upgrade.futureSummaryTitle', 'Future'),
              text: t('upgrade.futureSummaryText', 'The same plan structure is ready for chatbot access later.'),
            },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-(--border) bg-(--surface-2) p-4">
              <HugeiconsIcon icon={item.icon} size={20} className="text-(--accent)" />
              <h2 className="mt-3 text-lg font-semibold text-(--text-h)">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-(--text)">{item.text}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
