// backend/src/utils/logger.js
const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class AuditLogger {
  static async log(
    action,
    resourceType,
    resourceId = null,
    details = {},
    req = null
  ) {
    try {
      const logEntry = {
        id: uuidv4(),
        organisation_id: req?.user?.organisation_id,
        user_id: req?.user?.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: JSON.stringify(details),
        ip_address: req?.ip || req?.connection?.remoteAddress,
        user_agent: req?.get("User-Agent"),
      };

      await db.runAsync(
        `INSERT INTO audit_logs 
         (id, organisation_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        Object.values(logEntry)
      );

      console.log(
        `[AUDIT] ${action} ${resourceType} ${resourceId || ""}`,
        details
      );
    } catch (error) {
      console.error("Failed to write audit log:", error);
    }
  }
}

module.exports = AuditLogger;
