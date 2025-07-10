const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config(); // Load .env first!
const db = require("./db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const { body, validationResult } = require("express-validator");

const app = express();
const PORT = process.env.PORT || 5005;
const SECRET_KEY = process.env.SECRET_KEY;

// Safety check for SECRET_KEY
if (!SECRET_KEY) {
    throw new Error("❌ SECRET_KEY is missing in .env file!");
}

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Test database connection on startup
(async () => {
    try {
        await db.query("SELECT 1");
        console.log("✅ Connected to MySQL database.");
    } catch (err) {
        console.error("❌ Database connection failed:", err);
        process.exit(1);
    }
})();

// Serve frontend
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

//health check
app.get("/health", (req, res) => {
    res.status(200).send("OK");
})

// User Signup
app.post("/signup", [
    body("email").isEmail(),
    body("password").isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
        const [existingUser] = await db.query("SELECT email FROM users WHERE email = ?", [email]);
        if (existingUser.length > 0) return res.status(400).json({ error: "Email already in use." });

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query("INSERT INTO users (email, password) VALUES (?, ?)", [email, hashedPassword]);
        res.status(201).json({ message: "✅ User registered successfully!" });
    } catch (err) {
        console.error("❌ Error signing up:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// User Login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) return res.status(401).json({ error: "Invalid credentials." });

        const user = users[0];
        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, SECRET_KEY, { expiresIn: "1h" });
        res.json({ message: "✅ Login successful!", token });
    } catch (err) {
        console.error("❌ Error logging in:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// Authentication Middleware
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

    try {
        req.user = jwt.verify(token, SECRET_KEY);
        next();
    } catch (err) {
        console.error("❌ Token verification failed:", err);
        return res.status(403).json({ error: "Invalid or expired token." });
    }
};

// Book a Room (1-Hour Rule)
app.post("/book-room", authenticateUser, async (req, res) => {
    const { room_id, user_email, booking_date, booking_time, purpose } = req.body;

    // Convert time to moment objects
    const bookingTime = moment(`${booking_date} ${booking_time}`, "YYYY-MM-DD HH:mm");
    const bookingEndTime = moment(bookingTime).add(1, "hour").format("HH:mm");

    try {
        // Check for overlapping bookings
        const [existingBookings] = await db.query(
            "SELECT * FROM bookings WHERE room_id = ? AND booking_date = ? AND " +
            "(booking_time = ? OR " +
            "(booking_time < ? AND DATE_ADD(booking_time, INTERVAL 1 HOUR) > ?) OR " +
            "(? <= booking_time AND booking_time < DATE_ADD(?, INTERVAL 1 HOUR)))",
            [room_id, booking_date, booking_time, booking_time, booking_time, booking_time, booking_time]
        );

        if (existingBookings.length > 0) {
            return res.status(400).json({ error: "Room is already booked within this time slot." });
        }

        await db.query(
            "INSERT INTO bookings (room_id, user_email, booking_date, booking_time, purpose) VALUES (?, ?, ?, ?, ?)",
            [room_id, user_email, booking_date, booking_time, purpose]
        );

        res.status(201).json({ message: "✅ Room booked successfully!" });
    } catch (err) {
        console.error("❌ Error booking room:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// Get All Bookings for a Date
app.get("/bookings", authenticateUser, async (req, res) => {
    const { date } = req.query;
    try {
        const [results] = await db.query(
            "SELECT * FROM bookings WHERE booking_date = ? ORDER BY booking_time", 
            [date]
        );
        res.json(results);
    } catch (err) {
        console.error("❌ Error fetching bookings:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
