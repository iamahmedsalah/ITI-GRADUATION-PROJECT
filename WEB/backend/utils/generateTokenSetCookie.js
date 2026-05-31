import crypto from 'crypto'
import jwt from 'jsonwebtoken'

const ACCESS_TOKEN_EXPIRES_IN = '15m'
const REFRESH_TOKEN_EXPIRES_IN = '1d'
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000
const REFRESH_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000

export const getAccessTokenCookieOptions = () => {
	const isProduction = process.env.NODE_ENV === 'production'

	return {
		httpOnly: true,
		secure: isProduction,
		// Cross-domain frontend/backend on Vercel needs SameSite=None.
		sameSite: isProduction ? 'none' : 'strict',
		maxAge: ACCESS_TOKEN_MAX_AGE_MS,
	}
}

export const getRefreshTokenCookieOptions = () => {
	const isProduction = process.env.NODE_ENV === 'production'

	return {
		httpOnly: true,
		secure: isProduction,
		// Cross-domain frontend/backend on Vercel needs SameSite=None.
		sameSite: isProduction ? 'none' : 'strict',
		maxAge: REFRESH_TOKEN_MAX_AGE_MS,
	}
}

export const hashRefreshToken = (token) => {
	return crypto.createHash('sha256').update(token).digest('hex')
}

export const issueAccessToken = (userId) => {
	const jwtSecret = process.env.JWT_SECRET

	if (!jwtSecret) {
		throw new Error('JWT_SECRET is not configured')
	}

	return jwt.sign({ id: userId }, jwtSecret, {
		expiresIn: ACCESS_TOKEN_EXPIRES_IN,
	})
}

export const issueRefreshToken = (userId) => {
	const jwtSecret = process.env.JWT_SECRET

	if (!jwtSecret) {
		throw new Error('JWT_SECRET is not configured')
	}

	return jwt.sign({ id: userId }, jwtSecret, {
		expiresIn: REFRESH_TOKEN_EXPIRES_IN,
	})
}

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
	res.cookie('accessToken', accessToken, getAccessTokenCookieOptions())
	res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions())
	res.cookie('token', accessToken, getAccessTokenCookieOptions())
}

export const clearAuthCookies = (res) => {
	res.clearCookie('accessToken', getAccessTokenCookieOptions())
	res.clearCookie('refreshToken', getRefreshTokenCookieOptions())
	res.clearCookie('token', getAccessTokenCookieOptions())
}

const generateTokenSetCookie = (res, userId) => {
	const accessToken = issueAccessToken(userId)
	const refreshToken = issueRefreshToken(userId)

	setAuthCookies(res, { accessToken, refreshToken })

	return {
		accessToken,
		refreshToken,
	}
}

export default generateTokenSetCookie
