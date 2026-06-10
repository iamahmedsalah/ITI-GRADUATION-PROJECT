import { useMemo } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useTranslation } from "react-i18next";
import FaqItem from "../../components/ui/FaqItem";

export default function FaqsPage() {
  const { t } = useTranslation();
  const { direction } = useLanguage();

  const faqs = useMemo(
    () => [
      {
        question: t("faqPage.question1"),
        answer: t("faqPage.answer1"),
      },
      {
        question: t("faqPage.question2"),
        answer: t("faqPage.answer2"),
      },
      {
        question: t("faqPage.question3"),
        answer: t("faqPage.answer3"),
      },
    ],
    [t],
  );

  return (
    <main
      className="min-h-screen bg-(--bg) px-4 py-10 text-(--text-h) sm:px-6 lg:px-8"
      dir={direction}
    >
      <div className="mx-auto grid max-w-6xl gap-12">
        <header className="rounded-[32px] border border-(--border) bg-(--surface) p-8 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
          <p className="text-sm uppercase tracking-[0.32em] text-(--gd-primary)">
            {t("faqPage.overline")}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.03em] text-(--text-h) sm:text-5xl">
            {t("faqPage.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-(--text)">
            {t("faqPage.subtitle")}
          </p>
        </header>

        <section className="grid gap-4">
          {faqs.map((faq) => (
            <FaqItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
