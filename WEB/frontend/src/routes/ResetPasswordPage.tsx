import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  useNavigate,
  useParams,
  useSearchParams,
  Link,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import {
  authFormFieldItemVariants,
  authFormSectionVariants,
  authFormVariants,
  createPageVariants,
} from "../libs/motionVariants";
import { apiPost } from "../utils/api";
import { getBackendResponseMessage, type BackendResponseError } from "../utils/backendResponseMessage";
import { resetPasswordSchema } from "../types/validationSchemas";
import { useResendCooldown } from "../hooks/useResendCooldown";
import { z } from "zod";
import PasswordVisibilityToggle from "../components/ui/passwordVisibilityToggle";
import PasswordStrength from "../components/ui/passwordStrength";
import PasswordActions from "../components/ui/passwordActions";
import FormInput from "../components/ui/Input";

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordPage() {
  const { language, direction } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? undefined;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isPasswordCopied, setIsPasswordCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const pageVariants = createPageVariants(direction);
  const isRtl = direction === "rtl";
  const { isCoolingDown, cooldownLabel, startCooldown } = useResendCooldown(
    email ? `reset-resend:${email.toLowerCase()}` : "reset-resend:anonymous",
    60,
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, touchedFields },
  } = useForm<ResetPasswordFormValues>({
    mode: "onTouched",
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = useWatch({ control, name: "password" }) ?? "";
  const confirmPasswordValue =
    useWatch({ control, name: "confirmPassword" }) ?? "";

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
      toast.success(t("passwordTools.copied"));
    } catch {
      toast.error(t("passwordTools.copyFailed"));
    }
  };

  const onResendResetLink = async () => {
    if (!email) {
      toast.error(t("reset.missingEmail"));
      return;
    }

    if (isCoolingDown || isResending) {
      return;
    }

    setIsResending(true);

    try {
      const { response, data } = await apiPost<BackendResponseError>(
        "/auth/resend-reset-password",
        {},
        { json: { email }, authRetry: false },
      );

      if (!response.ok) {
        toast.error(
          getBackendResponseMessage(response, data, {
            fallbackKey: 'reset.resendFailed',
            translate: t,
            locale: language === 'ar' ? 'ar-EG' : 'en-US',
          }),
        );
        return;
      }

      startCooldown();
      toast.success(t("reset.resendSuccess"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("reset.resendFailed"),
      );
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      toast.error(t("reset.invalidToken"));
      return;
    }

    setIsSubmitting(true);

    try {
      const { response, data } = await apiPost<BackendResponseError>(
        `/auth/reset-password/${token}`,
        {},
        { json: { password: values.password }, authRetry: false },
      );

      if (!response.ok) {
        toast.error(
          getBackendResponseMessage(response, data, {
            fallbackKey: 'reset.failed',
            translate: t,
            locale: language === 'ar' ? 'ar-EG' : 'en-US',
          }),
        );
        return;
      }

      toast.info(t("reset.success"));
      navigate(`/${language}/login`, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("reset.failed"));
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
              {t("reset.badge")}
            </div>
            <h1 className="bg-linear-to-r from-(--gd-primary) to-(--gd-secondary) bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
              {t("reset.title")}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-(--text)">
              {t("reset.subtitle")}
            </p>


                          <div className="mt-4 grid gap-3 rounded-2xl border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text)">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl  px-4 py-3">
                  <div>
                    <p className="font-medium text-(--text-h)">
                      {t("reset.resendTitle")}
                    </p>
                    <p className="text-xs text-(--text)">
                      {email
                        ? isCoolingDown
                          ? t("reset.resendWait", { time: cooldownLabel })
                          : t("reset.resendPrompt")
                        : t("reset.missingEmailHint")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onResendResetLink}
                    disabled={!email || isCoolingDown || isResending}
                    className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-(--gd-primary) px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isResending ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      t("reset.resendButton")
                    )}
                  </button>
                </div>
              </div>


            <div className="flex mt-3 items-center gap-3 text-xs uppercase tracking-[0.16em] text-(--text)">
              <span className="h-px flex-1 bg-(--border)" />
            </div>
            <div className="rounded-2xl mt-3 border border-(--border) bg-(--surface-muted) px-4 py-3 text-center text-sm text-(--text) sm:px-5">
              {t("signup.haveAccount")}{" "}
              <Link
                to={`/${language}/login`}
                className="font-semibold text-(--gd-primary) hover:underline"
              >
                {t("signup.loginCta")}
              </Link>
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
              <motion.h2
                variants={authFormFieldItemVariants}
                className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text)"
              >
                {t("reset.sectionTitle")}
              </motion.h2>

              <motion.div
                variants={authFormFieldItemVariants}
                className="flex justify-start"
              >
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
                  label={t("reset.password")}
                  placeholder={t("reset.passwordPlaceholder")}
                  autoComplete="new-password"
                  error={
                    errors.password
                      ? t(errors.password.message ?? "")
                      : undefined
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
                <p className="text-sm leading-6 text-(--text)">
                  {t("reset.strengthHint")}
                </p>
              </motion.div>

              <motion.div variants={authFormFieldItemVariants}>
                <PasswordStrength
                  password={passwordValue}
                  submitLabel={t("reset.submit")}
                  isSubmitting={isSubmitting}
                  showSubmitButton={false}
                />
              </motion.div>

              <motion.div variants={authFormFieldItemVariants}>
                <FormInput
                  {...register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  dir={direction}
                  className={direction === "rtl" ? "pl-11" : "pr-11"}
                  label={t("reset.confirmPassword")}
                  placeholder={t("reset.confirmPasswordPlaceholder")}
                  autoComplete="new-password"
                  error={
                    errors.confirmPassword
                      ? t(errors.confirmPassword.message ?? "")
                      : undefined
                  }
                  success={Boolean(
                    touchedFields.confirmPassword &&
                    !errors.confirmPassword &&
                    confirmPasswordValue.trim().length > 0 &&
                    passwordValue === confirmPasswordValue,
                  )}
                  successMessage={t("formInput.valid")}
                  rightAdornment={
                    <PasswordVisibilityToggle
                      visible={showConfirmPassword}
                      onToggle={() => setShowConfirmPassword((prev) => !prev)}
                      showLabel={t("passwordToggle.show")}
                      hideLabel={t("passwordToggle.hide")}
                    />
                  }
                />
              </motion.div>

              <motion.div
                variants={authFormFieldItemVariants}
                className="flex flex-wrap gap-3 pt-2"
              >
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-2xl bg-(--gd-primary) px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(29,185,84,0.2)] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    t("reset.submit")
                  )}
                </button>
              </motion.div>
            </motion.section>
          </motion.form>
        </div>
      </motion.div>
    </motion.main>
  );
}

export default ResetPasswordPage;
