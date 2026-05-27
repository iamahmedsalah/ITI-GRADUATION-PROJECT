import nodemailer from "nodemailer";
import dotenv from "dotenv";
import logger from "../utils/logger.js"; 

// Load environment variables
dotenv.config({ path: ['.env', '.env.local'] });

const createEmailTransporter = () => {
    const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

    // Fast fail if credentials are completely missing
    if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
        logger.error("Email configuration failed: Missing required environment variables.", {
            host: !!EMAIL_HOST,
            user: !!EMAIL_USER,
            pass: !!EMAIL_PASS,
        });
        return null;
    }

    const port = Number(EMAIL_PORT) || 587;
    const isSecure = port === 465;

    const transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: port,
        secure: isSecure, 
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
        // Optional: Increase timeout thresholds to prevent connection drops in serverless environments
        connectionTimeout: 10000, 
        greetingTimeout: 10000,
    });

    // Verify SMTP connection pool on initialization (Non-blocking)
    transporter.verify((error, success) => {
        if (error) {
            logger.error("SMTP Mailer connection verification failed", { 
                errorMessage: error.message,
                host: EMAIL_HOST,
                port 
            });
        } else {
            logger.info("SMTP Mailer is ready to deliver messages safely.", { host: EMAIL_HOST });
        }
    });

    return transporter;
};

export const transporter = createEmailTransporter();
export const sender = process.env.EMAIL_USER;