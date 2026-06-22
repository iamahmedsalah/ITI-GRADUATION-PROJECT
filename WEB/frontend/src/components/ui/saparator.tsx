import { useTranslation } from "react-i18next";
import type { RoadmapTemplate } from "../../types/roadmap";
import { RoadmapCard } from "../landing/RoadmapLanding";

type SeparatorProps = {
  title: string;
  roadmaps: RoadmapTemplate[];
};

export function SeparatorRoadmaps({ title, roadmaps }: SeparatorProps) {
  const { t } = useTranslation();
  return (
    <>
      <div className="relative border-t border-(--border) pt-12">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-squircle border border-(--border) bg-(--surface) px-5 py-2 text-base font-semibold uppercase text-(--gd-primary) shadow-(--shadow)">
          {title}
        </div>

        {roadmaps.length ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {roadmaps.map((roadmap) => (
              <RoadmapCard
                key={roadmap.slug || roadmap._id}
                roadmap={roadmap}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-squircle border border-(--border) bg-(--surface) px-5 py-8 text-center text-(--text)">
            {t("landing.noRoadmaps")}
          </div>
        )}
      </div>
    </>
  );
}

export function SeparatorCourses() {
  const { t } = useTranslation();
  return (
    <div className="mt-12 relative border-t border-(--border) pt-12">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-squircle border border-(--border) bg-(--surface) px-5 py-2 text-base font-semibold uppercase text-(--gd-primary) shadow-(--shadow)">
        {t("landing.coursesBadge")}
      </div>
    </div>
  );
}
