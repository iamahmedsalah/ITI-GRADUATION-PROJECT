import express from "express";
import { contactLimiter } from "../utils/rateLimiter.js";
import { contactValidation } from "../middleware/contactValidators.js";
import { sendContactMessage } from "../services/contact.service.js";

const router = express.Router();

/**
 * @openapi
 * /contact:
 *   post:
 *     tags: [Contact]
 *     summary: Send a contact form message
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, message]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 80
 *               email:
 *                 type: string
 *                 format: email
 *               message:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 5000
 *           example:
 *             name: Ahmed Salah
 *             email: ahmed@example.com
 *             message: I need help with my roadmap.
 *     responses:
 *       200:
 *         description: Contact message sent successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       503:
 *         description: Email service is not configured
 */
router.post("/", contactLimiter, contactValidation, sendContactMessage);

export default router;
