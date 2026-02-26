const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const session = require("express-session");
const multer = require("multer");
const path = require("path");

const app = express();
const db = new sqlite3.Database("./database.db");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: true
}));

// Upload configuration
const storage = multer.diskStorage({
    destination: "./public/uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Create table
db.run(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    firstname TEXT,
    lastname TEXT,
    phone TEXT,
    photo TEXT DEFAULT 'default.png',
    language TEXT DEFAULT 'fr'
)
`);

// Register (just first time)
app.post("/register", async (req, res) => {
    const { email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users(email, password) VALUES (?, ?)`,
        [email, hash],
        err => {
            if (err) return res.send("User already exists");
            res.redirect("/login.html");
        });
});

// Login
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email=?`, [email], async (err, user) => {
        if (!user) return res.send("User not found");

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.send("Wrong password");

        req.session.user = user;
        res.redirect("/dashboard.html");
    });
});

// Get profile
app.get("/profile", (req, res) => {
    if (!req.session.user) return res.status(401).send("Unauthorized");
    db.get("SELECT * FROM users WHERE id=?",
        [req.session.user.id],
        (err, user) => res.json(user)
    );
});

// Update profile (ONLY allowed fields)
app.post("/update", upload.single("photo"), (req, res) => {
    if (!req.session.user) return res.status(401).send("Unauthorized");

    const { firstname, lastname, phone, language } = req.body;
    const photo = req.file ? req.file.filename : req.session.user.photo;

    db.run(`
        UPDATE users 
        SET firstname=?, lastname=?, phone=?, photo=?, language=? 
        WHERE id=?`,
        [firstname, lastname, phone, photo, language, req.session.user.id],
        () => {
            res.redirect("/dashboard.html");
        }
    );
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));