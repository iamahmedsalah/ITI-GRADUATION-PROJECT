import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../context/LanguageContext";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Facebook02Icon,
  GithubIcon,
  GitlabIcon,
  Linkedin02Icon,
} from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";
import {
  createListItemVariants,
  createStaggerContainerVariants,
} from "../../libs/motionVariants";
import { useSystemWhatsNew } from "../../hooks/useWhatsNew";

function localizedPath(language: string, pathname: string) {
  if (!pathname || pathname === "/") {
    return `/${language}`;
  }

  return `/${language}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export default function SiteFooter() {
  const { t } = useTranslation();
  const { language, direction } = useLanguage();
  const { data: systemData } = useSystemWhatsNew();
  const version = systemData?.version || "1.0.0";
  const MotionLink = motion(Link);

  const navLinks = [
    {
      label: t("footer.roadmaps"),
      to: localizedPath(language, "/"),
    },
    {
      label: t("footer.guides"),
      to: localizedPath(language, "/guides"),
    },
    { label: t("footer.faqs"), to: localizedPath(language, "/faqs") },
    { label: t("footer.contact"), to: localizedPath(language, "/contact") },
  ];

  const soicalLinks = [
    {
      icon: <HugeiconsIcon icon={Facebook02Icon} size={18} />,
      url: "https://facebook.com",
    },
    {
      icon: <HugeiconsIcon icon={Linkedin02Icon} size={18} />,
      url: "https://linkedin.com",
    },
    {
      icon: <HugeiconsIcon icon={GithubIcon} size={18} />,
      url: "https://github.com",
    },
    {
      icon: <HugeiconsIcon icon={GitlabIcon} size={18} />,
      url: "https://gitlab.com",
    },
  ];

  return (
    <footer
      className="border-t border-(--border) bg-(--surface) text-(--text)"
      dir={direction}
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <nav className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-(--text)">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="transition hover:text-(--text-h)"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-10 grid gap-8 md:grid-cols-[1fr_0.8fr] md:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <img
                src="/logo.png"
                alt={t("navbar.logo")}
                className="size-9 object-contain"
              />
              <span
                className="text-lg font-bold tracking-[0.06em] text-(--text-h)"
                style={{ fontFamily: "var(--heading)" }}
              >
                {t("navbar.logo")}
              </span>
              <span className="text-lg text-(--text)">{t("footer.by")}</span>
              <span className="rounded-squircle bg-(--gd-primary) px-2 py-1 text-sm font-semibold text-white">
                @Ilma Group
              </span>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-7 text-(--text)">
              {t("footer.description")}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-(--text)">
              <span>{t("footer.copyright")}</span>
              <span>|</span>
              <Link
                to={localizedPath(language, "/")}
                className="hover:text-(--text-h)"
              >
                {t("footer.terms")}
              </Link>
              <span>|</span>
              <Link
                to={localizedPath(language, "/")}
                className="hover:text-(--text-h)"
              >
                {t("footer.privacy")}
              </Link>
              <span>|</span>
              <span className="font-mono text-[10px] bg-(--surface-soft) text-(--text-h) px-2 py-0.5 rounded-full border border-(--border)">
                v{version}
              </span>
              <span>|</span>
              <motion.div
                className="flex items-center gap-2"
                variants={createStaggerContainerVariants(direction)}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
              >
                {soicalLinks.map((item, index) => (
                  <MotionLink
                    key={index}
                    to={item.url}
                    target="_blank"
                    rel="noreferrer"
                    variants={createListItemVariants(direction)}
                    whileHover={{ y: -3, scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className="grid size-7 place-items-center rounded-squircle bg-(--surface-3) hover:bg-(--gd-primary) text-[10px] font-bold text-(--text-h)"
                  >
                    {item.icon}
                  </MotionLink>
                ))}
              </motion.div>
            </div>
          </div>

          <div className="text-center md:text-let rtl:md:text-right">
            <p className="text-xl font-black uppercase tracking-tight text-(--text-h)">
              {t("footer.brandPrefix")}
              <span className="text-(--gd-primary)">
                {t("footer.brandHighlight")}
              </span>
              {t("footer.brandSuffix")}
            </p>
            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-(--text) md:mr-0 rtl:md:ml-0 rtl:md:mr-auto">
              {t("footer.partnerText")}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-(--text) md:justify-end rtl:md:justify-start">
              {["devops", "kubernetes", "cloudNative"].map((tag) => (
                <span key={tag}>{t(`footer.tags.${tag}`)}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
