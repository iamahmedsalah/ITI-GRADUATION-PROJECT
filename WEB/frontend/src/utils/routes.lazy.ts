import { lazy } from 'react'

export const NotFound = lazy(() => import('../routes/NotFound'))
export const HomePage = lazy(() => import('../routes/HomePage'))
export const LoginPage = lazy(() => import('../routes/LoginPage'))
export const ForgotPasswordPage = lazy(() => import('../routes/ForgotPasswordPage'))
export const ResetPasswordPage = lazy(() => import('../routes/ResetPasswordPage'))
export const AdminLoginPage = lazy(() => import('../routes/AdminLoginPage'))
export const AdminDashboardPage = lazy(() => import('../routes/AdminDashboardPage'))
export const SignupPage = lazy(() => import('../routes/SignupPage'))
export const VerifyEmailPage = lazy(() => import('../routes/VerifyEmailPage'))
export const DashboardPage = lazy(() => import('../routes/DashboardPage'))
export const ProfilePage = lazy(() => import('../routes/ProfilePage'))
export const RoadmapPage = lazy(() => import('../routes/RoadmapPage'))