import User from "../models/user/userAccountModel.js";

export const signupUniquenessValidation = async (req, res, next) => {
  try {
    const username = req.body?.username;
    const email = req.body?.email;

    if (!username && !email) {
      return next();
    }

    const normalizedUsername = username
      ? String(username).trim().toLowerCase()
      : null;
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;

    const filters = [];
    if (normalizedUsername) {
      filters.push({ username: normalizedUsername });
    }
    if (normalizedEmail) {
      filters.push({ email: normalizedEmail });
    }

    const existingUser = await User.findOne({ $or: filters })
      .select("username email isActive")
      .lean();

    if (existingUser) {
      if (existingUser.isActive === false) {
        return res.status(409).json({
          success: false,
          message: "Validation failed.",
          errors: [
            {
              field: "identifier",
              message:
                "An account with this email or username exists but is deactivated. Please contact support to reactivate it.",
            },
          ],
        });
      }

      const conflictField =
        normalizedEmail && existingUser.email === normalizedEmail
          ? "email"
          : "username";

      return res.status(409).json({
        success: false,
        message: "Validation failed.",
        errors: [
          {
            field: conflictField,
            message:
              conflictField === "email"
                ? "An account already exists with this email."
                : "An account already exists with this username.",
          },
        ],
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};
