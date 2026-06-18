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

const planKeys = ['free', 'pro'] as const

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
                {t('upgrade.overline')}
              </p>
              <h1 className="mt-3 text-4xl font-bold text-(--text-h)">
                {t('upgrade.title')}
              </h1>
              <p className="mt-3 text-sm leading-7 text-(--text)">
                {t('upgrade.subtitle')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/${language}/ai`}
                className="inline-flex w-fit items-center gap-2 rounded-squircle bg-(--gd-primary) px-5 py-3 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover)"
              >
                <HugeiconsIcon icon={AiMagicIcon} size={18} />
                {t('upgrade.openAi')}
              </Link>
              <Link
                to={`/${language}/ai/chat`}
                className="inline-flex w-fit items-center gap-2 rounded-squircle border border-(--accent-border) bg-(--surface-2) px-5 py-3 text-sm font-semibold text-(--text-h) transition hover:bg-(--surface-3)"
              >
                <HugeiconsIcon icon={AiChat02Icon} size={18} />
                {t('upgrade.openAiChat')}
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {planKeys.map((planKey) => {
            const highlighted = planKey === 'pro'
            const isCurrentPlan = (isPro && highlighted) || (!isPro && !highlighted)
            const features = t(`upgrade.plans.${planKey}.features`, { returnObjects: true }) as string[]

            return (
              <article
                key={planKey}
                className={[
                  'rounded-xl border bg-(--surface) p-6 shadow-(--shadow)',
                  highlighted ? 'border-(--accent-border)' : 'border-(--border)',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold text-(--text-h)">{t(`upgrade.plans.${planKey}.name`)}</p>
                    <p className="mt-2 text-sm text-(--accent)">{t(`upgrade.plans.${planKey}.quota`)}</p>
                  </div>
                  <span className="grid size-11 place-items-center rounded-squircle border border-(--border) bg-(--surface-2) text-(--accent)">
                    <HugeiconsIcon icon={highlighted ? CrownIcon : Route03Icon} size={21} />
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-(--text)">{t(`upgrade.plans.${planKey}.description`)}</p>
                <ul className="mt-5 grid gap-3">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-(--text-h)">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className="mt-1 shrink-0 text-(--accent)" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {isCurrentPlan ? (
                    <span className="rounded-squircle border border-(--accent-border) px-4 py-2 text-sm font-semibold text-(--accent)">
                      {t('upgrade.currentPlan')}
                    </span>
                  ) : user ? (
                    <span className="rounded-squircle border border-(--border) px-4 py-2 text-sm font-semibold text-(--text)">
                      {t('upgrade.adminManaged')}
                    </span>
                  ) : (
                    <Link
                      to={`/${language}/login`}
                      className="inline-flex items-center gap-2 rounded-squircle bg-(--gd-primary) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover)"
                    >
                      <HugeiconsIcon icon={CrownIcon} size={17} />
                      {t('upgrade.loginToUpgrade')}
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
              title: t('upgrade.freeSummaryTitle'),
              text: t('upgrade.freeSummaryText'),
            },
            {
              icon: CrownIcon,
              title: t('upgrade.proSummaryTitle'),
              text: t('upgrade.proSummaryText'),
            },
            {
              icon: AiChat02Icon,
              title: t('upgrade.futureSummaryTitle'),
              text: t('upgrade.futureSummaryText'),
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
