import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Delete02Icon,
  Login03Icon,
  Copy01Icon,
  EyeIcon,
  ToggleOnIcon,
  ToggleOffIcon,
  GithubIcon,
  GitlabIcon,
  Linkedin02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import FormInput from "../ui/Input";
import { authQueryKey } from "../../libs/react-query";
import {
  confirmAccountDeletionUndo,
  confirmCurrentUserAccountDeletion,
  deactivateCurrentUserAccount,
  requestAccountDeletionUndo,
  requestCurrentUserAccountDeletion,
  updateCurrentUserPassword,
  updateCurrentUserProfile,
} from "../../libs/user-api";
import type { AuthUser } from "../../utils/route-utils";
import { clearAccessToken } from "../../utils/api";
import { useLanguage } from "../../context/LanguageContext";
import PasswordActions from "../ui/passwordActions";
import PasswordStrength from "../ui/passwordStrength";
import PasswordVisibilityToggle from "../ui/passwordVisibilityToggle";
import { generateStrongPassword } from "../../utils/passwordGenerator";
import {
  resetPasswordSchema,
  signupSchema,
} from "../../types/validationSchemas";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";

type ProfileSettingsPanelProps = {
  user: AuthUser;
  variants?: Variants;
  cacheQueryKey?: readonly unknown[];
};

const profileSettingsSchema = signupSchema.pick({
  username: true,
  Fname: true,
  Lname: true,
}).extend({
  githubUrl: z.string().trim().optional(),
  linkedInUrl: z.string().trim().optional(),
  gitLabUrl: z.string().trim().optional(),
  xUrl: z.string().trim().optional(),
});
const passwordSettingsSchema = resetPasswordSchema.extend({
  currentPassword: signupSchema.shape.password,
});

export default function ProfileSettingsPanel({
  user,
  variants,
  cacheQueryKey = authQueryKey,
}: ProfileSettingsPanelProps) {
  const { t } = useTranslation();
  const { language, direction } = useLanguage();
  const sideClass = direction === "rtl" ? "left-0" : "right-0";
  const paddingClass = direction === "rtl" ? "pl-11" : "pr-11";

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: liveUser } = useQuery<AuthUser>({
    queryKey: authQueryKey,
    initialData: user,
    staleTime: Infinity,
  });

  const currentUser = liveUser ?? user;

  const [profileForm, setProfileForm] = useState({
    username: user.username,
    Fname: user.Fname ?? user.name.split(" ")[0] ?? "",
    Lname: user.Lname ?? user.name.split(" ").slice(1).join(" ") ?? "",
    githubUrl: user.githubUrl ?? "",
    linkedInUrl: user.linkedInUrl ?? "",
    gitLabUrl: user.gitLabUrl ?? "",
    xUrl: user.xUrl ?? "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {},
  );
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [isPasswordCopied, setIsPasswordCopied] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isDeleteCodeSent, setIsDeleteCodeSent] = useState(false);
  const [isUndoCodeSent, setIsUndoCodeSent] = useState(false);
  const [accountForm, setAccountForm] = useState({
    password: "",
    reason: "",
    deleteCode: "",
    undoCode: "",
  });
  const savedProfileForm = {
    username: user.username,
    Fname: user.Fname ?? user.name.split(" ")[0] ?? "",
    Lname: user.Lname ?? user.name.split(" ").slice(1).join(" ") ?? "",
    githubUrl: user.githubUrl ?? "",
    linkedInUrl: user.linkedInUrl ?? "",
    gitLabUrl: user.gitLabUrl ?? "",
    xUrl: user.xUrl ?? "",
  };

  const profileMutation = useMutation({
    mutationFn: updateCurrentUserProfile,
    onSuccess: async (updatedUser) => {
      setProfileForm({
        username: updatedUser.username,
        Fname: updatedUser.Fname ?? updatedUser.name.split(" ")[0] ?? "",
        Lname:
          updatedUser.Lname ??
          updatedUser.name.split(" ").slice(1).join(" ") ??
          "",
        githubUrl: updatedUser.githubUrl ?? "",
        linkedInUrl: updatedUser.linkedInUrl ?? "",
        gitLabUrl: updatedUser.gitLabUrl ?? "",
        xUrl: updatedUser.xUrl ?? "",
      });
      queryClient.setQueryData(cacheQueryKey, updatedUser);
      queryClient.setQueryData(authQueryKey, updatedUser);
      await queryClient.invalidateQueries({ queryKey: authQueryKey });
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
      setIsEditingProfile(false);
      toast.success(t("profile.settings.profileSaved"));
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : t("profile.settings.profileFailed"),
      );
    },
  });

  const passwordMutation = useMutation({
    mutationFn: updateCurrentUserPassword,
    onSuccess: () => {
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success(t("profile.settings.passwordSaved"));
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : t("profile.settings.passwordFailed"),
      );
    },
  });

  const deactivateAccountMutation = useMutation({
    mutationFn: deactivateCurrentUserAccount,
    onSuccess: () => {
      clearAccessToken();
      queryClient.setQueryData(authQueryKey, null);
      toast.success(
        t(
          "profile.accountControl.deactivateAccount.deactivated",
          "Account deactivated. Log in with your password to reactivate it.",
        ),
      );
      navigate(`/${language}/login`, { replace: true });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
            "profile.accountControl.deactivateAccount.deactivateFailed",
            "Could not deactivate account.",
          ),
      );
    },
  });

  const requestDeleteMutation = useMutation({
    mutationFn: requestCurrentUserAccountDeletion,
    onSuccess: () => {
      setIsDeleteCodeSent(true);
      toast.success(
        t(
          "profile.accountControl.deactivateAccount.deleteCodeSent",
          "Deletion code sent to your email.",
        ),
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
            "profile.accountControl.deactivateAccount.deleteRequestFailed",
            "Could not send deletion code.",
          ),
      );
    },
  });

  const confirmDeleteMutation = useMutation({
    mutationFn: confirmCurrentUserAccountDeletion,
    onSuccess: (result) => {
      if (result.user) {
        queryClient.setQueryData(authQueryKey, result.user);
        queryClient.setQueryData(cacheQueryKey, result.user);
      }
      setIsDeleteCodeSent(false);
      setAccountForm((current) => ({
        ...current,
        password: "",
        deleteCode: "",
      }));
      toast.success(t("profile.accountControl.deleteAccount.deleteScheduled"));
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
            "profile.accountControl.deleteAccount.deleteConfirmFailed",
            "Could not confirm deletion.",
          ),
      );
    },
  });

  const requestUndoMutation = useMutation({
    mutationFn: requestAccountDeletionUndo,
    onSuccess: () => {
      setIsUndoCodeSent(true);
      toast.success(
        t(
          "profile.accountControl.deactivateAccount.undoCodeSent",
          "Undo code sent to your email.",
        ),
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
            "profile.accountControl.deactivateAccount.undoRequestFailed",
            "Could not send undo code.",
          ),
      );
    },
  });

  const confirmUndoMutation = useMutation({
    mutationFn: confirmAccountDeletionUndo,
    onSuccess: async () => {
      setIsUndoCodeSent(false);
      setAccountForm((current) => ({ ...current, password: "", undoCode: "" }));
      await queryClient.invalidateQueries({ queryKey: authQueryKey });
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "summary"],
      });
      toast.success(t("profile.accountControl.deleteAccount.deleteCanceled"));
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : t("profile.accountControl.deleteAccount.undoConfirmFailed"),
      );
    },
  });

  const profileValidation = profileSettingsSchema.safeParse(profileForm);
  const passwordValidation = passwordSettingsSchema.safeParse({
    currentPassword: passwordForm.currentPassword,
    password: passwordForm.newPassword,
    confirmPassword: passwordForm.confirmPassword,
  });
  const profileErrors = profileValidation.success
    ? {}
    : Object.fromEntries(
      profileValidation.error.issues.map((issue) => [
        issue.path[0],
        t(issue.message),
      ]),
    );
  const passwordErrors = passwordValidation.success
    ? {}
    : Object.fromEntries(
      passwordValidation.error.issues.map((issue) => [
        issue.path[0],
        t(issue.message),
      ]),
    );

  const markTouched = (field: string) => {
    setTouchedFields((current) => ({ ...current, [field]: true }));
  };

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword();
    setPasswordForm((current) => ({
      ...current,
      newPassword: generated,
      confirmPassword: generated,
    }));
    setTouchedFields((current) => ({
      ...current,
      password: true,
      confirmPassword: true,
    }));
    setIsPasswordCopied(false);
    toast.success(t("passwordTools.generated"));
  };

  const handleCopyPassword = async () => {
    if (!passwordForm.newPassword) {
      toast.info(t("passwordTools.empty"));
      return;
    }

    try {
      await navigator.clipboard.writeText(passwordForm.newPassword);
      setIsPasswordCopied(true);
      toast.success(t("passwordTools.copied"));
    } catch {
      toast.error(t("passwordTools.copyFailed"));
    }
  };

  const scheduledDeletionDate = user.accountDeletion?.scheduledFor
    ? new Date(user.accountDeletion.scheduledFor).toLocaleString()
    : null;
  const isDeletionScheduled = user.accountDeletion?.status === "scheduled";
  const isAccountActionPending =
    deactivateAccountMutation.isPending ||
    requestDeleteMutation.isPending ||
    confirmDeleteMutation.isPending ||
    requestUndoMutation.isPending ||
    confirmUndoMutation.isPending;

  // Delecte acc toast
  const requireAccountPassword = () => {
    if (accountForm.password.trim().length < 8) {
      toast.error(t("profile.accountControl.deleteAccount.passwordRequired"));
      return false;
    }

    return true;
  };

  return (
    <motion.section
      variants={variants}
      className="grid gap-5 w-full xl:grid-cols-[1fr_1.1fr_1fr] items-stretch"
    >
      <form
        className="flex flex-col justify-between h-full rounded-4xl border border-(--border) bg-(--surface) p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();

          if (!isEditingProfile) {
            setIsEditingProfile(true);
            return;
          }

          if (!profileValidation.success) {
            setTouchedFields((current) => ({
              ...current,
              username: true,
              Fname: true,
              Lname: true,
            }));
            toast.error(
              t(
                profileValidation.error.issues[0]?.message ??
                "auth.validationFailed",
              ),
            );
            return;
          }

          profileMutation.mutate({
            username: profileForm.username.trim(),
            Fname: profileForm.Fname.trim(),
            Lname: profileForm.Lname.trim(),
            githubUrl: profileForm.githubUrl.trim(),
            linkedInUrl: profileForm.linkedInUrl.trim(),
            gitLabUrl: profileForm.gitLabUrl.trim(),
            xUrl: profileForm.xUrl.trim(),
          });
        }}
      >
        <div className="flex-1 flex flex-col gap-4 mb-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-(--text-h)">
                {t("profile.settings.profileTitle")}
              </h2>
              <p className="mt-1 text-sm leading-6 text-(--text)">
                {t("profile.settings.profileSubtitle")}
              </p>
            </div>
            {isEditingProfile && (
              <button
                type="button"
                onClick={() => {
                  setProfileForm(savedProfileForm);
                  setTouchedFields((current) => ({
                    ...current,
                    username: false,
                    Fname: false,
                    Lname: false,
                    githubUrl: false,
                    linkedInUrl: false,
                    gitLabUrl: false,
                    xUrl: false,
                  }));
                  setIsEditingProfile(false);
                }}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-squircle border border-[rgba(226,33,52,0.45)] bg-[rgba(226,33,52,0.08)] text-(--error) transition hover:bg-[rgba(226,33,52,0.14)] cursor-pointer"
                title={t("common.cancel", "Cancel")}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            )}
          </div>
          <FormInput
            label={t("profile.username")}
            value={profileForm.username}
            disabled={!isEditingProfile}
            onChange={(event) =>
              setProfileForm((current) => ({
                ...current,
                username: event.target.value,
              }))
            }
            onBlur={() => markTouched("username")}
            autoComplete="username"
            className={!isEditingProfile ? "bg-(--surface-2) text-(--text)!" : ""}
            error={
              touchedFields.username && profileErrors.username
                ? String(profileErrors.username)
                : undefined
            }
            success={Boolean(
              touchedFields.username &&
              !profileErrors.username &&
              profileForm.username.trim(),
            )}
            successMessage={t("formInput.valid")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label={t("signup.firstName")}
              value={profileForm.Fname}
              disabled={!isEditingProfile}
              onChange={(event) =>
                setProfileForm((current) => ({
                  ...current,
                  Fname: event.target.value,
                }))
              }
              onBlur={() => markTouched("Fname")}
              autoComplete="given-name"
              className={
                !isEditingProfile ? "bg-(--surface-2) text-(--text)!" : ""
              }
              error={
                touchedFields.Fname && profileErrors.Fname
                  ? String(profileErrors.Fname)
                  : undefined
              }
              success={Boolean(
                touchedFields.Fname &&
                !profileErrors.Fname &&
                profileForm.Fname.trim(),
              )}
              successMessage={t("formInput.valid")}
            />
            <FormInput
              label={t("signup.lastName")}
              value={profileForm.Lname}
              disabled={!isEditingProfile}
              onChange={(event) =>
                setProfileForm((current) => ({
                  ...current,
                  Lname: event.target.value,
                }))
              }
              onBlur={() => markTouched("Lname")}
              autoComplete="family-name"
              className={
                !isEditingProfile ? "bg-(--surface-2) text-(--text)!" : ""
              }
              error={
                touchedFields.Lname && profileErrors.Lname
                  ? String(profileErrors.Lname)
                  : undefined
              }
              success={Boolean(
                touchedFields.Lname &&
                !profileErrors.Lname &&
                profileForm.Lname.trim(),
              )}
              successMessage={t("formInput.valid")}
            />
          </div>

          {/* Social URL Inputs */}
          <div className="grid gap-4">
            <FormInput
              type="text"
              id="githubUrl"
              label={t("profile.settings.githubUrl", "GitHub URL")}
              placeholder="e.g. github.com/username"
              value={profileForm.githubUrl}
              onChange={(event) =>
                setProfileForm((current) => ({
                  ...current,
                  githubUrl: event.target.value,
                }))
              }
              disabled={!isEditingProfile || profileMutation.isPending}
              className={`${paddingClass} ${!isEditingProfile ? "bg-(--surface-2) text-(--text)!" : ""}`}
              rightAdornment={
                <span className={`absolute inset-y-0 ${sideClass} pointer-events-none grid place-items-center px-4 text-(--text)`}>
                  <HugeiconsIcon icon={GithubIcon} size={18} />
                </span>
              }
            />
            <FormInput
              type="text"
              id="linkedInUrl"
              label={t("profile.settings.linkedInUrl", "LinkedIn URL")}
              placeholder="e.g. linkedin.com/in/username"
              value={profileForm.linkedInUrl}
              onChange={(event) =>
                setProfileForm((current) => ({
                  ...current,
                  linkedInUrl: event.target.value,
                }))
              }
              disabled={!isEditingProfile || profileMutation.isPending}
              className={`${paddingClass} ${!isEditingProfile ? "bg-(--surface-2) text-(--text)!" : ""}`}
              rightAdornment={
                <span className={`absolute inset-y-0 ${sideClass} pointer-events-none grid place-items-center px-4 text-(--text)`}>
                  <HugeiconsIcon icon={Linkedin02Icon} size={18} />
                </span>
              }
            />
            <FormInput
              type="text"
              id="gitLabUrl"
              label={t("profile.settings.gitLabUrl", "GitLab URL")}
              placeholder="e.g. gitlab.com/username"
              value={profileForm.gitLabUrl}
              onChange={(event) =>
                setProfileForm((current) => ({
                  ...current,
                  gitLabUrl: event.target.value,
                }))
              }
              disabled={!isEditingProfile || profileMutation.isPending}
              className={`${paddingClass} ${!isEditingProfile ? "bg-(--surface-2) text-(--text)!" : ""}`}
              rightAdornment={
                <span className={`absolute inset-y-0 ${sideClass} pointer-events-none grid place-items-center px-4 text-(--text)`}>
                  <HugeiconsIcon icon={GitlabIcon} size={18} />
                </span>
              }
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={profileMutation.isPending}
          className="rounded-squircle bg-(--gd-primary) px-4 py-3 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover) disabled:cursor-not-allowed disabled:opacity-60"
        >
          {profileMutation.isPending
            ? t("profile.settings.saving")
            : isEditingProfile
              ? t("profile.settings.updateProfile", "Update profile")
              : t("profile.settings.editProfile", "Edit profile")}
        </button>
      </form>

      <form
        className="flex flex-col justify-between h-full rounded-4xl border border-(--border) bg-(--surface) p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();

          if (!passwordValidation.success) {
            setTouchedFields((current) => ({
              ...current,
              currentPassword: true,
              password: true,
              confirmPassword: true,
            }));
            toast.error(
              t(
                passwordValidation.error.issues[0]?.message ??
                "auth.validationFailed",
              ),
            );
            return;
          }

          passwordMutation.mutate({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          });
        }}
      >
        <div className="flex-1 flex flex-col gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-(--text-h)">
              {t("profile.settings.passwordTitle")}
            </h2>
            <p className="text-sm leading-6 text-(--text)">
              {t("profile.settings.passwordSubtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text)">
              {t("signup.securitySection")}
            </span>
            <PasswordActions
              onGenerate={handleGeneratePassword}
              onCopy={handleCopyPassword}
              generateLabel={t("passwordTools.generate")}
              copyLabel={t("passwordTools.copy")}
              copiedLabel={t("passwordTools.copiedState")}
              copied={isPasswordCopied}
              generateAriaLabel={t("passwordTools.generateAria")}
              copyAriaLabel={t("passwordTools.copyAria")}
              copyDisabled={!passwordForm.newPassword}
            />
          </div>
          <FormInput
            label={t("profile.settings.currentPassword")}
            value={passwordForm.currentPassword}
            onChange={(event) =>
              setPasswordForm((current) => ({
                ...current,
                currentPassword: event.target.value,
              }))
            }
            onBlur={() => markTouched("currentPassword")}
            type={showCurrentPassword ? "text" : "password"}
            autoComplete="current-password"
            error={
              touchedFields.currentPassword && passwordErrors.currentPassword
                ? String(passwordErrors.currentPassword)
                : undefined
            }
            rightAdornment={
              <PasswordVisibilityToggle
                visible={showCurrentPassword}
                onToggle={() => setShowCurrentPassword((current) => !current)}
                showLabel={t("passwordToggle.show")}
                hideLabel={t("passwordToggle.hide")}
              />
            }
            className="pr-11"
          />
          <FormInput
            label={t("profile.settings.newPassword")}
            value={passwordForm.newPassword}
            onChange={(event) => {
              setPasswordForm((current) => ({
                ...current,
                newPassword: event.target.value,
              }));
              setIsPasswordCopied(false);
            }}
            onBlur={() => markTouched("password")}
            type={showNewPassword ? "text" : "password"}
            autoComplete="new-password"
            error={
              touchedFields.password && passwordErrors.password
                ? String(passwordErrors.password)
                : undefined
            }
            success={Boolean(
              touchedFields.password &&
              !passwordErrors.password &&
              passwordForm.newPassword,
            )}
            successMessage={t("formInput.valid")}
            rightAdornment={
              <PasswordVisibilityToggle
                visible={showNewPassword}
                onToggle={() => setShowNewPassword((current) => !current)}
                showLabel={t("passwordToggle.show")}
                hideLabel={t("passwordToggle.hide")}
              />
            }
            className="pr-11"
          />
          <FormInput
            label={t("reset.confirmPassword")}
            value={passwordForm.confirmPassword}
            onChange={(event) =>
              setPasswordForm((current) => ({
                ...current,
                confirmPassword: event.target.value,
              }))
            }
            onBlur={() => markTouched("confirmPassword")}
            type={showNewPassword ? "text" : "password"}
            autoComplete="new-password"
            error={
              touchedFields.confirmPassword && passwordErrors.confirmPassword
                ? String(passwordErrors.confirmPassword)
                : undefined
            }
            success={Boolean(
              touchedFields.confirmPassword &&
              !passwordErrors.confirmPassword &&
              passwordForm.confirmPassword,
            )}
          />
        </div>

        <PasswordStrength
          password={passwordForm.newPassword}
          submitLabel={t("profile.settings.savePassword")}
          isSubmitting={passwordMutation.isPending}
        />
      </form>

      <PublicProfileSharingCard user={currentUser} />

      {/* ROW 2: Deactivate & Delete */}
      <section className="grid gap-5 rounded-4xl border border-[rgba(226,33,52,0.35)] bg-(--surface) p-5 sm:p-6 xl:col-span-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold uppercase tracking-[0.18em] text-(--error)">
              {t("profile.accountControl.sectionLabel")}
            </h3>
            <h4 className="mt-2 text-md font-semibold text-(--text-h)">
              {t("profile.accountControl.title")}
            </h4>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-(--text)">
              {isDeletionScheduled
                ? t("profile.accountControl.scheduledText", {
                  date: scheduledDeletionDate,
                  defaultValue: `Deletion is scheduled for ${scheduledDeletionDate}. You can undo it before that date with an email code.`,
                })
                : t("profile.accountControl.description")}
            </p>
          </div>
          <span className="grid size-11 place-items-center rounded-squircle border border-[rgba(226,33,52,0.35)] bg-[rgba(226,33,52,0.08)] text-(--error)">
            <HugeiconsIcon icon={Alert02Icon} size={22} />
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="grid gap-4 rounded-2xl border border-(--border) bg-(--surface-muted) p-4">
            <FormInput
              label={t(
                "profile.accountControl.deactivateAccount.passwordLabel",
              )}
              value={accountForm.password}
              placeholder={t(
                "profile.accountControl.deactivateAccount.passwordPlaceholder",
              )}
              onChange={(event) =>
                setAccountForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              type={showAccountPassword ? "text" : "password"}
              autoComplete="current-password"
              rightAdornment={
                <PasswordVisibilityToggle
                  visible={showAccountPassword}
                  onToggle={() => setShowAccountPassword((current) => !current)}
                  showLabel={t("passwordToggle.show")}
                  hideLabel={t("passwordToggle.hide")}
                />
              }
              className="pr-11"
            />
            <label className="grid gap-2 text-sm font-semibold text-(--text-h)">
              {t("profile.accountControl.deactivateAccount.reasonLabel")}
              <textarea
                value={accountForm.reason}
                maxLength={500}
                rows={4}
                onChange={(event) =>
                  setAccountForm((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
                placeholder={t(
                  "profile.accountControl.deactivateAccount.reasonPlaceholder",
                )}
                className="min-h-28 resize-y rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none transition focus:border-(--accent-border)"
              />
              <span className="text-xs font-medium text-(--text)">
                {accountForm.reason.length}/500
              </span>
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={isAccountActionPending || isDeletionScheduled}
                onClick={() => {
                  if (!requireAccountPassword()) return;
                  deactivateAccountMutation.mutate({
                    password: accountForm.password,
                    reason: accountForm.reason.trim() || undefined,
                  });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-squircle border border-(--border) px-4 py-3 text-sm font-semibold text-(--text-h) transition hover:bg-(--surface-2) disabled:cursor-not-allowed disabled:opacity-60"
              >
                <HugeiconsIcon icon={Login03Icon} size={16} />
                {t("profile.accountControl.deactivateAccount.deactivate")}
              </button>
              <button
                type="button"
                disabled={isAccountActionPending || isDeletionScheduled}
                onClick={() => {
                  if (!requireAccountPassword()) return;
                  requestDeleteMutation.mutate({
                    password: accountForm.password,
                    reason: accountForm.reason.trim() || undefined,
                  });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-squircle border border-[rgba(226,33,52,0.45)] bg-[rgba(226,33,52,0.08)] px-4 py-3 text-sm font-semibold text-(--error) transition hover:bg-[rgba(226,33,52,0.14)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} />
                {t("profile.accountControl.deactivateAccount.confirmDelete")}
              </button>
            </div>
          </div>

          <div className="grid gap-4 rounded-2xl border border-(--border) bg-(--surface-muted) p-4">
            {isDeletionScheduled ? (
              <>
                <div className="rounded-2xl border border-(--accent-border) bg-(--accent-bg) p-4">
                  <h3 className="font-semibold text-(--text-h)">
                    {t("profile.accountControl.deactivateAccount.undoTitle")}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-(--text)">
                    {t("profile.accountControl.deactivateAccount.undoSubtitle")}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isAccountActionPending}
                  onClick={() => {
                    if (!requireAccountPassword()) return;
                    requestUndoMutation.mutate({
                      identifier: user.email,
                      password: accountForm.password,
                    });
                  }}
                  className="rounded-squircle border border-(--accent-border) px-4 py-3 text-sm font-semibold text-(--text-h) transition hover:bg-(--accent-bg) disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("profile.accountControl.deactivateAccount.sendUndoCode")}
                </button>
                {isUndoCodeSent ? (
                  <div className="grid gap-3">
                    <FormInput
                      label={t(
                        "profile.accountControl.deactivateAccount.undoCode",
                      )}
                      value={accountForm.undoCode}
                      onChange={(event) =>
                        setAccountForm((current) => ({
                          ...current,
                          undoCode: event.target.value.toUpperCase(),
                        }))
                      }
                      maxLength={8}
                      autoComplete="one-time-code"
                    />
                    <button
                      type="button"
                      disabled={
                        confirmUndoMutation.isPending ||
                        !/^[A-Z0-9]{8}$/.test(accountForm.undoCode)
                      }
                      onClick={() =>
                        confirmUndoMutation.mutate({
                          code: accountForm.undoCode,
                        })
                      }
                      className="rounded-squircle bg-(--gd-primary) px-4 py-3 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover) disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t("profile.accountControl.deleteAccount.confirmUndo")}
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div className="rounded-2xl border border-[rgba(226,33,52,0.35)] bg-[rgba(226,33,52,0.08)] p-4">
                  <h3 className="font-semibold text-(--text-h)">
                    {t(
                      "profile.accountControl.deactivateAccount.confirmDeleteTitle",
                    )}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-(--text)">
                    {t(
                      "profile.accountControl.deactivateAccount.confirmDeleteSubtitle",
                    )}
                  </p>
                </div>
                {isDeleteCodeSent ? (
                  <div className="grid gap-3">
                    <FormInput
                      label={t(
                        "profile.accountControl.deactivateAccount.deleteCode",
                        "Delete code",
                      )}
                      value={accountForm.deleteCode}
                      onChange={(event) =>
                        setAccountForm((current) => ({
                          ...current,
                          deleteCode: event.target.value.toUpperCase(),
                        }))
                      }
                      maxLength={8}
                      autoComplete="one-time-code"
                    />
                    <button
                      type="button"
                      disabled={
                        confirmDeleteMutation.isPending ||
                        !/^[A-Z0-9]{8}$/.test(accountForm.deleteCode)
                      }
                      onClick={() =>
                        confirmDeleteMutation.mutate({
                          code: accountForm.deleteCode,
                        })
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-squircle bg-(--error) px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={16} />
                      {t(
                        "profile.accountControl.deactivateAccount.confirmDeleteTitle",
                      )}
                    </button>
                  </div>
                ) : (
                  <p className="rounded-2xl border border-(--border) bg-(--surface-2) p-4 text-sm leading-6 text-(--text)">
                    {t(
                      "profile.accountControl.deactivateAccount.waitingForCode",
                      "Send a delete code first. The code expires after 15 minutes.",
                    )}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </motion.section>
  );
}

function PublicProfileSharingCard({ user }: { user: AuthUser }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const visibility = user.profileVisibility ?? "public";
  const isPublic = visibility === "public";

  const mutation = useMutation({
    mutationFn: (newVisibility: "public" | "private") =>
      updateCurrentUserProfile({
        username: user.username,
        Fname: user.Fname ?? user.name.split(" ")[0] ?? "",
        Lname: user.Lname ?? user.name.split(" ").slice(1).join(" ") ?? "",
        visibility: newVisibility,
        githubUrl: user.githubUrl,
        linkedInUrl: user.linkedInUrl,
        gitLabUrl: user.gitLabUrl,
        xUrl: user.xUrl,
      }),
    onSuccess: async (updatedUser, newVisibility) => {
      queryClient.setQueryData(authQueryKey, updatedUser);
      await queryClient.invalidateQueries({ queryKey: authQueryKey });
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
      toast.success(
        newVisibility === "public"
          ? t("profile.sharing.madePublic", "Profile is now public!")
          : t("profile.sharing.madePrivate", "Profile is now private!"),
      );
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : t("profile.sharing.error", "Could not update visibility."),
      );
    },
  });

  const handleToggle = () => {
    const nextVisibility = isPublic ? "private" : "public";
    mutation.mutate(nextVisibility);
  };

  const shareUrl = `${window.location.origin}/${language}/u/${user.username}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success(t("profile.sharing.copied", "Copied profile link!"));
  };

  const handlePreview = () => {
    window.open(`/${language}/u/${user.username}`, "_blank");
  };

  const animVariants = {
    hidden: { opacity: 0, height: 0, scale: 0.95, overflow: "hidden" },
    visible: {
      opacity: 1,
      height: "auto",
      scale: 1,
      transition: { duration: 0.25, ease: "easeOut" } as const,
    },
    exit: {
      opacity: 0,
      height: 0,
      scale: 0.95,
      overflow: "hidden",
      transition: { duration: 0.2, ease: "easeIn" } as const,
    },
  };

  return (
    <div className="flex flex-col justify-between h-full rounded-4xl border border-(--border) bg-(--surface) p-5 sm:p-6">
      <div className="flex-1 flex flex-col gap-4 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-(--text-h)">
            {t("profile.sharing.title", "Profile Visibility & Sharing")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-(--text)">
            {t(
              "profile.sharing.subtitle",
              "Choose whether your profile is public or private to others.",
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-squircle border border-(--border) bg-(--surface-2) p-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-(--text-h)">
              {isPublic
                ? t("profile.sharing.statusPublic", "Public Profile")
                : t("profile.sharing.statusPrivate", "Private Profile")}
            </p>
            <p className="mt-1 text-xs text-(--text) leading-relaxed">
              {isPublic
                ? t(
                  "profile.sharing.descPublic",
                  "Anyone with the link can view your skills and learning roadmap.",
                )
                : t(
                  "profile.sharing.descPrivate",
                  "Only you can view your profile details and learning progress.",
                )}
            </p>
          </div>

          <button
            type="button"
            disabled={mutation.isPending}
            onClick={handleToggle}
            className="cursor-pointer text-(--accent) focus:outline-none disabled:opacity-50 transition-transform active:scale-95"
            aria-label="Toggle profile visibility"
          >
            <HugeiconsIcon
              icon={isPublic ? ToggleOnIcon : ToggleOffIcon}
              size={40}
              className={isPublic ? "text-(--accent)" : "text-(--text)"}
            />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {isPublic && (
            <motion.div
              variants={animVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="grid gap-2"
            >
              <label className="text-xs font-semibold text-(--text-h)">
                {t("profile.sharing.link", "Shareable Profile Link")}
              </label>
              <div className="flex items-center gap-2 rounded-squircle border border-(--border) bg-(--surface-2) p-2 text-xs">
                <span className="flex-1 truncate text-(--text) select-all px-2 font-mono">
                  {shareUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg bg-(--surface-3) hover:bg-(--surface-2) text-(--text-h) transition"
                  title={t("profile.sharing.copyBtn", "Copy Link")}
                >
                  <HugeiconsIcon icon={Copy01Icon} size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handlePreview}
          className="w-full inline-flex items-center justify-center gap-2 rounded-squircle border border-(--border) hover:bg-(--surface-2) px-4 py-3 text-sm font-semibold text-white transition cursor-pointer"
        >
          <HugeiconsIcon icon={EyeIcon} size={16} />
          {t("profile.sharing.previewBtn", "Preview Profile")}
        </button>

        <AnimatePresence initial={false}>
          {isPublic && (
            <motion.div
              variants={animVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center justify-center gap-3 rounded-4xl border border-(--border) bg-(--surface-2) p-4 mt-2"
            >
              <div className="rounded-squircle border border-(--border) bg-white p-2.5 shadow-sm">
                <QRCodeSVG
                  value={shareUrl}
                  size={150}
                  level="M"
                  includeMargin={true}
                  className="select-none pointer-events-none"
                />
              </div>
              <p className="text-[11px] leading-relaxed text-(--text) text-center max-w-[220px]">
                {t(
                  "profile.sharing.qrInstruction",
                  "Scan this QR code with a mobile device to view this profile.",
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
