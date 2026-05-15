
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"])


// import express
import express from "express";
import path from "path";
import { fileURLToPath } from "url";




// HTTP logger middleware
import morgan from "morgan";

import cookieParser from "cookie-parser";

import cors from "cors";


// Load environment variables ENV

import dotenv from 'dotenv';
dotenv.config({ path: ['.env', '.env.local'] });


// Database config
import dbConfig from "./config/database.js"
// Connect to database

// Create an express app
const app = express();

// Database connection
dbConfig();


app.get('/', (req, res) => {
    res.status(500).send('hello world');
});


// Enable CORS & CORS Configuration
// Use in future fir frontend
// app.use(cors({ origin: ['http://localhost:5173', ''], credentials: true }));

// Body parser 
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Log requests to the console
const devMode = process.env.NODE_ENV;
devMode === "development"? app.use(morgan("dev")) && console.log(`Mode:In ${devMode}`) : console.log(`Mode:In ${devMode} `);

// Routes

// Mount routes


// PORT & Start server on port
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


// Handle rejection errors outside of express
process.on("unhandledRejection", (err) => {
    console.log(`unhandledRejection Errors: ${err.message} ${err.name}`);
    server.close(() => {
        console.log(`Shutting down..`);
        process.exit(1);
    });
});

export default app;