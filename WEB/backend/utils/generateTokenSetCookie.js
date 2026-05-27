import jwt from 'jsonwebtoken';

export const getAuthCookieOptions = () => {
	const isProduction = process.env.NODE_ENV === "production";
	return {
		httpOnly: true,
		secure: isProduction,
		// Cross-domain frontend/backend on Vercel needs SameSite=None.
		sameSite: isProduction ? "none" : "strict",
		maxAge: 24 * 60 * 60 * 1000, // 1 day
	};
};

const generateTokenSetCookie = (res, userId) => {
	const jwtSecret = process.env.JWT_SECRET;
	if (!jwtSecret) {
		throw new Error("JWT_SECRET is not configured");
	}

	const token = jwt.sign({id: userId}, jwtSecret, {
		expiresIn: process.env.JWT_EXPIRES_IN || "1d",
	});

	res.cookie("token", token, getAuthCookieOptions());

	return token;

};

export default generateTokenSetCookie ;
