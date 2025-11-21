// backend/src/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const AuditLogger = require("../utils/logger");
const { authenticateToken } = require("../middleware/auth"); // ADD THIS IMPORT
const Joi = require("joi");

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  organisation_name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(255).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  organisation_name: Joi.string().required(),
});

// Register new organisation and user
router.post("/register", async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { organisation_name, email, password, name } = value;

    // Check if organisation already exists
    const existingOrg = await db.getAsync(
      "SELECT id FROM organisations WHERE name = ?",
      [organisation_name]
    );

    if (existingOrg) {
      return res
        .status(400)
        .json({ error: "Organisation name already exists" });
    }

    // Check if user email exists in any organisation
    const existingUser = await db.getAsync(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser) {
      return res.status(400).json({ error: "User email already exists" });
    }

    // Create organisation
    const orgId = uuidv4();
    await db.runAsync(
      "INSERT INTO organisations (id, name, email) VALUES (?, ?, ?)",
      [orgId, organisation_name, email]
    );

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const userId = uuidv4();
    await db.runAsync(
      `INSERT INTO users (id, organisation_id, email, password_hash, name, role) 
       VALUES (?, ?, ?, ?, ?, 'admin')`,
      [userId, orgId, email, passwordHash, name]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: userId,
        organisationId: orgId,
        email: email,
        role: "admin",
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    // Log organisation creation - FIXED: Added this missing log
    await AuditLogger.log(
      "CREATE",
      "ORGANISATION",
      orgId,
      {
        organisation_name,
        admin_email: email,
        admin_name: name,
      },
      req
    );

    res.status(201).json({
      message: "Organisation and user created successfully",
      token,
      user: {
        id: userId,
        email,
        name,
        role: "admin",
        organisation_name,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register organisation" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, organisation_name } = value;

    // Find user with organisation
    const user = await db.getAsync(
      `SELECT u.*, o.name as organisation_name 
       FROM users u 
       JOIN organisations o ON u.organisation_id = o.id 
       WHERE u.email = ? AND o.name = ?`,
      [email, organisation_name]
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        organisationId: user.organisation_id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    // Log login action
    await AuditLogger.log("LOGIN", "USER", user.id, {}, req);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organisation_name: user.organisation_name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Get user profile - FIXED: Added authentication middleware
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    // Use the authenticated user from the middleware
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        organisation_name: req.user.organisation_name,
      },
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Logout - FIXED: Added authentication middleware
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // Log logout action - FIXED: Uncommented and using authenticated user
    await AuditLogger.log("LOGOUT", "USER", req.user.id, {}, req);

    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Failed to logout" });
  }
});

module.exports = router;
