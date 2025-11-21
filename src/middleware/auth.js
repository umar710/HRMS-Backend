// backend/src/middleware/auth.js
const jwt = require("jsonwebtoken");
const db = require("../config/database");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    // Verify user still exists and get organisation context
    const user = await db.getAsync(
      `SELECT u.*, o.name as organisation_name 
       FROM users u 
       JOIN organisations o ON u.organisation_id = o.id 
       WHERE u.id = ?`,
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

module.exports = { authenticateToken };
