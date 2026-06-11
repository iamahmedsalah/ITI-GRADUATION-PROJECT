import { transporter, sender } from "../config/mailer.js";
import {
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  CONTACT_REPLY_EMAIL_TEMPLATE,
} from "../utils/emailsTemplate.js";
import logger from "../utils/logger.js";

const verifyTransporterState = () => {
  if (!transporter) {
    throw new Error(
      "SMTP Mailer transporter is not initialized or configured incorrectly."
    );
  }

  if (!sender) {
    throw new Error("Email sender is not configured.");
  }
};

const baseHeaders = {
  "X-Mailer": "ILMA Backend",
  "X-Priority": "3",
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatMultilineHtml = (value) => escapeHtml(value).replace(/\n/g, "<br />");

export const sendVerificationEmail = async (email, verificationToken, name) => {
  try {
    verifyTransporterState();

    const formattedHtml = VERIFICATION_EMAIL_TEMPLATE.replace(
      "{verificationCode}",
      verificationToken
    )
      .replace("{name}", name)
      .replace("{email}", email);

    const text = `Hello ${name},

  Your ILMA verification token is:

${verificationToken}

  This token expires soon.

If you did not create an ILMA account, you can ignore this email.

ILMA Team`;

    const res = await transporter.sendMail({
      from: `"ILMA Support" <${sender}>`,
      to: email,
      replyTo: sender,
      subject: "Verify your ILMA account with your token",
      text,
      html: formattedHtml,
      headers: {
        ...baseHeaders,
        "X-Category": "Verification Email",
      },
    });

    logger.info("Verification email sent successfully", {
      messageId: res.messageId,
      recipient: email,
    });

    return res;
  } catch (error) {
    logger.error("Error executing sendVerificationEmail", {
      recipient: email,
      errorMessage: error.message,
      stack: error.stack,
    });

    throw new Error(`Error sending verification email: ${error.message}`);
  }
};

export const sendWelcomeEmail = async (email, name) => {
  try {
    verifyTransporterState();

    const formattedHtml = WELCOME_EMAIL_TEMPLATE.replace("{name}", name).replace(
      "{email}",
      email
    );

    const text = `Hello ${name},

Welcome to ILMA.

Your account has been created successfully.

You can now start using ILMA to discover software engineering learning recommendations.

ILMA Team`;

    const res = await transporter.sendMail({
      from: `"ILMA Team" <${sender}>`,
      to: email,
      replyTo: sender,
      subject: "Welcome to ILMA",
      text,
      html: formattedHtml,
      headers: {
        ...baseHeaders,
        "X-Category": "Welcome Email",
      },
    });

    logger.info("Welcome email sent successfully", {
      messageId: res.messageId,
      recipient: email,
    });

    return res;
  } catch (error) {
    logger.error("Error executing sendWelcomeEmail", {
      recipient: email,
      errorMessage: error.message,
      stack: error.stack,
    });

    throw new Error(`Error sending welcome email: ${error.message}`);
  }
};

export const sendPasswordResetEmail = async (email, resetURL, name) => {
  try {
    verifyTransporterState();

    const formattedHtml = PASSWORD_RESET_REQUEST_TEMPLATE.replace(
      "{resetURL}",
      resetURL
    )
      .replace("{name}", name)
      .replace("{email}", email);

    const text = `Hello ${name},

We received a request to reset your ILMA password.

Open this link to reset your password:

${resetURL}

If you did not request this, you can ignore this email.

ILMA Security Team`;

    const res = await transporter.sendMail({
      from: `"ILMA Security" <${sender}>`,
      to: email,
      replyTo: sender,
      subject: "Reset your ILMA password",
      text,
      html: formattedHtml,
      headers: {
        ...baseHeaders,
        "X-Category": "Password Reset Email",
      },
    });

    logger.info("Password reset email sent successfully", {
      messageId: res.messageId,
      recipient: email,
    });

    return res;
  } catch (error) {
    logger.error("Error executing sendPasswordResetEmail", {
      recipient: email,
      errorMessage: error.message,
      stack: error.stack,
    });

    throw new Error(`Error sending password reset email: ${error.message}`);
  }
};

export const sendResetSuccessEmail = async (email, name, resetInfo = {}) => {
  try {
    verifyTransporterState();

    const {
      passwordChangedAt = "Unknown",
      resetTime = "Unknown",
      ipAddress = "Unknown",
      location = "Unknown",
      device = "Unknown",
    } = resetInfo;

    const formattedHtml = PASSWORD_RESET_SUCCESS_TEMPLATE
      .replace("{name}", name)
      .replace("{passwordChangedAt}", passwordChangedAt)
      .replace("{resetTime}", resetTime)
      .replace("{ipAddress}", ipAddress)
      .replace("{location}", location)
      .replace("{device}", device);

    const text = `Hello ${name},

Your ILMA password was reset successfully.

Reset details:
Password changed at: ${passwordChangedAt}
Time: ${resetTime}
IP Address: ${ipAddress}
Location: ${location}
Device: ${device}

If this was you, no further action is needed.
If you did not reset your password, please secure your account immediately.

ILMA Security Team`;

    const res = await transporter.sendMail({
      from: `"ILMA Security" <${sender}>`,
      to: email,
      replyTo: sender,
      subject: "Your ILMA password was reset",
      text,
      html: formattedHtml,
      headers: {
        "X-Mailer": "ILMA Backend",
        "X-Category": "Password Reset Success Email",
      },
    });

    logger.info("Password reset success email sent successfully", {
      messageId: res.messageId,
      recipient: email,
      ipAddress,
    });

    return res;
  } catch (error) {
    logger.error("Error executing sendResetSuccessEmail", {
      recipient: email,
      errorMessage: error.message,
      stack: error.stack,
    });

    throw new Error(`Error sending password reset success email: ${error.message}`);
  }
};

export const sendContactReplyEmail = async ({
  email,
  name,
  replyMessage,
  originalMessage,
}) => {
  try {
    verifyTransporterState();

    const formattedHtml = CONTACT_REPLY_EMAIL_TEMPLATE.replace(
      "{name}",
      escapeHtml(name),
    )
      .replace("{replyMessage}", formatMultilineHtml(replyMessage))
      .replace("{originalMessage}", formatMultilineHtml(originalMessage));

    const text = `Hello ${name},

Thank you for contacting ILMA. Our team replied to your message.

Our reply:
${replyMessage}

Your original message:
${originalMessage}

You can reply directly to this email if you need more help.

ILMA Support Team`;

    const res = await transporter.sendMail({
      from: `"ILMA Support" <${sender}>`,
      to: email,
      replyTo: sender,
      subject: "Reply from ILMA Support",
      text,
      html: formattedHtml,
      headers: {
        ...baseHeaders,
        "X-Category": "Contact Reply Email",
      },
    });

    logger.info("Contact reply email sent successfully", {
      messageId: res.messageId,
      recipient: email,
    });

    return res;
  } catch (error) {
    logger.error("Error executing sendContactReplyEmail", {
      recipient: email,
      errorMessage: error.message,
      stack: error.stack,
    });

    throw new Error(`Error sending contact reply email: ${error.message}`);
  }
};
