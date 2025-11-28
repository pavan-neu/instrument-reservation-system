const express = require("express");
const sql = require("mssql");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// SQL Server configuration for Docker
const config = {
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "YourStrong@Passw0rd",
  server: process.env.DB_SERVER || "localhost",
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || "InstrumentReservationSystem",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Global connection pool
let pool;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log("Connected to SQL Server");
  }
  return pool;
}

// ============================================================
// DASHBOARD ENDPOINTS
// ============================================================

app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
            SELECT 
                (SELECT COUNT(*) FROM Student) AS totalStudents,
                (SELECT COUNT(*) FROM Instrument) AS totalInstruments,
                (SELECT COUNT(*) FROM Booking WHERE [Status] = 'Active') AS activeBookings,
                (SELECT COUNT(*) FROM Booking WHERE [Status] = 'Completed') AS completedBookings,
                (SELECT COUNT(*) FROM Schedule WHERE [Status] = 'Available') AS availableSlots,
                (SELECT COUNT(*) FROM QuotaPlan WHERE [Status] = 'Penalized') AS penalizedStudents
        `);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// STUDENTS ENDPOINTS
// ============================================================

app.get("/api/students", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
            OPEN SYMMETRIC KEY IRS_Deterministic_Key DECRYPTION BY CERTIFICATE IRS_Certificate;
            OPEN SYMMETRIC KEY IRS_Randomized_Key DECRYPTION BY CERTIFICATE IRS_Certificate;
            
            SELECT 
                s.StudentID,
                u.FirstName_Token + ' ' + u.LastName_Token AS StudentName,
                CONVERT(VARCHAR(255), DecryptByKey(u.Email_Encrypted)) AS Email,
                CONVERT(VARCHAR(100), DecryptByKey(s.Major_Encrypted)) AS Major,
                qp.AccessLevel_Decrypted AS AccessLevel,
                qp.PenaltyPoints,
                qp.[Status] AS QuotaStatus
            FROM Student s
            INNER JOIN [User] u ON s.StudentID = u.UserID
            OUTER APPLY (
                SELECT TOP 1 
                    CONVERT(CHAR(7), DecryptByKey(qp2.AccessLevel_Encrypted)) AS AccessLevel_Decrypted,
                    qp2.PenaltyPoints,
                    qp2.[Status]
                FROM QuotaPlan qp2
                WHERE qp2.StudentID = s.StudentID AND qp2.[Status] = 'Active'
                ORDER BY qp2.ExpirationDate DESC
            ) qp
            ORDER BY s.StudentID;
            
            CLOSE SYMMETRIC KEY IRS_Randomized_Key;
            CLOSE SYMMETRIC KEY IRS_Deterministic_Key;
        `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Get students error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// INSTRUMENT TYPES ENDPOINTS
// ============================================================

app.get("/api/instrument-types", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
            SELECT 
                InstrumentTypeID,
                Name,
                Model,
                Description,
                AccessLevel
            FROM InstrumentType
            ORDER BY AccessLevel, Name
        `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Get instrument types error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// AVAILABLE SLOTS ENDPOINTS
// ============================================================

app.get("/api/available-slots", async (req, res) => {
  try {
    const pool = await getPool();
    const { instrumentTypeId, date } = req.query;

    let query = `
            SELECT 
                s.ScheduleID,
                s.[Date],
                CONVERT(VARCHAR(8), s.StartTime, 108) AS StartTime,
                CONVERT(VARCHAR(8), s.EndTime, 108) AS EndTime,
                s.[Status],
                i.InstrumentID,
                it.InstrumentTypeID,
                it.Name AS InstrumentName,
                it.Model,
                it.AccessLevel,
                l.Building,
                l.RoomNo,
                l.Building + ' - ' + l.RoomNo AS Location
            FROM Schedule s
            INNER JOIN Instrument i ON s.InstrumentID = i.InstrumentID
            INNER JOIN InstrumentType it ON i.InstrumentTypeID = it.InstrumentTypeID
            INNER JOIN Location l ON i.LocationID = l.LocationID
            WHERE s.[Status] = 'Available'
        `;

    const request = pool.request();

    if (instrumentTypeId) {
      query += ` AND it.InstrumentTypeID = @instrumentTypeId`;
      request.input("instrumentTypeId", sql.Int, instrumentTypeId);
    }

    if (date) {
      query += ` AND s.[Date] = @date`;
      request.input("date", sql.Date, date);
    }

    query += ` ORDER BY s.[Date], s.StartTime, it.Name`;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("Get available slots error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// BOOKING ENDPOINTS
// ============================================================

// Get active bookings (My Bookings)
app.get("/api/bookings", async (req, res) => {
  try {
    const pool = await getPool();
    const { studentId, status } = req.query;

    let query = `
            OPEN SYMMETRIC KEY IRS_Deterministic_Key DECRYPTION BY CERTIFICATE IRS_Certificate;
            OPEN SYMMETRIC KEY IRS_Randomized_Key DECRYPTION BY CERTIFICATE IRS_Certificate;
            
            SELECT 
                b.BookingID,
                b.[Status] AS BookingStatus,
                b.BookedAt,
                b.StudentID,
                u.FirstName_Token + ' ' + u.LastName_Token AS StudentName,
                CONVERT(VARCHAR(255), DecryptByKey(u.Email_Encrypted)) AS StudentEmail,
                it.Name AS InstrumentName,
                it.Model,
                it.AccessLevel AS InstrumentAccessLevel,
                i.InstrumentID,
                s.ScheduleID,
                s.[Date] AS ScheduleDate,
                CONVERT(VARCHAR(8), s.StartTime, 108) AS StartTime,
                CONVERT(VARCHAR(8), s.EndTime, 108) AS EndTime,
                CONVERT(VARCHAR(8), DecryptByKey(b.CheckInTime_Encrypted)) AS CheckInTime,
                CONVERT(VARCHAR(8), DecryptByKey(b.CheckOutTime_Encrypted)) AS CheckOutTime,
                l.Building,
                l.RoomNo,
                l.Building + ' - ' + l.RoomNo AS Location
            FROM Booking b
            INNER JOIN [User] u ON b.StudentID = u.UserID
            INNER JOIN Booking_Line bl ON b.BookingID = bl.BookingID
            INNER JOIN Schedule s ON bl.ScheduleID = s.ScheduleID
            INNER JOIN Instrument i ON s.InstrumentID = i.InstrumentID
            INNER JOIN InstrumentType it ON i.InstrumentTypeID = it.InstrumentTypeID
            INNER JOIN Location l ON i.LocationID = l.LocationID
            WHERE 1=1
        `;

    const request = pool.request();

    if (studentId) {
      query += ` AND b.StudentID = @studentId`;
      request.input("studentId", sql.Int, studentId);
    }

    if (status) {
      query += ` AND b.[Status] = @status`;
      request.input("status", sql.VarChar(11), status);
    }

    query += `
            ORDER BY b.BookedAt DESC;
            
            CLOSE SYMMETRIC KEY IRS_Randomized_Key;
            CLOSE SYMMETRIC KEY IRS_Deterministic_Key;
        `;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("Get bookings error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create a new booking (supports multiple schedule slots)
app.post("/api/bookings", async (req, res) => {
  try {
    const pool = await getPool();
    const { studentId, scheduleIds } = req.body;

    // scheduleIds can be a single ID or an array
    // Convert to comma-separated string
    let scheduleIdsStr;
    if (Array.isArray(scheduleIds)) {
      scheduleIdsStr = scheduleIds.join(",");
    } else {
      scheduleIdsStr = String(scheduleIds);
    }

    const result = await pool
      .request()
      .input("StudentID", sql.Int, studentId)
      .input("ScheduleIDs", sql.VarChar(500), scheduleIdsStr)
      .output("NewBookingID", sql.Int)
      .execute("SP_CreateBookingWithValidation");

    res.json({
      success: true,
      bookingId: result.output.NewBookingID,
      message: "Booking created successfully!",
    });
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

// Cancel a booking
app.post("/api/bookings/:bookingId/cancel", async (req, res) => {
  try {
    const pool = await getPool();
    const { bookingId } = req.params;
    const { reason } = req.body;

    const result = await pool
      .request()
      .input("BookingID", sql.Int, bookingId)
      .input(
        "CancellationReason",
        sql.VarChar(255),
        reason || "Cancelled via UI"
      )
      .output("PenaltyIssued", sql.Bit)
      .execute("SP_CancelBooking");

    res.json({
      success: true,
      penaltyIssued: result.output.PenaltyIssued,
      message: result.output.PenaltyIssued
        ? "Booking cancelled. A penalty was issued for late cancellation."
        : "Booking cancelled successfully!",
    });
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

// ============================================================
// CHECK-IN / CHECK-OUT ENDPOINTS (Bonus)
// ============================================================

app.post("/api/bookings/:bookingId/checkin", async (req, res) => {
  try {
    const pool = await getPool();
    const { bookingId } = req.params;
    const { checkInTime } = req.body;

    // Helper function to convert time string to Date object
    const timeStringToDate = (timeStr) => {
      const parts = timeStr.split(":");
      const d = new Date();
      d.setHours(parseInt(parts[0], 10));
      d.setMinutes(parseInt(parts[1], 10));
      d.setSeconds(parts[2] ? parseInt(parts[2], 10) : 0);
      d.setMilliseconds(0);
      return d;
    };

    const result = await pool
      .request()
      .input("BookingID", sql.Int, bookingId)
      .input("ActualCheckInTime", sql.Time, timeStringToDate(checkInTime))
      .output("PenaltyIssued", sql.Bit)
      .execute("SP_ProcessCheckIn");

    res.json({
      success: true,
      penaltyIssued: result.output.PenaltyIssued,
      message: result.output.PenaltyIssued
        ? "Checked in. A late penalty was issued."
        : "Checked in successfully!",
    });
  } catch (err) {
    console.error("Check-in error:", err);
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post("/api/bookings/:bookingId/checkout", async (req, res) => {
  try {
    const pool = await getPool();
    const { bookingId } = req.params;
    const { checkOutTime } = req.body;

    // Helper function to convert time string to Date object
    const timeStringToDate = (timeStr) => {
      const parts = timeStr.split(":");
      const d = new Date();
      d.setHours(parseInt(parts[0], 10));
      d.setMinutes(parseInt(parts[1], 10));
      d.setSeconds(parts[2] ? parseInt(parts[2], 10) : 0);
      d.setMilliseconds(0);
      return d;
    };

    const result = await pool
      .request()
      .input("BookingID", sql.Int, bookingId)
      .input("ActualCheckOutTime", sql.Time, timeStringToDate(checkOutTime))
      .output("PenaltyIssued", sql.Bit)
      .execute("SP_ProcessCheckOut");

    res.json({
      success: true,
      penaltyIssued: result.output.PenaltyIssued,
      message: result.output.PenaltyIssued
        ? "Checked out. A late penalty was issued."
        : "Checked out successfully!",
    });
  } catch (err) {
    console.error("Check-out error:", err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// ============================================================
// SERVER START
// ============================================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await getPool();
    console.log("Database connection established");
  } catch (err) {
    console.error("Database connection failed:", err);
  }
});
