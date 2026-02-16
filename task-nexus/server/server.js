require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(express.json());

const JWT_SECRET = 'super-secret-key-123';

const fluxNexusHandler = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

fluxNexusHandler.connect((err) => {
    if (err) {
        console.error('DB connection error:', err);
        return;
    }
    console.log('Connected to database.');
});

/* ================= AUTH ROUTES ================= */

app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;

    const query = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";

    fluxNexusHandler.query(query, [username, email, password], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }

        const token = jwt.sign(
            { id: results.insertId, username, email },
            JWT_SECRET
        );

        res.json({
            token,
            user: { id: results.insertId, username, email }
        });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    const query = "SELECT * FROM users WHERE email = ?";

    fluxNexusHandler.query(query, [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length === 0)
            return res.status(401).json({ error: "No account found" });

        const user = results[0];

        if (user.password_hash !== password)
            return res.status(401).json({ error: "Wrong password" });

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET
        );

        res.json({
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    });
});

app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token" });

    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        res.json({
            id: decoded.id,
            username: decoded.username,
            email: decoded.email
        });
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
});

/* ================= START SERVER ================= */

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
