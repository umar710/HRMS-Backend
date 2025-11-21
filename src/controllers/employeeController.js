// backend/src/controllers/employeeController.js
const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const AuditLogger = require("../utils/logger");
const Joi = require("joi");

// Validation schemas
const employeeSchema = Joi.object({
  first_name: Joi.string().min(1).max(255).required(),
  last_name: Joi.string().min(1).max(255).required(),
  email: Joi.string().email().required(),
  position: Joi.string().max(255).allow("", null),
  department: Joi.string().max(255).allow("", null),
  hire_date: Joi.date().allow("", null),
});

class EmployeeController {
  // Get all employees for organisation
  static async getEmployees(req, res) {
    try {
      const employees = await db.allAsync(
        `SELECT e.* 
         FROM employees e
         WHERE e.organisation_id = ?
         ORDER BY e.created_at DESC`,
        [req.user.organisation_id]
      );

      // Get team assignments for each employee
      for (let employee of employees) {
        const teams = await db.allAsync(
          `SELECT t.id, t.name 
           FROM teams t
           JOIN employee_teams et ON t.id = et.team_id
           WHERE et.employee_id = ? AND t.organisation_id = ?`,
          [employee.id, req.user.organisation_id]
        );
        employee.teams = teams;
      }

      res.json(employees);
    } catch (error) {
      console.error("Get employees error:", error);
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  }

  // Create new employee
  static async createEmployee(req, res) {
    try {
      const { error, value } = employeeSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { first_name, last_name, email, position, department, hire_date } =
        value;

      // Check if email already exists in organisation
      const existing = await db.getAsync(
        "SELECT id FROM employees WHERE email = ? AND organisation_id = ?",
        [email, req.user.organisation_id]
      );

      if (existing) {
        return res
          .status(400)
          .json({ error: "Employee with this email already exists" });
      }

      const employeeId = uuidv4();
      await db.runAsync(
        `INSERT INTO employees 
         (id, organisation_id, first_name, last_name, email, position, department, hire_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          employeeId,
          req.user.organisation_id,
          first_name,
          last_name,
          email,
          position,
          department,
          hire_date,
        ]
      );

      // Log the action
      await AuditLogger.log(
        "CREATE",
        "EMPLOYEE",
        employeeId,
        {
          first_name,
          last_name,
          email,
          position,
          department,
          hire_date,
        },
        req
      );

      res.status(201).json({
        id: employeeId,
        message: "Employee created successfully",
      });
    } catch (error) {
      console.error("Create employee error:", error);
      res.status(500).json({ error: "Failed to create employee" });
    }
  }

  // Update employee
  static async updateEmployee(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = employeeSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      // Verify employee belongs to organisation
      const employee = await db.getAsync(
        "SELECT * FROM employees WHERE id = ? AND organisation_id = ?",
        [id, req.user.organisation_id]
      );

      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      const { first_name, last_name, email, position, department, hire_date } =
        value;

      await db.runAsync(
        `UPDATE employees 
         SET first_name = ?, last_name = ?, email = ?, position = ?, department = ?, hire_date = ?
         WHERE id = ?`,
        [first_name, last_name, email, position, department, hire_date, id]
      );

      // Log the action
      await AuditLogger.log(
        "UPDATE",
        "EMPLOYEE",
        id,
        {
          first_name,
          last_name,
          email,
          position,
          department,
          hire_date,
        },
        req
      );

      res.json({ message: "Employee updated successfully" });
    } catch (error) {
      console.error("Update employee error:", error);
      res.status(500).json({ error: "Failed to update employee" });
    }
  }

  // Delete employee
  static async deleteEmployee(req, res) {
    try {
      const { id } = req.params;

      // Verify employee belongs to organisation
      const employee = await db.getAsync(
        "SELECT * FROM employees WHERE id = ? AND organisation_id = ?",
        [id, req.user.organisation_id]
      );

      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      await db.runAsync("DELETE FROM employees WHERE id = ?", [id]);

      // Log the action
      await AuditLogger.log("DELETE", "EMPLOYEE", id, {}, req);

      res.json({ message: "Employee deleted successfully" });
    } catch (error) {
      console.error("Delete employee error:", error);
      res.status(500).json({ error: "Failed to delete employee" });
    }
  }

  // Assign employee to team
  static async assignToTeam(req, res) {
    try {
      const { employeeId, teamId } = req.params;

      // Verify both employee and team belong to organisation
      const employee = await db.getAsync(
        "SELECT id FROM employees WHERE id = ? AND organisation_id = ?",
        [employeeId, req.user.organisation_id]
      );

      const team = await db.getAsync(
        "SELECT id FROM teams WHERE id = ? AND organisation_id = ?",
        [teamId, req.user.organisation_id]
      );

      if (!employee || !team) {
        return res.status(404).json({ error: "Employee or team not found" });
      }

      const assignmentId = uuidv4();
      await db.runAsync(
        "INSERT INTO employee_teams (id, employee_id, team_id) VALUES (?, ?, ?)",
        [assignmentId, employeeId, teamId]
      );

      // Log the action
      await AuditLogger.log(
        "ASSIGN",
        "EMPLOYEE_TEAM",
        null,
        {
          employee_id: employeeId,
          team_id: teamId,
        },
        req
      );

      res.json({ message: "Employee assigned to team successfully" });
    } catch (error) {
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return res
          .status(400)
          .json({ error: "Employee is already in this team" });
      }
      console.error("Assign to team error:", error);
      res.status(500).json({ error: "Failed to assign employee to team" });
    }
  }

  // Remove employee from team
  static async removeFromTeam(req, res) {
    try {
      const { employeeId, teamId } = req.params;

      const result = await db.runAsync(
        `DELETE FROM employee_teams 
         WHERE employee_id = ? AND team_id = ? 
         AND EXISTS (SELECT 1 FROM employees WHERE id = ? AND organisation_id = ?)
         AND EXISTS (SELECT 1 FROM teams WHERE id = ? AND organisation_id = ?)`,
        [
          employeeId,
          teamId,
          employeeId,
          req.user.organisation_id,
          teamId,
          req.user.organisation_id,
        ]
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      // Log the action
      await AuditLogger.log(
        "UNASSIGN",
        "EMPLOYEE_TEAM",
        null,
        {
          employee_id: employeeId,
          team_id: teamId,
        },
        req
      );

      res.json({ message: "Employee removed from team successfully" });
    } catch (error) {
      console.error("Remove from team error:", error);
      res.status(500).json({ error: "Failed to remove employee from team" });
    }
  }
}

module.exports = EmployeeController;
