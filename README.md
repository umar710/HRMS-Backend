# HRMS Backend API

A complete Human Resource Management System (HRMS) backend built with Node.js, Express, and SQLite. Provides RESTful APIs for employee management, team management, and comprehensive audit logging.

## 🚀 Live Deployment

**Base URL:** `https://hrms-backend-q8zb.onrender.com`

**API Documentation:** `https://hrms-backend-q8zb.onrender.com/api/health`

## 📋 Features

- ✅ **Authentication & Authorization** - JWT-based secure authentication
- ✅ **Employee Management** - Full CRUD operations for employees
- ✅ **Team Management** - Create, manage teams and assign employees
- ✅ **Audit Logging** - Comprehensive activity tracking
- ✅ **SQLite Database** - Lightweight and efficient data storage
- ✅ **RESTful APIs** - Clean and consistent API design
- ✅ **CORS Enabled** - Ready for frontend integration
- ✅ **Rate Limiting** - Protection against abuse
- ✅ **Input Validation** - Joi schema validation
- ✅ **Error Handling** - Comprehensive error management

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Joi
- **Security:** Helmet, CORS, bcryptjs
- **Logging:** Morgan, Custom Audit Logger
- **Deployment:** Render

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   ├── employeeController.js # Employee business logic
│   │   ├── teamController.js     # Team business logic
│   │   └── auditController.js    # Audit logs logic
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── employees.js         # Employee routes
│   │   ├── teams.js             # Team routes
│   │   └── audit.js             # Audit routes
│   ├── utils/
│   │   └── logger.js            # Audit logging utility
│   └── config/
│       └── database-prod.js     # Production database config
├── server.js                    # Main server file
├── package.json
└── .env                         # Environment variables
```

## 🔑 API Endpoints

### Authentication
| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/api/auth/register` | Register new organisation | Public |
| POST | `/api/auth/login` | User login | Public |
| GET | `/api/auth/profile` | Get user profile | Required |
| POST | `/api/auth/logout` | User logout | Required |

### Employees
| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| GET | `/api/employees` | Get all employees | Required |
| POST | `/api/employees` | Create new employee | Required |
| PUT | `/api/employees/:id` | Update employee | Required |
| DELETE | `/api/employees/:id` | Delete employee | Required |
| POST | `/api/employees/:employeeId/teams/:teamId` | Assign to team | Required |
| DELETE | `/api/employees/:employeeId/teams/:teamId` | Remove from team | Required |

### Teams
| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| GET | `/api/teams` | Get all teams | Required |
| POST | `/api/teams` | Create new team | Required |
| PUT | `/api/teams/:id` | Update team | Required |
| DELETE | `/api/teams/:id` | Delete team | Required |
| GET | `/api/teams/:id/members` | Get team members | Required |

### Audit Logs
| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| GET | `/api/audit/logs` | Get audit logs | Required |
| GET | `/api/audit/stats` | Get audit statistics | Required |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health status |

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd hrms/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file:
   ```env
   NODE_ENV=development
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **API will be running at** `http://localhost:5000`

## 📝 API Usage Examples

### Register Organisation
```bash
curl -X POST https://hrms-backend-q8zb.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organisation_name": "TechCorp Solutions",
    "email": "admin@techcorp.com",
    "password": "password123",
    "name": "John Admin"
  }'
```

### Login
```bash
curl -X POST https://hrms-backend-q8zb.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@techcorp.com",
    "password": "password123",
    "organisation_name": "TechCorp Solutions"
  }'
```

### Create Employee (with auth token)
```bash
curl -X POST https://hrms-backend-q8zb.onrender.com/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "first_name": "Alice",
    "last_name": "Johnson",
    "email": "alice@techcorp.com",
    "position": "Software Engineer",
    "department": "Engineering",
    "hire_date": "2024-01-15"
  }'
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## 🗃️ Database Schema

The application uses SQLite with the following main tables:

- **organisations** - Company/organisation data
- **users** - User accounts and authentication
- **employees** - Employee records
- **teams** - Team definitions
- **employee_teams** - Many-to-many employee-team relationships
- **audit_logs** - Activity tracking and audit trail

## 🔒 Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📊 Audit Logging

The system automatically logs:
- User registrations and logins
- All CRUD operations on employees and teams
- Team assignments and removals
- Timestamp, user, and action details

## 🚀 Deployment

This backend is deployed on **Render** with the following configuration:

- **Runtime:** Node.js
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment:** Production

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `FRONTEND_URL` environment variable is set correctly
   - Check if frontend URL is included in CORS configuration

2. **Authentication Errors**
   - Verify JWT token is included in Authorization header
   - Check if token has expired

3. **Database Issues**
   - SQLite database is automatically created on first run
   - Tables are automatically initialized

### Health Check
Check API status:
```bash
curl https://hrms-backend-q8zb.onrender.com/api/health
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

- **GitHub:** [Your GitHub Profile]
- **Email:** [Your Email]

## 🔗 Links

- **Live API:** https://hrms-backend-q8zb.onrender.com

---
