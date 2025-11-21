// backend/src/routes/employees.js
const express = require("express");
const EmployeeController = require("../controllers/employeeController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Employee CRUD routes
router.get("/", EmployeeController.getEmployees);
router.post("/", EmployeeController.createEmployee);
router.put("/:id", EmployeeController.updateEmployee);
router.delete("/:id", EmployeeController.deleteEmployee);

// Team assignment routes
router.post("/:employeeId/teams/:teamId", EmployeeController.assignToTeam);
router.delete("/:employeeId/teams/:teamId", EmployeeController.removeFromTeam);

module.exports = router;
