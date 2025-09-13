const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require("mongodb");

const Razorpay = require("razorpay");
const path = require("path");

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "docs")));

const PORT = process.env.PORT || 3000;

// 🚀 Clean up the URI before using
const MONGO_URI = (process.env.MONGO_URI || "")
      // remove hidden newlines

const DB_NAME = "chavi_website";

const client = new MongoClient(MONGO_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
let db, razorpay;

// --- MongoDB connection ---
async function connectDB() {
    try {
        console.log("🔍 MONGO_URI used:", JSON.stringify(MONGO_URI));
        const client = new MongoClient(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        await client.connect();
        db = client.db(DB_NAME);
        console.log("✅ Connected to MongoDB");
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err.message);
        process.exit(1);
    }
}

// --- Razorpay init ---
function initRazorpay() {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("✅ Razorpay initialized");
}

// --- Routes ---
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mongo: !!db, razorpay: !!razorpay });
});

// Newsletter
// Newsletter
app.post("/api/newsletter", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email required" });

        await db.collection("newsletter").insertOne({ email, createdAt: new Date() });
        res.json({ success: true, message: "Newsletter subscribed" });
    } catch (err) {
        console.error("❌ Error saving newsletter:", err);
        res.status(500).json({ error: "Failed to save newsletter" });
    }
});

// Volunteers

app.post("/api/volunteers", async (req, res) => {
    try {
        const volunteerData = req.body;
        console.log("📥 Volunteer data received:", volunteerData);

        // Insert into MongoDB collection
        await db.collection("volunteers").insertOne(volunteerData);

        res.status(200).json({ message: "Volunteer saved successfully" });
    } catch (err) {
        console.error("❌ Error saving volunteer:", err);
        res.status(500).json({ error: "Failed to save volunteer" });
    }
});

// Donations (record in DB)
app.post("/api/donations", async (req, res) => {
    try {
        const data = req.body;
        if (!data.name || !data.email || !data.amount)
            return res.status(400).json({ error: "Name, email, amount required" });

        await db.collection("donations").insertOne({ ...data, createdAt: new Date() });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save donation" });
    }
});

// Razorpay: create order
app.post("/api/create-order", async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: "INR",
            payment_capture: 1,
        });

        res.json({ orderId: order.id, key: process.env.RAZORPAY_KEY_ID });
    } catch (err) {
        console.error("Razorpay create-order error:", err.message);
        res.status(500).json({ error: "Failed to create order" });
    }
});

// Razorpay: verify payment (basic version)
app.post("/api/verify-payment", async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return res.status(400).json({ error: "Invalid payment details" });
        }
        // In production: verify HMAC signature here
        res.json({ success: true });
    } catch (err) {
        console.error("Payment verify error:", err.message);
        res.status(500).json({ error: "Failed to verify payment" });
    }
});

// --- Start server ---
connectDB().then(() => {
    initRazorpay();
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
});
