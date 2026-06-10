import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../context/LanguageContext";
import RoadmapFilterMenu from "../../components/ui/RoadmapFilterMenu";

type RoadmapFilterType = "roleBased" | "skillBased";

function getFilterType(searchParams: URLSearchParams): RoadmapFilterType {
  const rawType = searchParams.get("type");
  return rawType === "skillBased" ? "skillBased" : "roleBased";
}

export default function RoadmapsPage() {
  const { t } = useTranslation();
  const { language, direction } = useLanguage();
  const [searchParams] = useSearchParams();
  const selectedType = getFilterType(searchParams);

  const cards = useMemo(() => {
    if (selectedType === "skillBased") {
      return [
        {
          title: t("roadmapsPage.skillCards.react"),
          description: t("roadmapsPage.skillCards.reactDescription"),
          badge: t("roadmapsPage.skillHeading"),
        },
        {
          title: t("roadmapsPage.skillCards.backend"),
          description: t("roadmapsPage.skillCards.backendDescription"),
          badge: t("roadmapsPage.skillHeading"),
        },
        {
          title: t("roadmapsPage.skillCards.devops"),
          description: t("roadmapsPage.skillCards.devopsDescription"),
          badge: t("roadmapsPage.skillHeading"),
        },
      ];
    }

    return [
      {
        title: t("roadmapsPage.roleCards.frontend"),
        description: t("roadmapsPage.roleCards.frontendDescription"),
        badge: t("roadmapsPage.roleHeading"),
      },
      {
        title: t("roadmapsPage.roleCards.backend"),
        description: t("roadmapsPage.roleCards.backendDescription"),
        badge: t("roadmapsPage.roleHeading"),
      },
      {
        title: t("roadmapsPage.roleCards.data"),
        description: t("roadmapsPage.roleCards.dataDescription"),
        badge: t("roadmapsPage.roleHeading"),
      },
    ];
  }, [selectedType, t]);

  return (
    <main
      className="min-h-screen bg-(--bg) px-4 py-10 text-(--text-h) sm:px-6 lg:px-8"
      dir={direction}
    >
      <div className="mx-auto grid max-w-6xl gap-10">
        <section className="rounded-[32px] border border-(--border) bg-(--surface) p-8 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.32em] text-(--gd-primary)">
                {t("roadmapsPage.explore")}
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-[-0.03em] text-(--text-h) sm:text-5xl">
                {t("roadmapsPage.title")}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-(--text)">
                {t("roadmapsPage.subtitle")}
              </p>
            </div>
            <RoadmapFilterMenu selectedType={selectedType} />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-[28px] border border-(--border) bg-(--surface-2) p-6 transition hover:-translate-y-1 hover:bg-(--surface)"
            >
              <span className="inline-flex rounded-full bg-(--surface-soft) px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-(--gd-primary)">
                {card.badge}
              </span>
              <h2 className="mt-5 text-xl font-semibold text-(--text-h)">
                {card.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-(--text)">
                {card.description}
              </p>
              <Link
                to={`/${language}/roadmaps/frontend?type=${selectedType}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-(--gd-primary) transition hover:text-(--gd-primary-hover)"
              >
                {t("roadmapsPage.viewExamples")}
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
