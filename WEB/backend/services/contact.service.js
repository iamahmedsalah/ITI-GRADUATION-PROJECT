import { transporter, sender } from "../config/mailer.js";
import ContactMessage from "../models/contact/contactMessageModel.js";
import { CONTACT_EMAIL_TEMPLATE } from "../utils/emailsTemplate.js";
import logger from "../utils/logger.js";

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const ensureContactMailer = () => {
  if (!transporter || !sender) {
    const error = new Error("Email service is not configured.");
    error.status = 503;
    throw error;
  }

  const recipient = process.env.CONTACT_RECEIVER_EMAIL || process.env.SUPPORT_EMAIL || sender;

  if (!recipient) {
    const error = new Error("Contact recipient email is not configured.");
    error.status = 503;
    throw error;
  }

  return recipient;
};

const getRequestIp = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
  req.socket?.remoteAddress ||
  req.ip ||
  "unknown";

const createContactRecord = async (req) => {
  if (ContactMessage.db.readyState !== 1) {
    logger.warn("Contact message was not stored because MongoDB is not connected", {
      from: req.body?.email,
    });
    return null;
  }

  return ContactMessage.create({
    ...req.body,
    ipAddress: getRequestIp(req),
    userAgent: req.headers["user-agent"] || "unknown",
  });
};

export const sendContactMessage = async (req, res, next) => {
  const { name, email, message } = req.body;
  let contactRecord = null;

  try {
    contactRecord = await createContactRecord(req);
    const recipient = ensureContactMailer();
    const htmlMessage = escapeHtml(message).replace(/\n/g, "<br />");
    const formattedHtml = CONTACT_EMAIL_TEMPLATE.replace(
      "{name}",
      escapeHtml(name)
    )
      .replace("{email}", escapeHtml(email))
      .replace("{message}", htmlMessage);

    const result = await transporter.sendMail({
      from: `"ILMA Contact Form" <${sender}>`,
      to: recipient,
      replyTo: { name, address: email },
      subject: `New contact message from ${name}`,
      text: `New contact form message

Name: ${name}
Email: ${email}

Message:
${message}`,
      html: formattedHtml,
      headers: {
        "X-Mailer": "ILMA Backend",
        "X-Category": "Contact Form",
      },
    });

    logger.info("Contact email sent successfully", {
      messageId: result.messageId,
      from: email,
      recipient,
    });

    if (contactRecord) {
      contactRecord.adminNotificationMessageId = result.messageId;
      await contactRecord.save();
    }

    return res.status(200).json({
      success: true,
      message: "Message sent successfully.",
      data: contactRecord
        ? {
          _id: contactRecord._id,
          status: contactRecord.status,
          createdAt: contactRecord.createdAt,
        }
        : undefined,
    });
  } catch (error) {
    logger.error("Error sending contact email", {
      from: email,
      errorMessage: error.message,
      stack: error.stack,
    });

    try {
      if (contactRecord) {
        contactRecord.adminNotificationError = error.message;
        await contactRecord.save();
      }
    } catch (updateError) {
      logger.warn("Failed to mark contact email notification error", {
        from: email,
        errorMessage: updateError.message,
      });
    }

    return next(error);
  }
};
