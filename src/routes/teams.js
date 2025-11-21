// backend/src/routes/teams.js
const express = require("express");
const TeamController = require("../controllers/teamController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Team CRUD routes
router.get("/", TeamController.getTeams);
router.post("/", TeamController.createTeam);
router.put("/:id", TeamController.updateTeam);
router.delete("/:id", TeamController.deleteTeam);
router.get("/:id/members", TeamController.getTeamMembers);

module.exports = router;
