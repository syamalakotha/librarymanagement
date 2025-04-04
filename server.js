const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

// Load Firebase Service Account JSON
const serviceAccount = require("./key.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// CSS Style for Success and Error Messages
const pageStyle = `
    <style>
        body { 
            text-align: center; 
            font-family: 'Poppins', sans-serif; 
            background: #f3f4f6; 
            color: #333;
            margin: 0; padding: 0;
        }
        .container {
            max-width: 500px;
            margin: 100px auto;
            padding: 30px;
            background: white;
            border-radius: 15px;
            box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.1);
        }
        h2 { font-size: 24px; color: #5e0eb3; }
        p { font-size: 18px; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .btn {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 20px;
            background: #6a11cb;
            color: white;
            text-decoration: none;
            font-weight: bold;
            border-radius: 30px;
            transition: all 0.3s ease-in-out;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
        }
        .btn:hover { background: #5e0eb3; transform: translateY(-2px); }
    </style>
`;

// Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "signup.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Handle Signup - Save to Firestore
app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        await db.collection("users").doc(email).set({
            username,
            email,
            password, // ⚠ Hash passwords before using in production!
        });

        console.log(✅ New user registered: ${username}, Email: ${email});
        res.send(`
            ${pageStyle}
            <div class="container">
                <h2 class="success">✅ Signup Successful!</h2>
                <p>Welcome, <strong>${username}</strong>!</p>
                <a href="/login" class="btn">Go to Login</a>
            </div>
        `);
    } catch (error) {
        console.error("❌ Error adding user:", error);
        res.send(`
            ${pageStyle}
            <div class="container">
                <h2 class="error">❌ Signup Failed!</h2>
                <p>Something went wrong. Please try again.</p>
                <a href="/signup" class="btn">Try Again</a>
            </div>
        `);
    }
});

// Handle Login - Verify from Firestore
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const userRef = db.collection("users").doc(email);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.send(`
                ${pageStyle}
                <div class="container">
                    <h2 class="error">❌ User Not Found!</h2>
                    <p>Please sign up first.</p>
                    <a href="/signup" class="btn">Sign Up</a>
                </div>
            `);
        }

        const userData = userDoc.data();
        if (userData.password !== password) {
            return res.send(`
                ${pageStyle}
                <div class="container">
                    <h2 class="error">❌ Incorrect Password!</h2>
                    <p>Please try again.</p>
                    <a href="/login" class="btn">Try Again</a>
                </div>
            `);
        }

        console.log(✅ Login successful: ${email});
        res.send(`
            ${pageStyle}
            <div class="container">
                <h2 class="success">✅ Login Successful!</h2>
                <p>Welcome back, <strong>${userData.username}</strong>!</p>
                <a href="/" class="btn">Go to Home</a>
            </div>
        `);
    } catch (error) {
        console.error("❌ Login error:", error);
        res.send(`
            ${pageStyle}
            <div class="container">
                <h2 class="error">❌ Error Logging In!</h2>
                <p>Please try again.</p>
                <a href="/login" class="btn">Try Again</a>
            </div>
        `);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(🚀 Server running at http://localhost:${PORT});
});
