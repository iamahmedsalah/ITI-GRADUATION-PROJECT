import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../context/LanguageContext";

function localizedPath(language: string, pathname: string) {
  if (!pathname || pathname === "/") {
    return `/${language}`;
  }

  return `/${language}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export default function SiteFooter() {
  const { t } = useTranslation();
  const { language, direction } = useLanguage();

  const navLinks = [
    {
      label: t("footer.roadmaps"),
      to: localizedPath(language, "/roadmaps/frontend"),
    },
    {
      label: t("footer.guides"),
      to: localizedPath(language, "/guides"),
    },
    { label: t("footer.faqs"), to: localizedPath(language, "/faqs") },
    { label: t("footer.contact"), to: localizedPath(language, "/contact") },
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
                @ITI
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
              {["in", "yt", "x"].map((item) => (
                <span
                  key={item}
                  className="grid size-5 place-items-center rounded-squircle bg-(--surface-3) text-[10px] font-bold text-(--text-h)"
                >
                  {item}
                </span>
              ))}
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
