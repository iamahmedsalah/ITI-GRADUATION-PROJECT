import { createBrowserRouter } from 'react-router-dom'
import NotFound from './routes/NotFound'
import HomePage from './routes/HomePage'
import LoginPage from './routes/LoginPage'
import ForgotPasswordPage from './routes/ForgotPasswordPage'
import ResetPasswordPage from './routes/ResetPasswordPage'
import AdminLoginPage from './routes/AdminLoginPage'
import AdminDashboardPage from './routes/AdminDashboardPage'
import SignupPage from './routes/SignupPage'
import VerifyEmailPage from './routes/VerifyEmailPage'
import DashboardPage from './routes/DashboardPage'
import RoadmapPage from './routes/RoadmapPage'
import RouteErrorPage from './routes/RouteErrorPage'
import { dashboardLoader, landingLoader, languageAction, languageLoader, roadmapAction, roadmapLoader } from './utils/route-utils'
import { AdminLayout, ClientLayout, LanguageLayout, RootLayout } from './routes/layouts'

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
                element: <LoginPage />,
              },
              {
                path: 'forgot-password',
                element: <ForgotPasswordPage />,
              },
              {
                path: 'signup',
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
