import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Facebook01Icon, GoogleIcon } from "@hugeicons/core-free-icons";
import { useLanguage } from "../context/LanguageContext";
import {
  authFormFieldGridVariants,
  authFormFieldItemVariants,
  authFormSectionVariants,
  authFormVariants,
  createPageVariants,
} from "../libs/motionVariants";
import { buildApiUrl } from "../utils/api";
import { getBackendResponseMessage, type BackendResponseError } from "../utils/backendResponseMessage";
import { signupSchema } from "../types/validationSchemas";
import { z } from "zod";
import PasswordStrengthSubmit from "../components/ui/passwordStrength";
import PasswordVisibilityToggle from "../components/ui/passwordVisibilityToggle";
import PasswordActions from "../components/ui/passwordActions";
import FormInput from "../components/ui/form-input";

type SignupFormValues = z.infer<typeof signupSchema>;

function SignupPage() {
  const { language, direction } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordCopied, setIsPasswordCopied] = useState(false);
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const pageVariants = createPageVariants(direction);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, touchedFields },
  } = useForm<SignupFormValues>({
    mode: "onTouched",
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      Fname: "",
      Lname: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(buildApiUrl("/auth/signup"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(values),
      });

      const data = (await response.json()) as BackendResponseError;

      if (!response.ok) {
        toast.error(
          getBackendResponseMessage(response, data, {
            fallbackKey: 'auth.signupFailed',
            translate: t,
            locale: language === 'ar' ? 'ar-EG' : 'en-US',
          }),
        );
        return;
      }

      toast.success(t("auth.signupSuccess"));
      navigate(`/${language}/verify-email?email=${encodeURIComponent(values.email)}`, {
        replace: true,
        state: { email: values.email },
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("auth.signupFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const usernameValue = useWatch({ control, name: "username" }) ?? "";
  const emailValue = useWatch({ control, name: "email" }) ?? "";
  const firstNameValue = useWatch({ control, name: "Fname" }) ?? "";
  const lastNameValue = useWatch({ control, name: "Lname" }) ?? "";
  const passwordValue = useWatch({ control, name: "password" }) ?? "";
  const languageLabel = t(language === "ar" ? "arabic" : "english");
  const isRtl = direction === "rtl";

  const generatePassword = (length = 14) => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()-_=+[]{};:,.?";
    const all = upper + lower + numbers + symbols;

    const randomIndex = (max: number) => {
      if (globalThis.crypto?.getRandomValues) {
        const array = new Uint32Array(1);
        globalThis.crypto.getRandomValues(array);
        return array[0] % max;
      }

      return Math.floor(Math.random() * max);
    };

    const pick = (source: string) => source[randomIndex(source.length)];
    const seeded = [pick(upper), pick(lower), pick(numbers), pick(symbols)];

    while (seeded.length < Math.max(length, 8)) {
      seeded.push(pick(all));
    }

    for (let index = seeded.length - 1; index > 0; index -= 1) {
      const swapIndex = randomIndex(index + 1);
      [seeded[index], seeded[swapIndex]] = [seeded[swapIndex], seeded[index]];
    }

    return seeded.join("");
  };

  const handleGeneratePassword = () => {
    const generated = generatePassword();
    setValue("password", generated, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setIsPasswordCopied(false);
    setShowPassword(true);
    toast.success(t("passwordTools.generated"));
  };

  const handleCopyPassword = async () => {
    if (!passwordValue) {
      toast.error(t("passwordTools.empty"));
      return;
    }

    try {
      await navigator.clipboard.writeText(passwordValue);
      setIsPasswordCopied(true);
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }
      copyResetTimeoutRef.current = setTimeout(() => {
        setIsPasswordCopied(false);
      }, 1800);
      toast.success(t("passwordTools.copied"));
    } catch {
      toast.error(t("passwordTools.copyFailed"));
    }
  };

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  const handleSocialSignup = (provider: "google" | "facebook") => {
    toast.info(
      t("signup.socialSoon", { provider: t(`signup.social.${provider}`) }),
    );
  };

  return (
    <motion.main
      className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 sm:px-6 sm:py-10"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-(--border) bg-(--surface) shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-sm"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(29,185,84,0.42)_0%,rgba(29,185,84,0.16)_40%,rgba(29,185,84,0)_72%)] blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(var(--glow-neutral-rgb),0.18)_0%,rgba(var(--glow-neutral-rgb),0.06)_45%,rgba(var(--glow-neutral-rgb),0)_78%)] blur-3xl" />

        <div className="relative grid lg:grid-cols-[0.92fr_1.08fr]">
          <motion.section
            className={`border-b border-(--border) px-6 py-8 sm:px-8 lg:border-b-0 ${isRtl ? "lg:border-l" : "lg:border-r"}`}
            variants={itemVariants}
          >
            <div className="mb-4 inline-flex rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-(--text)">
              {t("signup.badge")}
            </div>
            <h1 className="bg-linear-to-r from-(--gd-primary) to-(--gd-secondary) bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
              {t("signup.title")}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-(--text)">
              {t("signup.subtitle", { language: languageLabel })}
            </p>

            <div className="mt-7 grid gap-3 rounded-2xl border border-(--border) bg-(--surface-muted) p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--text)">
                {t("signup.organizeTitle")}
              </p>
              <p className="text-sm leading-6 text-(--text)">
                {t("signup.helper")}
              </p>
            </div>

            <div className="grid gap-3  mt-3">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-(--text)">
                <span className="h-px flex-1 bg-(--border)" />
                <span>{t("signup.socialDivider")}</span>
                <span className="h-px flex-1 bg-(--border)" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleSocialSignup("google")}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-(--border) bg-(--surface-soft) px-4 py-3 text-sm font-medium text-(--text-h) transition-colors hover:bg-(--surface-soft-hover)"
                >
                  <HugeiconsIcon icon={GoogleIcon} size={18} />
                  <span>{t("signup.social.google")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialSignup("facebook")}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-(--border) bg-(--surface-soft) px-4 py-3 text-sm font-medium text-(--text-h) transition-colors hover:bg-(--surface-soft-hover)"
                >
                  <HugeiconsIcon icon={Facebook01Icon} size={18} />
                  <span>{t("signup.social.facebook")}</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-(--text)">
                <span className="h-px flex-1 bg-(--border)" />
              </div>

              <div className="rounded-2xl border border-(--border) bg-(--surface-muted) px-4 py-3 text-center text-sm text-(--text) sm:px-5">
                {t("signup.haveAccount")}{" "}
                <Link
                  to={`/${language}/login`}
                  className="font-semibold text-(--gd-primary) hover:underline"
                >
                  {t("signup.loginCta")}
                </Link>
              </div>
            </div>
          </motion.section>

          <motion.form
            dir={direction}
            className="grid gap-5 px-6 py-8 sm:px-8"
            onSubmit={handleSubmit(onSubmit)}
            variants={authFormVariants}
          >
            <motion.section
              className="grid gap-4 rounded-2xl border border-(--border) bg-(--surface-muted) p-4 sm:p-5"
              variants={authFormSectionVariants}
            >
              <motion.h2 variants={authFormFieldItemVariants} className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text)">
                {t("signup.accountSection")}
              </motion.h2>
              <motion.div className="grid gap-4 sm:grid-cols-2" variants={authFormFieldGridVariants}>
                <motion.div variants={authFormFieldItemVariants}>
                  <FormInput
                    {...register("username")}
                    label={t("signup.username")}
                    placeholder={t("signup.usernamePlaceholder")}
                    autoComplete="username"
                    error={
                      errors.username
                        ? t(errors.username.message ?? "")
                        : undefined
                    }
                    success={Boolean(
                      touchedFields.username &&
                      !errors.username &&
                      usernameValue.trim().length > 0,
                    )}
                    successMessage={t("formInput.valid")}
                  />
                </motion.div>
                <motion.div variants={authFormFieldItemVariants}>
                  <FormInput
                    {...register("email")}
                    type="email"
                    label={t("signup.email")}
                    placeholder={t("signup.emailPlaceholder")}
                    autoComplete="email"
                    error={
                      errors.email ? t(errors.email.message ?? "") : undefined
                    }
                    success={Boolean(
                      touchedFields.email &&
                      !errors.email &&
                      emailValue.trim().length > 0,
                    )}
                    successMessage={t("formInput.valid")}
                  />
                </motion.div>
              </motion.div>
            </motion.section>

            <motion.section
              className="grid gap-4 rounded-2xl border border-(--border) bg-(--surface-muted) p-4 sm:p-5"
              variants={authFormSectionVariants}
            >
              <motion.h2 variants={authFormFieldItemVariants} className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text)">
                {t("signup.profileSection")}
              </motion.h2>
              <motion.div className="grid gap-4 sm:grid-cols-2" variants={authFormFieldGridVariants}>
                <motion.div variants={authFormFieldItemVariants}>
                  <FormInput
                    {...register("Fname")}
                    label={t("signup.firstName")}
                    placeholder={t("signup.firstNamePlaceholder")}
                    autoComplete="given-name"
                    error={
                      errors.Fname ? t(errors.Fname.message ?? "") : undefined
                    }
                    success={Boolean(
                      touchedFields.Fname &&
                      !errors.Fname &&
                      firstNameValue.trim().length > 0,
                    )}
                    successMessage={t("formInput.valid")}
                  />
                </motion.div>
                <motion.div variants={authFormFieldItemVariants}>
                  <FormInput
                    {...register("Lname")}
                    label={t("signup.lastName")}
                    placeholder={t("signup.lastNamePlaceholder")}
                    autoComplete="family-name"
                    error={
                      errors.Lname ? t(errors.Lname.message ?? "") : undefined
                    }
                    success={Boolean(
                      touchedFields.Lname &&
                      !errors.Lname &&
                      lastNameValue.trim().length > 0,
                    )}
                    successMessage={t("formInput.valid")}
                  />
                </motion.div>
              </motion.div>
            </motion.section>

            <motion.section
              className="grid gap-4 rounded-2xl border border-(--border) bg-(--surface-muted) p-4 sm:p-5"
              variants={authFormSectionVariants}
            >
              <motion.div variants={authFormFieldItemVariants} className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text)">
                  {t("signup.securitySection")}
                </h2>
                <PasswordActions
                  onGenerate={handleGeneratePassword}
                  onCopy={handleCopyPassword}
                  generateLabel={t("passwordTools.generate")}
                  copyLabel={t("passwordTools.copy")}
                  copiedLabel={t("passwordTools.copiedState")}
                  copied={isPasswordCopied}
                  generateAriaLabel={t("passwordTools.generateAria")}
                  copyAriaLabel={t("passwordTools.copyAria")}
                  copyDisabled={!passwordValue}
                />
              </motion.div>

              <motion.div variants={authFormFieldItemVariants}>
                <FormInput
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  dir={direction}
                  className={direction === "rtl" ? "pl-11" : "pr-11"}
                  label={t("signup.password")}
                  placeholder={t("signup.passwordPlaceholder")}
                  autoComplete="new-password"
                  error={
                    errors.password ? t(errors.password.message ?? "") : undefined
                  }
                  success={Boolean(
                    touchedFields.password &&
                    !errors.password &&
                    passwordValue.trim().length > 0,
                  )}
                  successMessage={t("formInput.valid")}
                  rightAdornment={
                    <PasswordVisibilityToggle
                      visible={showPassword}
                      onToggle={() => setShowPassword((prev) => !prev)}
                      showLabel={t("passwordToggle.show")}
                      hideLabel={t("passwordToggle.hide")}
                    />
                  }
                />
              </motion.div>

              <motion.div variants={authFormFieldItemVariants}>
                <PasswordStrengthSubmit
                  password={passwordValue}
                  submitLabel={t("signup.submit")}
                  isSubmitting={isSubmitting}
                />
              </motion.div>
            </motion.section>
          </motion.form>
        </div>
      </motion.div>
    </motion.main>
  );
}

export default SignupPage;
