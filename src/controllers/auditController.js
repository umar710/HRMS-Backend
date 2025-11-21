/*
// backend/src/controllers/auditController.js
const db = require("../config/database");

class AuditController {
  // Get audit logs with pagination and filtering
  static async getAuditLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        resource_type,
        start_date,
        end_date,
      } = req.query;

      const offset = (page - 1) * limit;

      let whereClause = "WHERE al.organisation_id = ?";
      const queryParams = [req.user.organisation_id];

      // Add filters
      if (action) {
        whereClause += " AND al.action = ?";
        queryParams.push(action);
      }

      if (resource_type) {
        whereClause += " AND al.resource_type = ?";
        queryParams.push(resource_type);
      }

      if (start_date) {
        whereClause += " AND al.created_at >= ?";
        queryParams.push(start_date);
      }

      if (end_date) {
        whereClause += " AND al.created_at <= ?";
        queryParams.push(end_date);
      }

      // Get total count for pagination
      const countResult = await db.getAsync(
        `SELECT COUNT(*) as total 
         FROM audit_logs al 
         ${whereClause}`,
        queryParams
      );

      const total = countResult.total;

      // Get logs
      const logs = await db.allAsync(
        `SELECT al.*, u.name as user_name, u.email as user_email
         FROM audit_logs al
         JOIN users u ON al.user_id = u.id
         ${whereClause}
         ORDER BY al.created_at DESC
         LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(limit), offset]
      );

      res.json({
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  }

  // Get audit log statistics
  static async getAuditStats(req, res) {
    try {
      const { start_date, end_date } = req.query;

      let whereClause = "WHERE organisation_id = ?";
      const queryParams = [req.user.organisation_id];

      if (start_date) {
        whereClause += " AND created_at >= ?";
        queryParams.push(start_date);
      }

      if (end_date) {
        whereClause += " AND created_at <= ?";
        queryParams.push(end_date);
      }

      // Get actions count by type
      const actionStats = await db.allAsync(
        `SELECT action, COUNT(*) as count 
         FROM audit_logs 
         ${whereClause}
         GROUP BY action 
         ORDER BY count DESC`,
        queryParams
      );

      // Get resource type statistics
      const resourceStats = await db.allAsync(
        `SELECT resource_type, COUNT(*) as count 
         FROM audit_logs 
         ${whereClause}
         GROUP BY resource_type 
         ORDER BY count DESC`,
        queryParams
      );

      // Get daily activity
      const dailyActivity = await db.allAsync(
        `SELECT DATE(created_at) as date, COUNT(*) as count 
         FROM audit_logs 
         ${whereClause}
         GROUP BY DATE(created_at) 
         ORDER BY date DESC 
         LIMIT 30`,
        queryParams
      );

      res.json({
        action_stats: actionStats,
        resource_stats: resourceStats,
        daily_activity: dailyActivity,
      });
    } catch (error) {
      console.error("Get audit stats error:", error);
      res.status(500).json({ error: "Failed to fetch audit statistics" });
    }
  }
}

module.exports = AuditController;
*/

// backend/src/controllers/auditController.js
const db = require("../config/database");

class AuditController {
  // Get audit logs with pagination and filtering
  static async getAuditLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        resource_type,
        start_date,
        end_date,
      } = req.query;

      console.log(
        "📊 Fetching audit logs for organisation:",
        req.user.organisation_id
      );
      console.log("📋 Filters:", {
        page,
        limit,
        action,
        resource_type,
        start_date,
        end_date,
      });

      const offset = (page - 1) * limit;

      let whereClause = "WHERE al.organisation_id = ?";
      const queryParams = [req.user.organisation_id];

      // Add filters
      if (action) {
        whereClause += " AND al.action = ?";
        queryParams.push(action);
      }

      if (resource_type) {
        whereClause += " AND al.resource_type = ?";
        queryParams.push(resource_type);
      }

      if (start_date) {
        whereClause += " AND al.created_at >= ?";
        queryParams.push(start_date);
      }

      if (end_date) {
        whereClause += " AND al.created_at <= ?";
        queryParams.push(end_date);
      }

      // Get total count for pagination
      const countResult = await db.getAsync(
        `SELECT COUNT(*) as total 
         FROM audit_logs al 
         ${whereClause}`,
        queryParams
      );

      const total = countResult.total;
      console.log(`📈 Total audit logs found: ${total}`);

      // Get logs
      const logs = await db.allAsync(
        `SELECT al.*, u.name as user_name, u.email as user_email
         FROM audit_logs al
         JOIN users u ON al.user_id = u.id
         ${whereClause}
         ORDER BY al.created_at DESC
         LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(limit), offset]
      );

      console.log(`📄 Returning ${logs.length} audit logs`);

      res.json({
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("❌ Get audit logs error:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  }

  // Get audit log statistics
  static async getAuditStats(req, res) {
    try {
      const { start_date, end_date } = req.query;

      console.log(
        "📊 Fetching audit stats for organisation:",
        req.user.organisation_id
      );

      let whereClause = "WHERE organisation_id = ?";
      const queryParams = [req.user.organisation_id];

      if (start_date) {
        whereClause += " AND created_at >= ?";
        queryParams.push(start_date);
      }

      if (end_date) {
        whereClause += " AND created_at <= ?";
        queryParams.push(end_date);
      }

      // Get actions count by type
      const actionStats = await db.allAsync(
        `SELECT action, COUNT(*) as count 
         FROM audit_logs 
         ${whereClause}
         GROUP BY action 
         ORDER BY count DESC`,
        queryParams
      );

      // Get resource type statistics
      const resourceStats = await db.allAsync(
        `SELECT resource_type, COUNT(*) as count 
         FROM audit_logs 
         ${whereClause}
         GROUP BY resource_type 
         ORDER BY count DESC`,
        queryParams
      );

      // Get daily activity
      const dailyActivity = await db.allAsync(
        `SELECT DATE(created_at) as date, COUNT(*) as count 
         FROM audit_logs 
         ${whereClause}
         GROUP BY DATE(created_at) 
         ORDER BY date DESC 
         LIMIT 30`,
        queryParams
      );

      console.log("📈 Audit stats:", {
        action_stats: actionStats,
        resource_stats: resourceStats,
        daily_activity: dailyActivity,
      });

      res.json({
        action_stats: actionStats,
        resource_stats: resourceStats,
        daily_activity: dailyActivity,
      });
    } catch (error) {
      console.error("❌ Get audit stats error:", error);
      res.status(500).json({ error: "Failed to fetch audit statistics" });
    }
  }
}

module.exports = AuditController;
