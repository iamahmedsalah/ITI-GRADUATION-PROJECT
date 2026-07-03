import { lazyWithRetry } from "./lazyWithRetry";

export const NotFound = lazyWithRetry(() => import("../routes/common/NotFound"));
export const HomePage = lazyWithRetry(() => import("../routes/user/HomePage"));
export const LoginPage = lazyWithRetry(() => import("../routes/user/LoginPage"));
export const ForgotPasswordPage = lazyWithRetry(
  () => import("../routes/user/ForgotPasswordPage"),
);
export const ResetPasswordPage = lazyWithRetry(
  () => import("../routes/user/ResetPasswordPage"),
);
export const AdminLoginPage = lazyWithRetry(
  () => import("../routes/admin/AdminLoginPage"),
);
export const AdminForgotPasswordPage = lazyWithRetry(
  () => import("../routes/admin/AdminForgotPasswordPage"),
);
export const AdminResetPasswordPage = lazyWithRetry(
  () => import("../routes/admin/AdminResetPasswordPage"),
);
export const AdminDashboardPage = lazyWithRetry(
  () => import("../routes/admin/AdminDashboardPage"),
);
export const AdminProfilePage = lazyWithRetry(
  () => import("../routes/admin/AdminProfilePage"),
);
export const AdminUsersPage = lazyWithRetry(
  () => import("../routes/admin/AdminUsersPage"),
);
export const AdminRoadmapsPage = lazyWithRetry(
  () => import("../routes/admin/AdminRoadmapsPage"),
);
export const AdminRoadmapDetailPage = lazyWithRetry(
  () => import("../routes/admin/AdminRoadmapDetailPage"),
);
export const AdminCoursesPage = lazyWithRetry(
  () => import("../routes/admin/AdminCoursesPage"),
);
export const AdminCourseDetailPage = lazyWithRetry(
  () => import("../routes/admin/AdminCourseDetailPage"),
);
export const AdminContactMessagesPage = lazyWithRetry(
  () => import("../routes/admin/AdminContactMessagesPage"),
);
export const SignupPage = lazyWithRetry(() => import("../routes/user/SignupPage"));
export const VerifyEmailPage = lazyWithRetry(
  () => import("../routes/user/VerifyEmailPage"),
);
export const DashboardPage = lazyWithRetry(() => import("../routes/user/DashboardPage"));
export const AiChatPage = lazyWithRetry(() => import("../routes/user/AiChatPage"));
export const AiRoadmapPage = lazyWithRetry(() => import("../routes/user/AiRoadmapPage"));
export const UpgradePage = lazyWithRetry(() => import("../routes/user/UpgradePage"));
export const ProfilePage = lazyWithRetry(() => import("../routes/user/ProfilePage"));
export const PreferencesPage = lazyWithRetry(() => import("../routes/user/PreferencesPage"));
export const MyRoadmapsPage = lazyWithRetry(() => import("../routes/user/MyRoadmapsPage"));
export const FaqsPage = lazyWithRetry(() => import("../routes/user/FaqsPage"));
export const ContactPage = lazyWithRetry(() => import("../routes/user/ContactUsPage"));
export const GuidePage = lazyWithRetry(() => import("../routes/user/GuidePage"));
export const RoadmapPage = lazyWithRetry(() => import("../routes/user/RoadmapPage"));
export const CoursePage = lazyWithRetry(() => import("../routes/user/CoursePage"));
export const PublicProfilePage = lazyWithRetry(() => import("../routes/user/PublicProfilePage"));

