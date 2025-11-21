// backend/src/controllers/teamController.js
const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const AuditLogger = require("../utils/logger");
const Joi = require("joi");

// Validation schema
const teamSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).allow("", null),
});

class TeamController {
  // Get all teams for organisation
  static async getTeams(req, res) {
    try {
      const teams = await db.allAsync(
        `SELECT t.*, 
         (SELECT COUNT(*) FROM employee_teams et WHERE et.team_id = t.id) as member_count
         FROM teams t
         WHERE t.organisation_id = ?
         ORDER BY t.created_at DESC`,
        [req.user.organisation_id]
      );

      // Get team members for each team
      for (let team of teams) {
        const members = await db.allAsync(
          `SELECT e.id, e.first_name, e.last_name, e.email, e.position
           FROM employees e
           JOIN employee_teams et ON e.id = et.employee_id
           WHERE et.team_id = ? AND e.organisation_id = ?`,
          [team.id, req.user.organisation_id]
        );
        team.members = members;
      }

      res.json(teams);
    } catch (error) {
      console.error("Get teams error:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  }

  // Create new team
  static async createTeam(req, res) {
    try {
      const { error, value } = teamSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { name, description } = value;

      // Check if team name already exists in organisation
      const existing = await db.getAsync(
        "SELECT id FROM teams WHERE name = ? AND organisation_id = ?",
        [name, req.user.organisation_id]
      );

      if (existing) {
        return res
          .status(400)
          .json({ error: "Team with this name already exists" });
      }

      const teamId = uuidv4();
      await db.runAsync(
        "INSERT INTO teams (id, organisation_id, name, description) VALUES (?, ?, ?, ?)",
        [teamId, req.user.organisation_id, name, description]
      );

      // Log the action
      await AuditLogger.log(
        "CREATE",
        "TEAM",
        teamId,
        {
          name,
          description,
        },
        req
      );

      res.status(201).json({
        id: teamId,
        message: "Team created successfully",
      });
    } catch (error) {
      console.error("Create team error:", error);
      res.status(500).json({ error: "Failed to create team" });
    }
  }

  // Update team
  static async updateTeam(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = teamSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      // Verify team belongs to organisation
      const team = await db.getAsync(
        "SELECT * FROM teams WHERE id = ? AND organisation_id = ?",
        [id, req.user.organisation_id]
      );

      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      const { name, description } = value;

      // Check if team name already exists (excluding current team)
      const existing = await db.getAsync(
        "SELECT id FROM teams WHERE name = ? AND organisation_id = ? AND id != ?",
        [name, req.user.organisation_id, id]
      );

      if (existing) {
        return res
          .status(400)
          .json({ error: "Team with this name already exists" });
      }

      await db.runAsync(
        "UPDATE teams SET name = ?, description = ? WHERE id = ?",
        [name, description, id]
      );

      // Log the action
      await AuditLogger.log(
        "UPDATE",
        "TEAM",
        id,
        {
          name,
          description,
        },
        req
      );

      res.json({ message: "Team updated successfully" });
    } catch (error) {
      console.error("Update team error:", error);
      res.status(500).json({ error: "Failed to update team" });
    }
  }

  // Delete team
  static async deleteTeam(req, res) {
    try {
      const { id } = req.params;

      // Verify team belongs to organisation
      const team = await db.getAsync(
        "SELECT * FROM teams WHERE id = ? AND organisation_id = ?",
        [id, req.user.organisation_id]
      );

      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      await db.runAsync("DELETE FROM teams WHERE id = ?", [id]);

      // Log the action
      await AuditLogger.log("DELETE", "TEAM", id, {}, req);

      res.json({ message: "Team deleted successfully" });
    } catch (error) {
      console.error("Delete team error:", error);
      res.status(500).json({ error: "Failed to delete team" });
    }
  }

  // Get team members
  static async getTeamMembers(req, res) {
    try {
      const { id } = req.params;

      // Verify team belongs to organisation
      const team = await db.getAsync(
        "SELECT id FROM teams WHERE id = ? AND organisation_id = ?",
        [id, req.user.organisation_id]
      );

      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      const members = await db.allAsync(
        `SELECT e.* 
         FROM employees e
         JOIN employee_teams et ON e.id = et.employee_id
         WHERE et.team_id = ? AND e.organisation_id = ?`,
        [id, req.user.organisation_id]
      );

      res.json(members);
    } catch (error) {
      console.error("Get team members error:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  }
}

module.exports = TeamController;
