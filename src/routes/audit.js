// backend/src/routes/audit.js
const express = require("express");
const AuditController = require("../controllers/auditController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Audit log routes
router.get("/logs", AuditController.getAuditLogs);
router.get("/stats", AuditController.getAuditStats);

module.exports = router;
