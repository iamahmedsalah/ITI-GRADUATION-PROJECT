import { createBrowserRouter } from "react-router-dom";
import RouteErrorPage from "./routes/common/RouteErrorPage";
import {
  adminAuthPageLoader,
  adminProtectedLoader,
  authPageLoader,
  dashboardLoader,
  landingLoader,
  languageAction,
  languageLoader,
  preferencesLoader,
  profileLoader,
  roadmapAction,
  roadmapLoader,
} from "./utils/route-utils";
import {
  AdminLayout,
  ClientLayout,
  LanguageLayout,
  RootLayout,
} from "./routes/common/layouts";
import {
  AdminCoursesPage,
  AdminCourseDetailPage,
  AdminDashboardPage,
  AdminForgotPasswordPage,
  AdminLoginPage,
  AdminResetPasswordPage,
  AdminContactMessagesPage,
  AdminProfilePage,
  AdminRoadmapDetailPage,
  AdminRoadmapsPage,
  AdminUsersPage,
  AiRoadmapPage,
  ContactPage,
  DashboardPage,
  FaqsPage,
  ForgotPasswordPage,
  GuidePage,
  HomePage,
  LoginPage,
  MyRoadmapsPage,
  NotFound,
  PreferencesPage,
  ProfilePage,
  ResetPasswordPage,
  RoadmapPage,
  SignupPage,
  UpgradePage,
  VerifyEmailPage,
} from "./utils/routes.lazy";

export const appRouter = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: (
      <RootLayout>
        <RouteErrorPage />
      </RootLayout>
    ),
    children: [
      {
        index: true,
        loader: landingLoader,
      },
      {
        path: ":language",
        loader: languageLoader,
        action: languageAction,
        element: <LanguageLayout />,
        children: [
          {
            element: <ClientLayout />,
            children: [
              {
                index: true,
                element: <HomePage />,
              },
              {
                path: "login",
                loader: authPageLoader,
                element: <LoginPage />,
              },
              {
                path: "forgot-password",
                element: <ForgotPasswordPage />,
              },
              {
                path: "signup",
                loader: authPageLoader,
                element: <SignupPage />,
              },
              {
                path: "verify-email",
                element: <VerifyEmailPage />,
              },
              {
                path: "reset-password/:token",
                element: <ResetPasswordPage />,
              },
              {
                path: "dashboard",
                loader: dashboardLoader,
                element: <DashboardPage />,
              },
              {
                path: "ai",
                element: <AiRoadmapPage />,
              },
              {
                path: "upgrade",
                element: <UpgradePage />,
              },
              {
                path: "profile",
                loader: profileLoader,
                element: <ProfilePage />,
              },
              {
                path: "preferences",
                loader: preferencesLoader,
                element: <PreferencesPage />,
              },
              {
                path: "roadmaps",
                element: <HomePage />,
              },
              {
                path: "my-roadmaps",
                loader: dashboardLoader,
                element: <MyRoadmapsPage />,
              },
              {
                path: "faqs",
                element: <FaqsPage />,
              },
              {
                path: "contact",
                element: <ContactPage />,
              },
              {
                path: "guides",
                element: <GuidePage />,
              },
              {
                path: "roadmaps/:slug",
                loader: roadmapLoader,
                action: roadmapAction,
                element: <RoadmapPage />,
              },
            ],
          },
          {
            path: "admin",
            element: <AdminLayout />,
            children: [
              {
                index: true,
                loader: adminProtectedLoader,
                element: <AdminDashboardPage />,
              },
              {
                path: "profile",
                loader: adminProtectedLoader,
                element: <AdminProfilePage />,
              },
              {
                path: "users",
                loader: adminProtectedLoader,
                element: <AdminUsersPage />,
              },
              {
                path: "roadmaps",
                loader: adminProtectedLoader,
                element: <AdminRoadmapsPage />,
              },
              {
                path: "roadmaps/:templateId",
                loader: adminProtectedLoader,
                element: <AdminRoadmapDetailPage />,
              },
              {
                path: "courses",
                loader: adminProtectedLoader,
                element: <AdminCoursesPage />,
              },
              {
                path: "courses/:courseId",
                loader: adminProtectedLoader,
                element: <AdminCourseDetailPage />,
              },
              {
                path: "contact-messages",
                loader: adminProtectedLoader,
                element: <AdminContactMessagesPage />,
              },
              {
                path: "login",
                loader: adminAuthPageLoader,
                element: <AdminLoginPage />,
              },
              {
                path: "forgot-password",
                element: <AdminForgotPasswordPage />,
              },
              {
                path: "reset-password/:token",
                element: <AdminResetPasswordPage />,
              },
            ],
          },
          {
            path: "*",
            element: <NotFound />,
          },
        ],
      },
      {
        path: "reset-password/:token",
        element: <ResetPasswordPage />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);
