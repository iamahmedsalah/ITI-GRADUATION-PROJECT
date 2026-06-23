import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiMagicIcon,
  CrownIcon,
  DashboardSquare03Icon,
  Login02Icon,
  Login03Icon,
  Route03Icon,
  UserAdd01Icon,
  UserEdit01Icon,
} from "@hugeicons/core-free-icons";
import type { LanguagePref } from "../../context/LanguageContext";
import LangToggleButton from "../common/lang-toggle";
import ThemeToggleButton from "../common/theme-toggle";
import { clearAccessToken } from "../../utils/api";
import type { AuthUser } from "../../utils/route-utils";
import {
  authQueryKey,
  fetchCurrentUser,
  logoutCurrentUser,
} from "../../libs/react-query";
import AccountMenu from "../ui/AccountMenu";

type NavbarLink = {
  label: string;
  to: string;
  exact?: boolean;
  dropdown?: boolean;
  dropdownItems?: Array<{
    label: string;
    to?: string;
    disabled?: boolean;
    icon?: typeof AiMagicIcon;
  }>;
};

type NavbarProps = {
  language: LanguagePref;
  links?: NavbarLink[];
};

type AuthState = {
  status: "loading" | "anonymous" | "authenticated";
  user?: AuthUser;
};

function navClassName({ isActive }: { isActive: boolean }) {
  return [
    "inline-flex items-center gap-1 rounded-squircle px-4 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-(--surface-3) text-(--text-h) cursor-pointer"
      : "text-(--text-secondary) hover:bg-(--surface-soft-hover) hover:text-(--text-h) cursor-pointer",
  ].join(" ");
}

function logoPath(language: LanguagePref) {
  return `/${language}`;
}

function MenuToggleIcon({ open }: { open: boolean }) {
  return (
    <span className="relative flex size-4 flex-col items-stretch justify-center">
      <motion.span
        className="absolute left-0 top-0.5 h-0.5 w-full rounded-squircle bg-current"
        animate={open ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.span
        className="absolute left-0 top-1.5 h-0.5 w-full rounded-squircle bg-current"
        animate={
          open ? { opacity: 0, scaleX: 0.25 } : { opacity: 1, scaleX: 1 }
        }
        transition={{ duration: 0.14 }}
      />
      <motion.span
        className="absolute left-0 top-2.5 h-0.5 w-full rounded-squircle bg-current"
        animate={open ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      />
    </span>
  );
}

export default function Navbar({ language, links = [] }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const primaryLinks = links.length > 0 ? links : [];
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isRtl = language === "ar";
  const queryClient = useQueryClient();

  const { data: authUser, isLoading } = useQuery({
    queryKey: authQueryKey,
    queryFn: fetchCurrentUser,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const refreshAuthState = () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKey });
      void queryClient.refetchQueries({
        queryKey: authQueryKey,
        type: "active",
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshAuthState();
      }
    };

    window.addEventListener("pageshow", refreshAuthState);
    window.addEventListener("focus", refreshAuthState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", refreshAuthState);
      window.removeEventListener("focus", refreshAuthState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [queryClient]);

  const authState: AuthState = isLoading
    ? { status: "loading" }
    : authUser
      ? { status: "authenticated", user: authUser }
      : { status: "anonymous" };

  const handleLogout = async () => {
    try {
      await logoutCurrentUser();
      queryClient.setQueryData(authQueryKey, null);
      navigate(`/${language}/login`, { replace: true });
    } catch {
      clearAccessToken();
      queryClient.setQueryData(authQueryKey, null);
      navigate(`/${language}/login`, { replace: true });
    }
  };

  return (
    <header className="relative z-50 border-b border-(--border) bg-(--surface-header) text-(--text-h) shadow-[0_1px_0_var(--surface-header-line)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-3 sm:h-20 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          to={logoPath(language)}
          className="flex min-w-0 shrink-0 items-center gap-2 rounded-2xl px-1 py-1 text-(--text-h) transition-transform hover:scale-[1.02] sm:gap-3"
          aria-label={t("navbar.logo")}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <img
            src="/logo.png"
            alt={t("navbar.logo")}
            className="size-8 object-contain sm:size-10"
          />
          <span
            className="max-w-18 truncate text-sm font-semibold tracking-[0.06em] text-(--text-h) sm:max-w-none sm:text-2xl"
            style={{ fontFamily: "var(--heading)" }}
          >
            {t("navbar.logo")}
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 lg:flex">
          {primaryLinks.map((link) => {
            if (link.dropdownItems?.length) {
              return (
                <div key={link.label} className="group relative">
                  <NavLink
                    to={link.to}
                    end={link.exact ?? false}
                    className={navClassName}
                  >
                    {link.to.includes("/ai") ? (
                      <HugeiconsIcon icon={AiMagicIcon} size={18} />
                    ) : link.to.includes("/upgrade") ? (
                      <HugeiconsIcon icon={CrownIcon} size={18} />
                    ) : link.to.includes("/roadmaps") ? (
                      <HugeiconsIcon icon={Route03Icon} size={18} />
                    ) : null}
                    <span>{link.label}</span>
                  </NavLink>
                  <div className="invisible absolute left-0 top-full z-50 min-w-58 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
                    <div className="rounded-2xl border border-(--border) bg-(--surface) p-2 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
                      {link.dropdownItems.map((item) =>
                        item.disabled || !item.to ? (
                          <span
                            key={item.label}
                            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-(--text) opacity-60"
                          >
                            {item.icon ? <HugeiconsIcon icon={item.icon} size={17} /> : null}
                            {item.label}
                          </span>
                        ) : (
                          <Link
                            key={item.label}
                            to={item.to}
                            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-(--text-h) transition hover:bg-(--surface-2)"
                          >
                            {item.icon ? <HugeiconsIcon icon={item.icon} size={17} /> : null}
                            {item.label}
                          </Link>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact ?? false}
                className={navClassName}
              >
                {link.to.includes("/ai") ? (
                  <HugeiconsIcon icon={AiMagicIcon} size={18} />
                ) : link.to.includes("/upgrade") ? (
                  <HugeiconsIcon icon={CrownIcon} size={18} />
                ) : null}
                <span>{link.label}</span>
                {link.dropdown ? (
                  <span className="text-[10px] leading-none opacity-80">
                    &#9662;
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
          <LangToggleButton />
          <ThemeToggleButton />
        </div>

        {authState.status === "authenticated" && authState.user ? (
          <>
            <AccountMenu
              user={authState.user}
              language={language}
              isRtl={isRtl}
            />

            <button
              type="button"
              className="grid size-10 place-items-center rounded-2xl border border-(--border) bg-(--surface) text-(--text-secondary) transition-colors hover:bg-(--surface-2) hover:text-(--text-h) lg:hidden cursor-pointer"
              aria-label={
                isMobileMenuOpen ? t("navbar.closeMenu") : t("navbar.openMenu")
              }
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              <MenuToggleIcon open={isMobileMenuOpen} />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="grid size-10 cursor-pointer place-items-center rounded-2xl border border-(--border) bg-(--surface) text-(--text-secondary) transition-colors hover:bg-(--surface-2) hover:text-(--text-h) lg:hidden"
              aria-label={
                isMobileMenuOpen ? t("navbar.closeMenu") : t("navbar.openMenu")
              }
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              <MenuToggleIcon open={isMobileMenuOpen} />
            </button>

            <div className="hidden items-center gap-2 lg:flex">
              <Link
                to={`/${language}/login`}
                className="rounded-squircle inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--surface-soft-hover) hover:text-(--text-h)"
              >
                {t("navbar.login")}
                <HugeiconsIcon icon={Login02Icon} size={20} />
              </Link>
              <Link
                to={`/${language}/signup`}
                className="inline-flex items-center rounded-squircle gap-2 bg-(--gd-primary) px-6 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(29,185,84,0.24)] transition-transform hover:-translate-y-0.5 hover:bg-(--gd-primary-hover)"
              >
                {t("navbar.signup")}
                <HugeiconsIcon icon={UserAdd01Icon} size={20} />
              </Link>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {isMobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-(--border) px-4 pb-4 pt-3 lg:hidden"
          >
            <nav className="grid gap-1">
              {primaryLinks.map((link) => {
                if (link.dropdownItems?.length) {
                  return (
                    <div key={link.label} className="grid gap-1">
                      <NavLink
                        to={link.to}
                        end={link.exact ?? false}
                        className={({ isActive }) =>
                          [
                            "flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-all rounded-xl",
                            isActive
                              ? "bg-(--surface-3) text-(--text-h)"
                              : "text-(--text-h) hover:bg-(--surface-soft-hover)",
                          ].join(" ")
                        }
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="grid size-8 place-items-center rounded-2xl bg-[linear-gradient(135deg,rgba(29,185,84,0.18),rgba(10,140,70,0.08))] text-(--text-h)">
                          <HugeiconsIcon
                            icon={link.to.includes("/ai") ? AiMagicIcon : Route03Icon}
                            size={16}
                          />
                        </span>
                        <span className="flex-1">{link.label}</span>
                      </NavLink>
                      <div className="grid gap-0.5 ps-11">
                        {link.dropdownItems.map((item) =>
                          item.disabled || !item.to ? (
                            <span
                              key={item.label}
                              className="flex items-center gap-2 px-4 py-2.5 text-xs text-(--text-secondary) opacity-60"
                            >
                              <span className="opacity-60">•</span>
                              <span>{item.label}</span>
                            </span>
                          ) : (
                            <Link
                              key={item.label}
                              to={item.to}
                              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-(--text-secondary) transition hover:bg-(--surface-soft-hover) hover:text-(--text-h)"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <span className="opacity-60">•</span>
                              <span>{item.label}</span>
                            </Link>
                          ),
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.exact ?? false}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-all rounded-xl",
                        isActive
                          ? "bg-(--surface-3) text-(--text-h)"
                          : "text-(--text-secondary) hover:bg-(--surface-soft-hover) hover:text-(--text-h)",
                      ].join(" ")
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="grid size-8 place-items-center rounded-2xl bg-[linear-gradient(135deg,rgba(29,185,84,0.18),rgba(10,140,70,0.08))] text-(--text-h)">
                      <HugeiconsIcon
                        icon={
                          link.to.includes("/ai")
                            ? AiMagicIcon
                            : link.to.includes("/upgrade")
                              ? CrownIcon
                              : link.to.includes("roadmap")
                                ? Route03Icon
                                : DashboardSquare03Icon
                        }
                        size={16}
                      />
                    </span>
                    <span className="flex-1">{link.label}</span>
                    {link.dropdown ? (
                      <span className="text-[10px] leading-none opacity-80">
                        &#9662;
                      </span>
                    ) : null}
                  </NavLink>
                );
              })}
            </nav>
            {authState.status === "authenticated" && authState.user ? (
              <div className="mt-3 grid gap-1 rounded-2xl border border-(--border) bg-(--surface) p-2 shadow-[0_12px_36px_rgba(0,0,0,0.12)] z-50">
                <div className="rounded-xl border border-(--border) bg-[radial-gradient(circle_at_top_left,rgba(29,185,84,0.08),rgba(255,255,255,0.01))] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-(--text-secondary)">
                    {t("navbar.signedInAs")}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-(--text-h)">
                    {authState.user.name}
                  </p>
                  <p className="truncate text-xs text-(--text)">
                    {authState.user.email}
                  </p>
                </div>
                <NavLink
                  to={`/${language}/dashboard`}
                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-(--text-secondary) transition-colors hover:bg-(--surface-soft-hover) hover:text-(--text-h)"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="grid size-8 place-items-center rounded-xl bg-[linear-gradient(135deg,rgba(29,185,84,0.14),rgba(30,215,96,0.05))] text-(--text-h)">
                    <HugeiconsIcon icon={DashboardSquare03Icon} size={16} />
                  </span>
                  <span className="flex-1">{t("layout.dashboard")}</span>
                </NavLink>
                <NavLink
                  to={`/${language}/profile`}
                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-(--text-secondary) transition-colors hover:bg-(--surface-soft-hover) hover:text-(--text-h)"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="grid size-8 place-items-center rounded-xl bg-[linear-gradient(135deg,rgba(29,185,84,0.12),rgba(10,140,70,0.05))] text-(--text-h)">
                    <HugeiconsIcon icon={UserEdit01Icon} size={16} />
                  </span>
                  <span className="flex-1">{t("navbar.myProfile")}</span>
                </NavLink>
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-(--error) transition-colors hover:bg-[rgba(226,33,52,0.06)]"
                  onClick={handleLogout}
                >
                  <span className="grid size-8 place-items-center rounded-xl bg-[linear-gradient(135deg,rgba(226,33,52,0.14),rgba(226,33,52,0.03))] text-(--error)">
                    <HugeiconsIcon icon={Login03Icon} size={16} />
                  </span>
                  <span className="flex-1">{t("navbar.logout")}</span>
                </button>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  to={`/${language}/login`}
                  className="rounded-squircle flex items-center justify-center gap-1.5 border border-(--border) bg-(--surface) px-4 py-3 text-center text-sm font-medium text-(--text-h) transition-colors hover:bg-(--surface-soft-hover)"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t("navbar.login")}
                  <HugeiconsIcon icon={Login02Icon} size={20} />
                </Link>
                <Link
                  to={`/${language}/signup`}
                  className="rounded-squircle flex items-center justify-center gap-1.5 bg-[linear-gradient(135deg,#33ab6a_0%,#36e28a_60%,#9fd95b_100%)] px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_24px_rgba(29,185,84,0.18)] transition-all hover:brightness-105"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t("navbar.signup")}
                  <HugeiconsIcon icon={UserAdd01Icon} size={20} />
                </Link>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
