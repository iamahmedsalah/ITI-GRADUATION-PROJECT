import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Album01Icon,
  Facebook02Icon,
  GithubIcon,
  GitlabIcon,
  Linkedin02Icon,
  Mail01Icon,
  MailAtSign01Icon,
  RecordIcon,
} from "@hugeicons/core-free-icons";
import {
  createListItemVariants,
  createStaggerContainerVariants,
  type MotionDirection,
} from "../../libs/motionVariants";
import { SocialLink } from "../ui/SocialLink";
type ContactInfoPanelProps = {
  direction: MotionDirection;
};

const contactEmail = "ilma.sh@outlook.com";

export default function ContactInfoPanel({ direction }: ContactInfoPanelProps) {
  const { t } = useTranslation();
  const listVariants = createStaggerContainerVariants(direction);
  const itemVariants = createListItemVariants(direction);

  return (
    <div className="grid gap-8 lg:pt-14">
      <section>
        <div className="inline-flex items-center gap-3 text-sm font-bold text-(--text-h)">
          <span className="mb-2 grid size-9 place-items-center rounded-squircle bg-(--surface-2) text-(--gd-primary)">
            <HugeiconsIcon icon={Mail01Icon} size={21} />
          </span>
          <span>{t("contactPage.socialTitle")}</span>
        </div>
        <p className="mt-4 text-sm leading-6 text-(--text-h)">
          {t("contactPage.socialText")}
        </p>

        <motion.a
          href={`mailto:${contactEmail}`}
          className="mt-7 flex min-h-12 items-center justify-center gap-3 rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 text-sm font-bold text-(--text-h) transition hover:border-(--gd-primary)"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <HugeiconsIcon icon={MailAtSign01Icon} size={23} />
          <span>{contactEmail}</span>
        </motion.a>

        <motion.div
          className="mt-4 grid gap-3"
          variants={listVariants}
          initial="hidden"
          whileInView="show"
        >
          <SocialLink
            href="https://github.com"
            label="GitHub"
            icon={GithubIcon}
            variants={itemVariants}
          />
          <SocialLink
            href="https://linkedin.com"
            label="LinkedIn"
            icon={Linkedin02Icon}
            variants={itemVariants}
          />
          <SocialLink
            href="https://facebook.com"
            label="Facebook"
            icon={Facebook02Icon}
            variants={itemVariants}
          />
          <SocialLink
            href="https://gitlab.com"
            label="GitLab"
            icon={GitlabIcon}
            variants={itemVariants}
          />
        </motion.div>
      </section>

      <section className="grid gap-5 rounded-[28px] border border-(--border) bg-(--surface-2) p-5 sm:p-6">
        <div>
          <h2 className="inline-flex items-center gap-3 text-[22px] leading-none text-(--text-h)">
            <HugeiconsIcon
              icon={Album01Icon}
              size={25}
              className="text-(--gd-primary)"
            />
            {t("contactPage.missionTitle")}
          </h2>
          <p className="mt-4 text-sm leading-7 text-(--text-h)">
            {t("contactPage.missionText")}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-(--text-h)">
            {t("contactPage.valuesTitle")}
          </h3>
          <ul className="mt-4 grid gap-3 text-sm text-(--text-h)">
            {[
              t("contactPage.values.support"),
              t("contactPage.values.accessible"),
              t("contactPage.values.clear"),
            ].map((value) => (
              <li key={value} className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={RecordIcon}
                  size={15}
                  className="text-(--gd-primary)"
                />
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
