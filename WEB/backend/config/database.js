import mongoose from "mongoose";
import logger from "../utils/logger.js"

// Connection reuse strategy crucial for Serverless (e.g., Vercel)
let connectionPromise = null;

function parseDatabaseError(error) {
    const message = String(error?.message || "");
    const lower = message.toLowerCase();
    
    let code = "DB_UNAVAILABLE";
    let userMessage = "Database is unavailable. Please try again.";

    if (lower.includes("querysrv") || lower.includes("enotfound") || lower.includes("econnrefused")) {
        code = "DB_DNS_RESOLUTION_FAILED";
        userMessage = "Database hostname resolution failed.";
    } else if (lower.includes("server selection timed out") || lower.includes("econnreset") || lower.includes("etimedout")) {
        code = "DB_CONNECTION_TIMEOUT";
        userMessage = "Database connection timed out.";
    } else if (lower.includes("authentication failed") || lower.includes("bad auth")) {
        code = "DB_AUTH_FAILED";
        userMessage = "Database authentication failed.";
    } else if (lower.includes("not allowed to access this mongodb deployment") || lower.includes("ip address")) {
        code = "DB_NETWORK_DENIED";
        userMessage = "Database network access is denied.";
    } else if (lower.includes("uri") || lower.includes("connection string")) {
        code = "DB_URL_INVALID";
        userMessage = "Database connection string is invalid.";
    }

    error.code = code;
    error.customMessage = userMessage;
    return error;
}

const dbConfig = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (connectionPromise) {
        logger.debug("Database connection attempt reusable promise intercepted.");
        await connectionPromise;
        return mongoose.connection;
    }

    const dbUrl = process.env.DB_URL;
    if (!dbUrl) {
        const err = new Error("DB_URL is not configured");
        err.code = "DB_URL_MISSING";
        err.customMessage = "Database config is missing on server.";
        throw err;
    }

    try {
        connectionPromise = mongoose.connect(dbUrl, {
            dbName: "iti_Grad_Project",
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
        });

        const conn = await connectionPromise;
        
        // Structured logging output
        logger.info("Database connection established successfully", {
            host: conn.connection.host,
            database: conn.connection.name
        });
        
        return conn.connection;
    } catch (err) {
        connectionPromise = null;
        const parsedError = parseDatabaseError(err);

        // Track the full context of the failure safely
        logger.error("Database connection middleware failure", {
            code: parsedError.code,
            errorName: parsedError.name,
            errorMessage: parsedError.message,
            stack: parsedError.stack // Helpful for deep tracking locally
        });

        if (!process.env.VERCEL) {
            logger.warn("Non-serverless environment detected. Terminating process due to DB failure.");
            process.exit(1);
        }
        
        throw parsedError;
    }
};

export default dbConfig;