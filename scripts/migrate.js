// backend/scripts/migrate.js
const mysql = require("mysql2/promise");
require("dotenv").config();

async function runMigrations() {
  let connection;

  try {
    // Create connection without database to create it if not exists
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
    });

    console.log("Connected to MySQL server");

    // Create database if not exists
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || "hrms"}`
    );
    console.log("Database created or already exists");

    // Switch to the database
    await connection.execute(`USE ${process.env.DB_NAME || "hrms"}`);
    console.log("Using database:", process.env.DB_NAME || "hrms");

    // Create tables
    const tables = [
      `CREATE TABLE IF NOT EXISTS organisations (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        organisation_id VARCHAR(36) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('admin', 'manager') DEFAULT 'manager',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE,
        UNIQUE KEY unique_email_org (email, organisation_id)
      )`,

      `CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        organisation_id VARCHAR(36) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        position VARCHAR(255),
        department VARCHAR(255),
        hire_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE,
        UNIQUE KEY unique_email_org (email, organisation_id)
      )`,

      `CREATE TABLE IF NOT EXISTS teams (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        organisation_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE,
        UNIQUE KEY unique_name_org (name, organisation_id)
      )`,

      `CREATE TABLE IF NOT EXISTS employee_teams (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        employee_id VARCHAR(36) NOT NULL,
        team_id VARCHAR(36) NOT NULL,
        assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        UNIQUE KEY unique_employee_team (employee_id, team_id)
      )`,

      `CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        organisation_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        action VARCHAR(50) NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id VARCHAR(36),
        details JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
    ];

    for (const tableSql of tables) {
      await connection.execute(tableSql);
      console.log("Table created or already exists");
    }

    // Create indexes
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organisation_id)",
      "CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at)",
      "CREATE INDEX IF NOT EXISTS idx_employees_org ON employees(organisation_id)",
      "CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(organisation_id)",
      "CREATE INDEX IF NOT EXISTS idx_users_org ON users(organisation_id)",
    ];

    for (const indexSql of indexes) {
      await connection.execute(indexSql);
      console.log("Index created or already exists");
    }

    console.log("All migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("Database connection closed");
    }
  }
}

runMigrations();
