import { lazy } from "react";

export const NotFound = lazy(() => import("../routes/common/NotFound"));
export const HomePage = lazy(() => import("../routes/user/HomePage"));
export const LoginPage = lazy(() => import("../routes/user/LoginPage"));
export const ForgotPasswordPage = lazy(
  () => import("../routes/user/ForgotPasswordPage"),
);
export const ResetPasswordPage = lazy(
  () => import("../routes/user/ResetPasswordPage"),
);
export const AdminLoginPage = lazy(
  () => import("../routes/admin/AdminLoginPage"),
);
export const AdminForgotPasswordPage = lazy(
  () => import("../routes/admin/AdminForgotPasswordPage"),
);
export const AdminResetPasswordPage = lazy(
  () => import("../routes/admin/AdminResetPasswordPage"),
);
export const AdminDashboardPage = lazy(
  () => import("../routes/admin/AdminDashboardPage"),
);
export const AdminProfilePage = lazy(
  () => import("../routes/admin/AdminProfilePage"),
);
export const AdminUsersPage = lazy(
  () => import("../routes/admin/AdminUsersPage"),
);
export const AdminRoadmapsPage = lazy(
  () => import("../routes/admin/AdminRoadmapsPage"),
);
export const AdminRoadmapDetailPage = lazy(
  () => import("../routes/admin/AdminRoadmapDetailPage"),
);
export const AdminCoursesPage = lazy(
  () => import("../routes/admin/AdminCoursesPage"),
);
export const AdminCourseDetailPage = lazy(
  () => import("../routes/admin/AdminCourseDetailPage"),
);
export const AdminContactMessagesPage = lazy(
  () => import("../routes/admin/AdminContactMessagesPage"),
);
export const SignupPage = lazy(() => import("../routes/user/SignupPage"));
export const VerifyEmailPage = lazy(
  () => import("../routes/user/VerifyEmailPage"),
);
export const DashboardPage = lazy(() => import("../routes/user/DashboardPage"));
export const AiRoadmapPage = lazy(() => import("../routes/user/AiRoadmapPage"));
export const UpgradePage = lazy(() => import("../routes/user/UpgradePage"));
export const ProfilePage = lazy(() => import("../routes/user/ProfilePage"));
export const RoadmapsPage = lazy(() => import("../routes/user/RoadmapsPage"));
export const MyRoadmapsPage = lazy(() => import("../routes/user/MyRoadmapsPage"));
export const FaqsPage = lazy(() => import("../routes/user/FaqsPage"));
export const ContactPage = lazy(() => import("../routes/user/ContactUsPage"));
export const GuidePage = lazy(() => import("../routes/user/GuidePage"));
export const RoadmapPage = lazy(() => import("../routes/user/RoadmapPage"));
