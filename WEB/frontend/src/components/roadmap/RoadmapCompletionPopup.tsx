import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import { AiMagicIcon, Cancel01Icon, Route03Icon } from '@hugeicons/core-free-icons'
import { useLanguage } from '../../context/LanguageContext'
import type { AiRecommendationsData } from '../../libs/user-api'
import { AiRecommendationCardsGrid } from '../dashboard/DashboardRecommendations'
import ThreeSceneLoader from '../ui/ThreeSceneLoader'

type RoadmapCompletionPopupProps = {
  open: boolean
  roadmapTitle: string
  recommendations?: AiRecommendationsData
  isLoadingRecommendations: boolean
  onClose: () => void
}

export function RoadmapCompletionPopup({
  open,
  roadmapTitle,
  recommendations,
  isLoadingRecommendations,
  onClose,
}: RoadmapCompletionPopupProps) {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return undefined

    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    let animationFrameId: number
    const resizeCanvas = () => {
      canvas.width = document.documentElement.clientWidth
      canvas.height = document.documentElement.clientHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Particle/Fireworks system
    interface Spark {
      x: number
      y: number
      vx: number
      vy: number
      alpha: number
      color: string
      size: number
      decay: number
    }

    interface Rocket {
      x: number
      y: number
      tx: number
      ty: number
      vy: number
      color: string
    }

    let sparks: Spark[] = []
    let rockets: Rocket[] = []

    const colors = [
      '#1db954', // Brand primary green
      '#1ed760', // Primary green hover
      '#f59b23', // Gold/Warning
      '#50a0ff', // Info blue
      '#e22134', // Error red
      '#ffffff', // White
    ]

    const spawnRocket = () => {
      const startX = Math.random() * canvas.width
      const startY = canvas.height
      const targetX = Math.random() * canvas.width
      const targetY = Math.random() * (canvas.height * 0.45) + canvas.height * 0.1
      const color = colors[Math.floor(Math.random() * colors.length)]
      rockets.push({
        x: startX,
        y: startY,
        tx: targetX,
        ty: targetY,
        vy: -Math.random() * 5 - 9,
        color,
      })
    }

    // Launch initial rockets
    for (let i = 0; i < 4; i++) {
      spawnRocket()
    }

    const spawnInterval = setInterval(() => {
      if (rockets.length < 6) {
        spawnRocket()
      }
    }, 450)

    const explode = (x: number, y: number, color: string) => {
      const count = 35 + Math.floor(Math.random() * 25)
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 4.5 + 2
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color,
          size: Math.random() * 2.2 + 1.2,
          decay: Math.random() * 0.014 + 0.011,
        })
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Rocket updates
      rockets = rockets.filter((rocket) => {
        rocket.y += rocket.vy
        rocket.x += (rocket.tx - rocket.x) * 0.05

        ctx.save()
        ctx.beginPath()
        ctx.arc(rocket.x, rocket.y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = rocket.color
        ctx.fill()
        ctx.restore()

        if (rocket.y <= rocket.ty || rocket.vy >= 0) {
          explode(rocket.x, rocket.y, rocket.color)
          return false
        }
        return true
      })

      // Spark updates
      sparks = sparks.filter((spark) => {
        spark.x += spark.vx
        spark.y += spark.vy
        spark.vy += 0.055 // gravity
        spark.alpha -= spark.decay

        if (spark.alpha <= 0) return false

        ctx.save()
        ctx.globalAlpha = spark.alpha
        ctx.beginPath()
        ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2)
        ctx.fillStyle = spark.color
        ctx.fill()
        ctx.restore()

        return true
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      clearInterval(spawnInterval)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-120 grid place-items-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Fireworks Canvas overlay */}
          <canvas
            ref={canvasRef}
            className="pointer-events-none fixed inset-0 z-10"
          />

          <motion.section
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-20 w-full max-w-4xl overflow-hidden rounded-2xl border border-(--accent-border) bg-(--surface) shadow-[0_28px_90px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute inset-e-4 top-4 z-10 grid size-10 cursor-pointer place-items-center rounded-squircle border border-(--border) bg-(--surface-2) text-(--text-h) transition hover:border-(--accent-border)"
              aria-label={t('adminUi.common.close', 'Close')}
              onClick={onClose}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={20} />
            </button>

            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="grid content-center gap-4 pe-10 lg:pe-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--accent)">
                  {t('roadmapDetail.completionPopup.overline')}
                </p>
                <div>
                  <h2 className="text-3xl font-semibold leading-tight text-(--text-h)">
                    {t('roadmapDetail.completionPopup.title')}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-(--text)">
                    {t('roadmapDetail.completionPopup.subtitle', { roadmap: roadmapTitle })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/${language}/dashboard`}
                    className="inline-flex items-center gap-2 rounded-squircle bg-(--accent) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover)"
                    onClick={onClose}
                  >
                    <HugeiconsIcon icon={Route03Icon} size={17} />
                    {t('roadmapDetail.completionPopup.dashboard')}
                  </Link>
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-squircle border border-(--border) px-4 py-2 text-sm font-semibold text-(--text-h) transition hover:border-(--accent-border) hover:bg-(--surface-2)"
                    onClick={onClose}
                  >
                    {t('roadmapDetail.completionPopup.keepViewing')}
                  </button>
                </div>
              </div>

              <div className="relative min-h-64 overflow-hidden rounded-lg border border-(--border) bg-(--surface-2)">
                <ThreeSceneLoader cycleDurationMs={1700} />
              </div>
            </div>

            <div className="border-t border-(--border) bg-(--surface-2) p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-(--text)">
                    {t('roadmapDetail.completionPopup.nextTitle')}
                  </h3>
                  <p className="mt-1 text-sm text-(--text)">
                    {t('roadmapDetail.completionPopup.nextSubtitle')}
                  </p>
                </div>
                <HugeiconsIcon icon={AiMagicIcon} size={20} className="shrink-0 text-(--accent)" />
              </div>
              <AiRecommendationCardsGrid
                data={recommendations}
                isLoading={isLoadingRecommendations}
                limit={3}
                className="mt-4 grid gap-3 md:grid-cols-3"
                itemClassName="bg-(--surface)"
                emptyClassName="md:col-span-3 bg-(--surface)"
              />
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
