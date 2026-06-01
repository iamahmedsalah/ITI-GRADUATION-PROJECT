import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user/userAccountModel.js";

const ALLOW_UNVERIFIED_PATHS = new Set([
    "/api/auth/check-auth",
    "/api/auth/logout",
    "/api/admin/auth/check-auth",
    "/api/admin/auth/logout",
]);

// JWT Auth Guard
export const protect = async (req, res, next) => {
    try {
        let token;

        // Accept token from Authorization header OR httpOnly cookie
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies && (req.cookies.accessToken || req.cookies.token)) {
            token = req.cookies.accessToken || req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Please log in to continue.",
            });
        }

        // Verify and decode
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the user (without password) to the request
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "The account associated with this token no longer exists.",
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "This account is deactivated. Please contact support.",
            });
        }

        const requestPath = req.path
            ? `/api${req.path}`
            : req.originalUrl?.split("?")[0];

        if (user.isVerified === false && !ALLOW_UNVERIFIED_PATHS.has(requestPath)) {
            return res.status(403).json({
                success: false,
                message: "Email not verified.",
            });
        }

        // Invalidate tokens issued before the last password change
        if (user.passwordChangedAt) {
            const pwdChangedTs = parseInt(new Date(user.passwordChangedAt).getTime() / 1000, 10);
            if (decoded.iat < pwdChangedTs) {
                return res.status(401).json({
                    success: false,
                    message: "User recently changed password. Please log in again.",
                });
            }
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please log in again.",
            });
        }
        return res.status(401).json({
            success: false,
            message: "Invalid token. Authentication failed.",
        });
    }
};

// Role-based authorization guard
export const authorizeRoles = (...roles) => {
    const allowedRoles = roles.filter(Boolean);

    return (req, res, next) => {
        const userRole = req.user?.role;

        if (!userRole || !allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to perform this action.",
            });
        }

        return next();
    };
};


export default { protect, authorizeRoles }
