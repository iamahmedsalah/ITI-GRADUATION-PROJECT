import ContactMessage from "../../models/contact/contactMessageModel.js";
import { sendContactReplyEmail } from "../../mails/emails.js";
import { normalizePagination } from "../../helpers/pagination.js";
import { escapeRegex } from "../../helpers/text.js";
import { logAdminAction } from "./admin-shared.js";

export const getAdminContactMessages = async (req, res) => {
  const { q, status, page, limit } = req.query;

  try {
    const { skip, ...pagination } = normalizePagination(page, limit);
    const query = {};

    if (status) {
      query.status = status;
    }

    if (q) {
      const safeRegex = new RegExp(escapeRegex(q), "i");
      query.$or = [
        { name: safeRegex },
        { email: safeRegex },
        { message: safeRegex },
      ];
    }

    const [messages, total] = await Promise.all([
      ContactMessage.find(query)
        .populate("replies.admin", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .lean(),
      ContactMessage.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message:
        messages.length > 0
          ? "Contact messages retrieved successfully."
          : "No contact messages found.",
      data: messages,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        pages: Math.ceil(total / pagination.limit),
      },
    });
  } catch (error) {
    console.error("Admin get contact messages error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact messages.",
      error: error.message,
    });
  }
};

export const replyToContactMessageByAdmin = async (req, res) => {
  const { contactMessageId } = req.params;
  const { reply } = req.body;
  const adminId = req.user._id;

  try {
    const contactMessage = await ContactMessage.findById(contactMessageId);

    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found.",
      });
    }

    const emailResult = await sendContactReplyEmail({
      email: contactMessage.email,
      name: contactMessage.name,
      replyMessage: reply,
      originalMessage: contactMessage.message,
    });

    contactMessage.status = "replied";
    contactMessage.readAt = contactMessage.readAt || new Date();
    contactMessage.lastRepliedAt = new Date();
    contactMessage.replies.push({
      admin: adminId,
      message: reply,
      messageId: emailResult.messageId,
      sentAt: new Date(),
    });
    await contactMessage.save();

    try {
      await logAdminAction({
        req,
        adminId,
        action: "admin.contact.reply",
        targetType: "contactMessage",
        targetId: contactMessage._id,
        metadata: {
          recipient: contactMessage.email,
          messageId: emailResult.messageId,
        },
      });
    } catch (logError) {
      console.error("Failed to log admin action:", logError);
    }

    const data = await ContactMessage.findById(contactMessage._id)
      .populate("replies.admin", "username email")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Contact reply sent successfully.",
      data,
    });
  } catch (error) {
    console.error("Admin reply to contact message error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reply to contact message.",
      error: error.message,
    });
  }
};
