import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BookOpen01Icon,
  Compass01Icon,
  MapPinIcon,
} from "@hugeicons/core-free-icons";
import { useLanguage } from "../../context/LanguageContext";
import { useTranslation } from "react-i18next";

export default function GuidePage() {
  const { t } = useTranslation();
  const { language, direction } = useLanguage();

  return (
    <main
      className="min-h-screen bg-(--bg) px-4 py-10 text-(--text-h) sm:px-6 lg:px-8"
      dir={direction}
    >
      <div className="mx-auto grid max-w-6xl gap-10">
        <section className="rounded-4xl border border-(--border) bg-(--surface) p-8 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
          <div className="max-w-4xl">
            <p className="text-sm uppercase tracking-[0.32em] text-(--gd-primary)">
              {t("guidePage.overline")}
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.03em] text-(--text-h) sm:text-5xl">
              {t("guidePage.title")}
            </h1>
            <p className="mt-4 text-sm leading-7 text-(--text)">
              {t("guidePage.subtitle")}
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <article className="rounded-[28px] border border-(--border) bg-(--surface-2) p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-(--surface-soft) text-(--gd-primary)">
                <HugeiconsIcon icon={Compass01Icon} size={22} />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-(--text-h)">
                {t("guidePage.section1.title")}
              </h2>
              <p className="mt-3 text-sm leading-7 text-(--text)">
                {t("guidePage.section1.description")}
              </p>
            </article>

            <article className="rounded-[28px] border border-(--border) bg-(--surface-2) p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-(--surface-soft) text-(--gd-primary)">
                <HugeiconsIcon icon={MapPinIcon} size={22} />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-(--text-h)">
                {t("guidePage.section2.title")}
              </h2>
              <p className="mt-3 text-sm leading-7 text-(--text)">
                {t("guidePage.section2.description")}
              </p>
            </article>

            <article className="rounded-[28px] border border-(--border) bg-(--surface-2) p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-(--surface-soft) text-(--gd-primary)">
                <HugeiconsIcon icon={BookOpen01Icon} size={22} />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-(--text-h)">
                {t("guidePage.section3.title")}
              </h2>
              <p className="mt-3 text-sm leading-7 text-(--text)">
                {t("guidePage.section3.description")}
              </p>
            </article>
          </div>

          <div className="mt-12 rounded-[28px] border border-(--border) bg-(--surface-2) p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
            <p className="text-sm uppercase tracking-[0.32em] text-(--gd-primary)">
              {t("guidePage.ctaTitle")}
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-(--text-h)">
              {t("guidePage.ctaText")}
            </h2>
            <Link
              to={`/${language}/roadmaps/frontend`}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-squircle bg-(--gd-primary) px-6 py-3 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover)"
            >
              {t("guidePage.ctaButton")}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
