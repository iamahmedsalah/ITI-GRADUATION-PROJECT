import { createBrowserRouter } from 'react-router-dom'
import RouteErrorPage from './routes/RouteErrorPage'
import { adminAuthPageLoader, authPageLoader, dashboardLoader, landingLoader, languageAction, languageLoader, profileLoader, roadmapAction, roadmapLoader } from './utils/route-utils'
import { AdminLayout, ClientLayout, LanguageLayout, RootLayout } from './routes/layouts'
import { AdminDashboardPage, AdminLoginPage, DashboardPage, ForgotPasswordPage, HomePage, LoginPage, NotFound, ProfilePage, ResetPasswordPage, RoadmapPage, SignupPage, VerifyEmailPage } from './utils/routes.lazy'

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
        path: ':language',
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
                path: 'login',
                loader: authPageLoader,
                element: <LoginPage />,
              },
              {
                path: 'forgot-password',
                element: <ForgotPasswordPage />,
              },
              {
                path: 'signup',
                loader: authPageLoader,
                element: <SignupPage />,
              },
              {
                path: 'verify-email',
                element: <VerifyEmailPage />,
              },
              {
                path: 'reset-password/:token',
                element: <ResetPasswordPage />,
              },
              {
                path: 'dashboard',
                loader: dashboardLoader,
                element: <DashboardPage />,
              },
              {
                path: 'profile',
                loader: profileLoader,
                element: <ProfilePage />,
              },
              {
                path: 'roadmaps/:slug',
                loader: roadmapLoader,
                action: roadmapAction,
                element: <RoadmapPage />,
              },
            ],
          },
          {
            path: 'admin',
            element: <AdminLayout />,
            children: [
              {
                index: true,
                element: <AdminDashboardPage />,
              },
              {
                path: 'login',
                loader: adminAuthPageLoader,
                element: <AdminLoginPage />,
              },
            ],
          },
          {
            path: '*',
            element: <NotFound />,
          },
        ],
      },
      {
        path: 'reset-password/:token',
        element: <ResetPasswordPage />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
])
