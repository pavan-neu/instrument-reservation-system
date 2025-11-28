# 🔬 Instrument Reservation System

A full-stack web application for managing laboratory instrument bookings. Built with React, Node.js, and Microsoft SQL Server.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Database Setup](#-database-setup)
- [Environment Configuration](#-environment-configuration)
- [Running the Application](#-running-the-application)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Screenshots](#-screenshots)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

## ✨ Features

- **Dashboard** - Real-time statistics overview of the reservation system
- **Browse Available Slots** - Filter and view available instrument time slots
- **Create Bookings** - Book single or multiple continuous time slots
- **Manage Bookings** - View, track, and cancel reservations
- **Access Level Validation** - Automatic validation of student access levels against instrument requirements
- **Penalty System** - Automated penalty tracking for late check-ins, check-outs, and cancellations
- **Encrypted Data** - Sensitive student information is encrypted in the database

### Business Rules Enforced

| Rule               | Description                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Access Levels      | Students can only book instruments matching their access level (Level01, Level02, Level03) |
| Penalized Students | Students with penalized quota plans cannot make new bookings                               |
| Continuous Slots   | Multi-slot bookings must be back-to-back (no gaps)                                         |
| Same Instrument    | Multi-slot bookings must be for the same instrument                                        |
| Same Date          | Multi-slot bookings must be on the same date                                               |

## 🛠 Tech Stack

**Frontend:**

- React 18
- Vite
- CSS3 (Custom dark theme)

**Backend:**

- Node.js
- Express.js
- mssql (SQL Server driver)

**Database:**

- Microsoft SQL Server 2019+
- T-SQL Stored Procedures
- Database-level encryption

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v9 or higher)
- [Docker](https://www.docker.com/) (for SQL Server on Mac/Linux) OR SQL Server installed locally
- [Git](https://git-scm.com/)

## 📁 Project Structure

```
instrument-reservation-app/
├── backend/
│   ├── server.js           # Express API server
│   ├── package.json        # Backend dependencies
│   └── .env                # Environment variables (create this)
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main application component
│   │   ├── App.css         # Global styles
│   │   ├── main.jsx        # React entry point
│   │   └── components/
│   │       ├── Dashboard.jsx
│   │       ├── AvailableSlots.jsx
│   │       ├── CreateBooking.jsx
│   │       └── MyBookings.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json        # Frontend dependencies
├── database/
│   ├── 01_create_tables.sql
│   ├── 02_insert_data.sql
│   ├── 03_encryption.sql
│   ├── 04_indexes.sql
│   └── 05_stored_procedures.sql
└── README.md
```

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/instrument-reservation-system.git
cd instrument-reservation-system
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## 🗄 Database Setup

### Option A: Using Docker (Recommended for Mac/Linux)

1. **Pull and run SQL Server container:**

```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong@Passw0rd" \
   -p 1433:1433 --name sql_server \
   -d mcr.microsoft.com/mssql/server:2019-latest
```

2. **Verify container is running:**

```bash
docker ps
```

### Option B: Local SQL Server Installation

If you have SQL Server installed locally, ensure it's running and accessible on port 1433.

### 3. Create Database and Objects

Run the SQL scripts in order using SQL Server Management Studio, Azure Data Studio, or any SQL client:

```sql
-- Run in this order:
-- 1. 01_create_tables.sql    (Creates database and tables)
-- 2. 02_insert_data.sql      (Inserts sample data)
-- 3. 03_encryption.sql       (Sets up column encryption)
-- 4. 04_indexes.sql          (Creates performance indexes)
-- 5. 05_stored_procedures.sql (Creates SPs, Views, Triggers, Functions)
```

## ⚙️ Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cd backend
touch .env
```

Add the following configuration:

```env
# Database Configuration
DB_USER=sa
DB_PASSWORD=YourStrong@Passw0rd
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=InstrumentReservationSystem

# Server Configuration
PORT=3001
```

### Environment Variables Explained

| Variable      | Description         | Default                       |
| ------------- | ------------------- | ----------------------------- |
| `DB_USER`     | SQL Server username | `sa`                          |
| `DB_PASSWORD` | SQL Server password | -                             |
| `DB_SERVER`   | SQL Server host     | `localhost`                   |
| `DB_PORT`     | SQL Server port     | `1433`                        |
| `DB_NAME`     | Database name       | `InstrumentReservationSystem` |
| `PORT`        | Backend API port    | `3001`                        |

### ⚠️ Important Security Notes

- **Never commit `.env` files** to version control
- The `.env` file is already included in `.gitignore`
- Use strong passwords in production
- For production, use environment-specific configurations

### Example `.env.example` file

A template file `.env.example` is provided. Copy it to create your `.env`:

```bash
cp .env.example .env
# Then edit .env with your actual credentials
```

## 🏃 Running the Application

### Start the Backend Server

```bash
cd backend
npm run dev
```

You should see:

```
Server running on port 3001
Connected to SQL Server
Database connection established
```

### Start the Frontend Development Server

Open a new terminal:

```bash
cd frontend
npm run dev
```

You should see:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
```

### Access the Application

Open your browser and navigate to: **http://localhost:3000**

## 📡 API Endpoints

### Dashboard

| Method | Endpoint               | Description           |
| ------ | ---------------------- | --------------------- |
| GET    | `/api/dashboard/stats` | Get system statistics |

### Students

| Method | Endpoint        | Description                      |
| ------ | --------------- | -------------------------------- |
| GET    | `/api/students` | Get all students with quota info |

### Instrument Types

| Method | Endpoint                | Description              |
| ------ | ----------------------- | ------------------------ |
| GET    | `/api/instrument-types` | Get all instrument types |

### Available Slots

| Method | Endpoint                                    | Description                  |
| ------ | ------------------------------------------- | ---------------------------- |
| GET    | `/api/available-slots`                      | Get available schedule slots |
| GET    | `/api/available-slots?instrumentTypeId=100` | Filter by instrument type    |
| GET    | `/api/available-slots?date=2025-11-10`      | Filter by date               |

### Bookings

| Method | Endpoint                      | Description          |
| ------ | ----------------------------- | -------------------- |
| GET    | `/api/bookings`               | Get all bookings     |
| GET    | `/api/bookings?status=Active` | Filter by status     |
| POST   | `/api/bookings`               | Create a new booking |
| POST   | `/api/bookings/:id/cancel`    | Cancel a booking     |
| POST   | `/api/bookings/:id/checkin`   | Process check-in     |
| POST   | `/api/bookings/:id/checkout`  | Process check-out    |

### Create Booking Request Body

```json
{
  "studentId": 2000,
  "scheduleIds": [3, 7]
}
```

## 🗃 Database Schema

### Core Tables

- **User** - Base user information (encrypted)
- **Student** - Student-specific data
- **Admin** - Administrator data
- **QuotaPlan** - Student access levels and penalty points
- **InstrumentType** - Types of instruments with access levels
- **Instrument** - Physical instruments
- **Location** - Building and room information
- **Schedule** - Time slots for instruments
- **Booking** - Reservation records
- **Booking_Line** - Links bookings to schedule slots
- **Penalty** - Penalty records
- **PenaltyRule** - Penalty definitions

### Key Stored Procedures

| Procedure                        | Description                          |
| -------------------------------- | ------------------------------------ |
| `SP_CreateBookingWithValidation` | Creates booking with full validation |
| `SP_ProcessCheckIn`              | Handles check-in with late penalty   |
| `SP_ProcessCheckOut`             | Handles check-out with late penalty  |
| `SP_CancelBooking`               | Cancels booking with penalty check   |
| `SP_CreateUser`                  | Creates new user with encryption     |

### Triggers

| Trigger                               | Description                                   |
| ------------------------------------- | --------------------------------------------- |
| `TR_UpdatePenaltyPoints`              | Auto-updates penalty points on penalty insert |
| `TR_Booking_Maintenance_StatusChange` | Frees schedule slots on booking cancellation  |
| `TR_Audit_Delete_User`                | Prevents user deletion, logs attempt          |
| `TR_Audit_Delete_Booking`             | Prevents booking deletion, logs attempt       |

## 🔧 Troubleshooting

### Backend won't connect to SQL Server

1. **Check Docker container is running:**

   ```bash
   docker ps
   ```

2. **Verify SQL Server is accessible:**

   ```bash
   docker exec -it sql_server /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'YourStrong@Passw0rd' -Q "SELECT 1"
   ```

3. **Check `.env` credentials match your setup**

### "Encryption key not found" errors

Ensure you've run the encryption setup script (`03_encryption.sql`) and that the symmetric keys exist:

```sql
SELECT * FROM sys.symmetric_keys;
```

### Frontend can't reach backend

1. Ensure backend is running on port 3001
2. Check browser console for CORS errors
3. Verify API URL in frontend components (`http://localhost:3001/api`)

### "Invalid time" errors when creating booking

The time format issue has been fixed. Ensure you're using the latest `server.js`.

## 🧪 Running Tests

A comprehensive test script is provided to verify all stored procedures:

```sql
-- Run in SQL Server
EXEC database/test_script.sql
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributors

- Your Name - Initial work

## 🙏 Acknowledgments

- Built as a Database Systems course project
- Uses Microsoft SQL Server with advanced features (encryption, triggers, stored procedures)
