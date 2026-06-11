import { useState, type FormEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LinkedinIcon,
  Mail01Icon,
  TwitterIcon,
} from "@hugeicons/core-free-icons";
import { useLanguage } from "../../context/LanguageContext";
import { useTranslation } from "react-i18next";
import FormInput from "../../components/ui/Input";

export default function AboutPage() {
  const { t } = useTranslation();
  const { direction } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <main
      className="min-h-screen bg-(--bg) px-4 py-10 text-(--text-h) sm:px-6 lg:px-8"
      dir={direction}
    >
      <div className="mx-auto grid max-w-6xl gap-10">
        <section className="rounded-4xl border border-(--border) bg-(--surface) p-8 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-(--gd-primary)">
                {t("aboutPage.overline")}
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-[-0.03em] text-(--text-h) sm:text-5xl">
                {t("aboutPage.title")}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-(--text)">
                {t("aboutPage.subtitle")}
              </p>

              <div className="mt-8 grid gap-5 rounded-[28px] border border-(--border) bg-(--surface-2) p-6">
                <div>
                  <h2 className="text-xl font-semibold text-(--text-h)">
                    {t("aboutPage.missionTitle")}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-(--text)">
                    {t("aboutPage.missionText")}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-(--text-h)">
                    {t("aboutPage.valuesTitle")}
                  </h3>
                  <ul className="mt-3 grid gap-3 text-sm text-(--text)">
                    <li>• {t("aboutPage.values.support")}</li>
                    <li>• {t("aboutPage.values.accessible")}</li>
                    <li>• {t("aboutPage.values.clear")}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-(--border) bg-(--surface-2) p-6 shadow-[0_20px_50px_rgba(0,0,0,0.14)]">
              <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
                <form onSubmit={handleSubmit} className="grid gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-(--text-h)">
                      {t("aboutPage.contactTitle")}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-(--text)">
                      {t("aboutPage.contactDescription")}
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <FormInput
                      label={t("aboutPage.form.name")}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder={t("aboutPage.form.namePlaceholder")}
                      className="bg-(--surface)"
                    />
                    <FormInput
                      label={t("aboutPage.form.email")}
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={t("aboutPage.form.emailPlaceholder")}
                      className="bg-(--surface)"
                    />
                    <label className="grid gap-2 text-sm text-(--text)">
                      <span>{t("aboutPage.form.message")}</span>
                      <textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder={t("aboutPage.form.messagePlaceholder")}
                        rows={5}
                        className="rounded-3xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h) outline-none transition focus:border-(--gd-primary)"
                      />
                    </label>
                    <button
                      type="submit"
                      className="mt-2 inline-flex w-full items-center justify-center rounded-squircle bg-(--gd-primary) px-4 py-3 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover)"
                    >
                      {t("aboutPage.form.submit")}
                    </button>
                  </div>
                </form>

                <aside className="grid rounded-[28px] border border-(--border) bg-(--surface) p-5">
                  <div className="inline-flex items-center gap-3 text-sm font-semibold text-(--text-h)">
                    <span className="grid size-10 place-items-center rounded-3xl bg-(--surface-soft) text-(--gd-primary)">
                      <HugeiconsIcon icon={Mail01Icon} size={18} />
                    </span>
                    <span>{t("aboutPage.socialTitle")}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-(--text)">
                    {t("aboutPage.socialText")}
                  </p>

                  <a
                    href="mailto:hello@ilma.ai"
                    className="mt-6 inline-flex items-center gap-3 rounded-3xl border border-(--border) bg-(--surface) px-4 py-4 text-sm text-(--text-h) transition hover:border-(--gd-primary)"
                  >
                    <HugeiconsIcon icon={Mail01Icon} size={18} />
                    <span>hello@ilma.ai</span>
                  </a>

                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-(--gd-primary)">
                      {t("aboutPage.followUs")}
                    </p>
                    <div className="mt-4 grid gap-3">
                      <a
                        href="https://twitter.com"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h) transition hover:border-(--gd-primary)"
                      >
                        <HugeiconsIcon icon={TwitterIcon} size={16} />
                        Twitter
                      </a>
                      <a
                        href="https://linkedin.com"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h) transition hover:border-(--gd-primary)"
                      >
                        <HugeiconsIcon icon={LinkedinIcon} size={16} />
                        LinkedIn
                      </a>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
