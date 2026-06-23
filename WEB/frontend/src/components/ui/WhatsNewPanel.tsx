import { useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Route03Icon,
  AiChat02Icon,
  DashboardSquare03Icon,
  UserEdit01Icon,
  Mail01Icon,
  CourseIcon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';
import { useLanguage } from '../../context/LanguageContext';
import type { WhatsNewVersionData } from '../../hooks/useWhatsNew';

const iconMap = {
  Route03Icon,
  ChatBotIcon: AiChat02Icon,
  DashboardSquare03Icon,
  UserEdit01Icon,
  Mail01Icon,
  CourseIcon,
};

interface WhatsNewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  latestData: WhatsNewVersionData | null;
}

export default function WhatsNewPanel({ isOpen, onClose, latestData }: WhatsNewPanelProps) {
  const { language, direction } = useLanguage();
  const { t } = useTranslation();
  const isRtl = direction === 'rtl';

  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen]);

  if (!latestData) return null;

  const getLocalized = (en: string, ar: string) => (language === 'ar' ? ar : en);

  const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  // Slide drawer animation variants
  const panelVariants: Variants = {
    hidden: { x: isRtl ? '-100%' : '100%', opacity: 0.9 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 280,
        damping: 30,
        staggerChildren: 0.06,
        delayChildren: 0.05,
      },
    },
    exit: {
      x: isRtl ? '-100%' : '100%',
      opacity: 0.9,
      transition: { type: 'tween', ease: 'easeInOut', duration: 0.25 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 350, damping: 26 },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden" dir={direction}>
          {/* Dark Backdrop Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Slide Drawer Panel */}
          <motion.div
            className={[
              'fixed top-0 bottom-0 h-full w-full sm:w-[460px] bg-(--surface)/95 backdrop-blur-xl border-y-0 shadow-2xl z-10 flex flex-col overflow-hidden',
              isRtl ? 'border-r border-(--border) left-0' : 'border-l border-(--border) right-0',
            ].join(' ')}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Ambient Accent Glows */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-(--gd-primary)/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-(--gd-primary)/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative border-b border-(--border) px-6 py-6 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-(--accent-bg) border border-(--accent-border) px-2.5 py-0.5 text-xs font-semibold tracking-wider text-(--accent)">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--gd-primary-hover) opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-(--gd-primary)"></span>
                  </span>
                  {t('whatsNew.badge', { defaultValue: 'NEW RELEASE' })} {latestData.version}
                </div>
                <h2 className="mt-3 text-2xl font-bold text-(--text-h) leading-tight">
                  {getLocalized(latestData.titleEn, latestData.titleAr)}
                </h2>
                <p className="mt-2 text-xs leading-5 text-(--text)">
                  {getLocalized(latestData.descriptionEn, latestData.descriptionAr)}
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                className="grid size-9 place-items-center rounded-squircle border border-(--border) text-(--text) transition hover:bg-(--surface-2) hover:text-(--text-h) shrink-0"
                onClick={onClose}
                aria-label={t('common.close', { defaultValue: 'Close' })}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            {/* Scrollable Features List */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 scrollbar-thin">
              <div className="grid gap-5">
                {latestData.features.map((feature) => {
                  const IconComponent = iconMap[feature.iconName] || Route03Icon;
                  return (
                    <motion.div
                      key={feature.id}
                      className="flex items-start gap-4 p-3.5 rounded-squircle border border-(--border) bg-(--surface-soft) hover:border-(--accent-border) transition duration-200"
                      variants={itemVariants}
                    >
                      {/* Icon container */}
                      <span className="grid size-11 shrink-0 place-items-center rounded-squircle bg-(--surface-2) text-(--gd-primary) border border-(--border) shadow-inner">
                        <HugeiconsIcon icon={IconComponent} size={20} />
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-(--text-h)">
                            {getLocalized(feature.titleEn, feature.titleAr)}
                          </h3>
                          {feature.badgeEn && (
                            <span className="rounded-full bg-(--surface-3) border border-(--border) px-2 py-0.5 text-[9px] font-semibold text-(--text)">
                              {getLocalized(feature.badgeEn, feature.badgeAr || feature.badgeEn)}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-(--text)">
                          {getLocalized(feature.descEn, feature.descAr)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="border-t border-(--border) px-6 py-5 bg-(--surface-2)/30 flex items-center justify-end">
              <button
                type="button"
                className="w-full inline-flex items-center justify-center rounded-squircle bg-(--gd-primary) hover:bg-(--gd-primary-hover) text-white font-semibold text-sm px-6 py-3.5 shadow-lg shadow-(--gd-primary)/10 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                onClick={onClose}
              >
                {t('whatsNew.cta', { defaultValue: 'Got It, Thanks!' })}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
