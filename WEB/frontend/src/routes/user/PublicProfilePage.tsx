import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  LockIcon,
  GithubIcon,
  GitlabIcon,
  Linkedin02Icon,
  Route03Icon,
  UserIcon,
  InternetIcon,
  FireIcon,
  Award01Icon,
  Award02Icon,
  MedalIcon,
  MedalFirstPlaceIcon,
  StarIcon,
} from '@hugeicons/core-free-icons'
import { fetchPublicProfile } from '../../libs/user-api'
import { useLanguage } from '../../context/LanguageContext'
import { createPageVariants } from '../../libs/motionVariants'

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { t } = useTranslation()
  const { direction, language } = useLanguage()
  const pageVariants = createPageVariants(direction)

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: () => fetchPublicProfile(username || ''),
    enabled: Boolean(username),
    retry: false,
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg) text-(--text-h)">
        <div className="grid place-items-center gap-4 text-center">
          <div className="size-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-(--text)">{t('profile.public.loading', 'Loading public profile...')}</p>
        </div>
      </div>
    )
  }

  // Handle errors (e.g. Private Profile or Not Found)
  if (error || !data) {
    const errorMsg = error instanceof Error ? error.message.toLowerCase() : ''
    const isPrivate = errorMsg.includes('private') || errorMsg.includes('forbidden')
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-(--bg) px-6 py-12 text-(--text-h)">
        <motion.div 
          className="w-full max-w-md rounded-4xl border border-(--border) bg-(--surface) p-6 text-center shadow-(--shadow)"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mx-auto flex size-14 items-center justify-center rounded-squircle bg-red-500/10 text-red-500 border border-red-500/20 mb-5">
            <HugeiconsIcon icon={LockIcon} size={28} />
          </div>
          <h1 className="text-2xl font-bold text-(--text-h)">
            {isPrivate ? t('profile.public.privateTitle', 'Private Profile') : t('profile.public.notFoundTitle', 'Profile Not Found')}
          </h1>
          <p className="mt-3 text-sm leading-6 text-(--text)">
            {isPrivate 
              ? t('profile.public.privateDesc', 'This user has set their profile to private. Only the account owner can view these details.')
              : t('profile.public.notFoundDesc', 'The profile you are looking for does not exist or has been deleted.')}
          </p>
          <Link 
            to={`/${language}/dashboard`}
            className="mt-6 inline-flex w-full items-center justify-center rounded-squircle bg-(--gd-primary) px-4 py-3 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover)"
          >
            {t('profile.public.goHome', 'Back to Dashboard')}
          </Link>
        </motion.div>
      </main>
    )
  }

  const { user, profile, preferences, stats } = data
  const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : null

  // Ensure streak data is present
  const streak = user.loginStreak || { current: 0, longest: 0 }

  // Define Badge list for Login Streak Achievements
  const badgesList = [
    {
      id: 'genesis',
      daysRequired: 1,
      title: t('profile.badges.genesisTitle', 'Genesis Badge'),
      description: t('profile.badges.genesisDesc', 'Unlocks on your 1st login streak day!'),
      icon: FireIcon,
      colorClass: 'text-emerald-400 bg-emerald-955/20 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
    },
    {
      id: 'week',
      daysRequired: 7,
      title: t('profile.badges.weekTitle', 'Consistent Explorer'),
      description: t('profile.badges.weekDesc', 'Maintained a login streak for 1 week (7 days).'),
      icon: StarIcon,
      colorClass: 'text-blue-400 bg-blue-955/20 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.25)]',
    },
    {
      id: 'month',
      daysRequired: 30,
      title: t('profile.badges.monthTitle', 'Dedicated Scholar'),
      description: t('profile.badges.monthDesc', 'Maintained a login streak for 1 month (30 days).'),
      icon: MedalIcon,
      colorClass: 'text-purple-400 bg-purple-955/20 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]',
    },
    {
      id: 'threeMonths',
      daysRequired: 90,
      title: t('profile.badges.threeMonthsTitle', 'Quarterly Master'),
      description: t('profile.badges.threeMonthsDesc', 'Maintained a login streak for 3 months (90 days).'),
      icon: Award01Icon,
      colorClass: 'text-pink-400 bg-pink-955/20 border-pink-500/40 shadow-[0_0_12px_rgba(236,72,153,0.25)]',
    },
    {
      id: 'sixMonths',
      daysRequired: 180,
      title: t('profile.badges.sixMonthsTitle', 'Semi-Annual Elite'),
      description: t('profile.badges.sixMonthsDesc', 'Maintained a login streak for 6 months (180 days).'),
      icon: MedalFirstPlaceIcon,
      colorClass: 'text-orange-400 bg-orange-955/20 border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.25)]',
    },
    {
      id: 'year',
      daysRequired: 365,
      title: t('profile.badges.yearTitle', 'Annual Legend'),
      description: t('profile.badges.yearDesc', 'Maintained a login streak for 1 year (365 days) and get 1 Month Free Pro!'),
      icon: Award02Icon,
      colorClass: 'text-amber-400 bg-amber-955/20 border-amber-500/50 shadow-[0_0_18px_rgba(245,158,11,0.45)] border-dashed border-amber-400/80 animate-pulse',
      hasSpecialPrize: true,
    },
  ]

  // Stagger animation variants for high premium look
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: 'spring', 
        stiffness: 100, 
        damping: 15 
      } as const
    },
  }

  return (
    <motion.main 
      className="px-4 py-8 sm:px-8 sm:py-12 bg-(--bg) text-(--text-h)"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div 
        className="mx-auto max-w-4xl grid gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* 1. Profile Card Header */}
        <motion.section 
          className="relative overflow-hidden rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow)"
          variants={itemVariants}
        >
          <div className="absolute right-0 top-0 -mr-12 -mt-12 size-40 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.name} 
                className="size-24 rounded-squircle object-cover border border-(--border) shadow-md animate-pulse-slow"
              />
            ) : (
              <div className="grid size-24 place-items-center rounded-squircle bg-(--surface-2) border border-(--border) text-(--accent) text-3xl font-bold shadow-md shadow-emerald-500/5">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-(--text-h) truncate">{user.name}</h1>
              <p className="text-sm text-(--accent) mt-1 font-mono">@{user.username}</p>
              
              {profile.headline && (
                <p className="mt-2 text-sm font-medium text-emerald-400">{profile.headline}</p>
              )}

              {/* Social Icons Row */}
              <div className="flex flex-wrap gap-2.5 mt-3 justify-center sm:justify-start">
                {profile.githubUrl && (
                  <a 
                    href={profile.githubUrl.startsWith('http') ? profile.githubUrl : `https://github.com/${profile.githubUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex size-9 items-center justify-center rounded-squircle border border-(--border) bg-(--surface-2) hover:bg-(--surface-3) text-(--text) hover:text-(--accent) transition hover:border-emerald-500/30 hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    title="GitHub"
                  >
                    <HugeiconsIcon icon={GithubIcon} size={16} />
                  </a>
                )}
                {profile.linkedInUrl && (
                  <a 
                    href={profile.linkedInUrl.startsWith('http') ? profile.linkedInUrl : `https://linkedin.com/in/${profile.linkedInUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex size-9 items-center justify-center rounded-squircle border border-(--border) bg-(--surface-2) hover:bg-(--surface-3) text-(--text) hover:text-(--accent) transition hover:border-emerald-500/30 hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    title="LinkedIn"
                  >
                    <HugeiconsIcon icon={Linkedin02Icon} size={16} />
                  </a>
                )}
                {profile.gitLabUrl && (
                  <a 
                    href={profile.gitLabUrl.startsWith('http') ? profile.gitLabUrl : `https://gitlab.com/${profile.gitLabUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex size-9 items-center justify-center rounded-squircle border border-(--border) bg-(--surface-2) hover:bg-(--surface-3) text-(--text) hover:text-(--accent) transition hover:border-emerald-500/30 hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    title="GitLab"
                  >
                    <HugeiconsIcon icon={GitlabIcon} size={16} />
                  </a>
                )}
              </div>

              {joinDate && (
                <p className="mt-3 text-xs text-(--text)">
                  {t('profile.public.joined', 'Joined')} {joinDate}
                </p>
              )}
            </div>
          </div>
        </motion.section>

        {/* 3. Bio / About Block */}
        {profile.bio && (
          <motion.section 
            className="rounded-4xl border border-(--border) bg-(--surface) p-5 sm:p-6 shadow-(--shadow)"
            variants={itemVariants}
          >
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-(--text) mb-4">
              {t('profile.public.about', 'About')}
            </h2>
            <p className="text-sm leading-7 text-(--text-h) whitespace-pre-line">{profile.bio}</p>
          </motion.section>
        )}

        {/* 4. Stats dashboard row */}
        <motion.section 
          className="rounded-4xl border border-(--border) bg-(--surface) p-5 sm:p-6 shadow-(--shadow)"
          variants={itemVariants}
        >
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-(--text) mb-4">
            {t('profile.public.stats', 'Stats')}
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            {/* Current Streak */}
            <div className="flex items-center gap-3 rounded-squircle border border-(--border) bg-(--surface-2) p-4 transition hover:border-(--accent-border) hover:shadow-[0_0_10px_rgba(249,115,22,0.1)]">
              <span className="grid size-10 place-items-center rounded-squircle bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <HugeiconsIcon icon={FireIcon} size={18} className="animate-pulse" />
              </span>
              <div>
                <p className="text-xs text-(--text)">{t('profile.public.currentStreak', 'Current Streak')}</p>
                <p className="text-sm font-semibold text-(--text-h) mt-0.5">
                  {streak.current} {streak.current === 1 ? t('profile.public.day', 'day') : t('profile.public.days', 'days')}
                </p>
              </div>
            </div>

            {/* Longest Streak */}
            <div className="flex items-center gap-3 rounded-squircle border border-(--border) bg-(--surface-2) p-4 transition hover:border-(--accent-border) hover:shadow-[0_0_10px_rgba(59,130,246,0.1)]">
              <span className="grid size-10 place-items-center rounded-squircle bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <HugeiconsIcon icon={Award01Icon} size={18} />
              </span>
              <div>
                <p className="text-xs text-(--text)">{t('profile.public.longestStreak', 'Longest Streak')}</p>
                <p className="text-sm font-semibold text-(--text-h) mt-0.5">
                  {streak.longest} {streak.longest === 1 ? t('profile.public.day', 'day') : t('profile.public.days', 'days')}
                </p>
              </div>
            </div>

            {/* Roadmaps Followed */}
            <div className="flex items-center gap-3 rounded-squircle border border-(--border) bg-(--surface-2) p-4 transition hover:border-(--accent-border)">
              <span className="grid size-10 place-items-center rounded-squircle bg-(--accent-bg) text-(--accent) border border-(--border)">
                <HugeiconsIcon icon={Route03Icon} size={18} />
              </span>
              <div>
                <p className="text-xs text-(--text)">{t('profile.public.roadmaps', 'Roadmaps Followed')}</p>
                <p className="text-sm font-semibold text-(--text-h) mt-0.5">{stats.roadmapsCount}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 5. Interests & Learning Goals Card */}
        {preferences && (preferences.interests?.length > 0 || preferences.learningGoals?.length > 0) && (
          <motion.section 
            className="rounded-4xl border border-(--border) bg-(--surface) p-5 sm:p-6 shadow-(--shadow) grid gap-5"
            variants={itemVariants}
          >
            {preferences.interests?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-(--text) mb-3">
                  {t('profile.public.interests', 'Interests')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {preferences.interests.map((interest: string) => (
                    <span 
                      key={interest} 
                      className="rounded-squircle border border-(--border) bg-(--surface-2) px-3 py-1.5 text-xs text-(--text-h) capitalize transition hover:border-(--accent-border) hover:bg-(--surface)"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {preferences.learningGoals?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-(--text) mb-3">
                  {t('profile.public.learningGoals', 'Learning Goals')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {preferences.learningGoals.map((goal: string) => (
                    <span 
                      key={goal} 
                      className="rounded-squircle border border-(--border) bg-(--surface-2) px-3 py-1.5 text-xs text-(--text-h) transition hover:border-(--accent-border) hover:bg-(--surface)"
                    >
                      {goal}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* 6. Details (Location, Website) */}
        {(profile.location || profile.websiteUrl) && (
          <motion.section 
            className="rounded-4xl border border-(--border) bg-(--surface) p-5 sm:p-6 shadow-(--shadow) grid gap-4"
            variants={itemVariants}
          >
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-(--text)">
              {t('profile.public.details', 'Details')}
            </h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {profile.location && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="grid size-8 place-items-center rounded-squircle bg-(--surface-2) text-(--text)">
                    <HugeiconsIcon icon={UserIcon} size={14} />
                  </span>
                  <div>
                    <p className="text-xs text-(--text)">{t('profile.public.location', 'Location')}</p>
                    <p className="text-sm font-semibold text-(--text-h) mt-0.5">{profile.location}</p>
                  </div>
                </div>
              )}

              {profile.websiteUrl && (
                <a 
                  href={profile.websiteUrl.startsWith('http') ? profile.websiteUrl : `https://${profile.websiteUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm hover:text-(--accent) transition"
                >
                  <span className="grid size-8 place-items-center rounded-squircle bg-(--surface-2) text-(--text) hover:text-(--accent)">
                    <HugeiconsIcon icon={InternetIcon} size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-(--text)">{t('profile.public.website', 'Website')}</p>
                    <p className="text-sm font-semibold truncate mt-0.5">{profile.websiteUrl}</p>
                  </div>
                </a>
              )}
            </div>
          </motion.section>
        )}

        {/* 7. Achievements & Streak Badges */}
        <motion.section 
          className="rounded-4xl border border-(--border) bg-(--surface) p-5 sm:p-6 shadow-(--shadow)"
          variants={itemVariants}
        >
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-(--text) mb-5">
            {t('profile.public.achievements', 'Achievements & Badges')}
          </h2>
          
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {badgesList.map((badge) => {
              const isUnlocked = streak.longest >= badge.daysRequired
              return (
                <div 
                  key={badge.id}
                  className={[
                    "flex items-start gap-4 rounded-squircle border p-4 transition-all duration-300",
                    isUnlocked 
                      ? `border-emerald-500/30 bg-(--surface-2) hover:scale-[1.02] ${badge.colorClass}`
                      : "border-(--border) bg-(--surface-2) opacity-30 select-none"
                  ].join(" ")}
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className={[
                      "grid size-12 place-items-center rounded-squircle border transition-all duration-300",
                      isUnlocked 
                        ? "bg-black/20 border-white/10" 
                        : "bg-(--surface-3) border-(--border) text-(--text)"
                    ].join(" ")}>
                      {isUnlocked ? (
                        <HugeiconsIcon icon={badge.icon} size={24} />
                      ) : (
                        <HugeiconsIcon icon={LockIcon} size={20} />
                      )}
                    </div>
                    <span className="text-[9px] font-mono mt-1 text-center opacity-85">
                      {badge.daysRequired} {badge.daysRequired === 1 ? t('profile.badges.day', 'Day') : t('profile.badges.days', 'Days')}
                    </span>
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold truncate text-(--text-h)">
                      {badge.title}
                    </h3>
                    <p className="text-[10px] text-(--text) mt-1 leading-normal">
                      {badge.description}
                    </p>
                    {badge.hasSpecialPrize && (
                      <span className="inline-block mt-2 rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[8px] font-bold text-amber-400">
                        🎁 {t('profile.badges.prizeNotice', '+ 1 Month Free Pro!')}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.section>
      </motion.div>
    </motion.main>
  )
}

