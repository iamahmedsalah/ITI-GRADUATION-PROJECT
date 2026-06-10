import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../context/LanguageContext";
import CustomDropdown, { type DropdownOption } from "./CustomDropdown";

type RoadmapFilterType = "roleBased" | "skillBased";

type RoadmapFilterMenuProps = {
  selectedType?: RoadmapFilterType;
};

const roadmapFilters: Array<{
  value: RoadmapFilterType;
  titleKey: string;
  descriptionKey: string;
}> = [
  {
    value: "roleBased",
    titleKey: "landing.roleRoadmaps",
    descriptionKey: "roadmapsPage.roleDescription",
  },
  {
    value: "skillBased",
    titleKey: "landing.skillRoadmaps",
    descriptionKey: "roadmapsPage.skillDescription",
  },
];

function getFilterType(searchParams: URLSearchParams): RoadmapFilterType {
  return searchParams.get("type") === "skillBased" ? "skillBased" : "roleBased";
}

export default function RoadmapFilterMenu({
  selectedType,
}: RoadmapFilterMenuProps) {
  const { t } = useTranslation();
  const { language, direction } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const typeFromLocation = useMemo(
    () => getFilterType(new URLSearchParams(location.search)),
    [location.search],
  );
  const currentType = selectedType ?? typeFromLocation;

  const options: DropdownOption<RoadmapFilterType>[] = roadmapFilters.map(
    (filter) => ({
      value: filter.value,
      label: t(filter.titleKey),
    }),
  );

  return (
    <div className="min-w-[220px]" dir={direction}>
      <CustomDropdown<RoadmapFilterType>
        value={currentType}
        options={options}
        onChange={(value) => {
          navigate(`/${language}/roadmaps/frontend?type=${value}`);
        }}
        placeholder={t("navbar.roadmap")}
        buttonClassName="bg-(--surface) px-4 py-3 text-sm"
      />
    </div>
  );
}
