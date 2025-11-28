import { useState, useEffect } from "react";

const API_URL = "http://localhost:3001/api";

function MyBookings({ onBookingCancelled }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/bookings`;
      if (statusFilter) {
        url += `?status=${statusFilter}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch bookings");
      const data = await response.json();
      setBookings(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    setCancellingId(bookingId);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by user via UI" }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: data.message,
        });
        fetchBookings();
        onBookingCancelled();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to cancel booking",
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message,
      });
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === "-") return "-";

    // Handle different time formats from SQL Server
    // Could be "HH:MM:SS", "HH:MM:SS.SSSSSSS", or Date object
    let timeValue = timeStr;

    // If it's a date string containing 'T', extract time part
    if (typeof timeStr === "string" && timeStr.includes("T")) {
      timeValue = timeStr.split("T")[1].split(".")[0];
    }

    // If it's a Date object
    if (timeStr instanceof Date) {
      const hours = timeStr.getHours();
      const minutes = timeStr.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const hour12 = hours % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }

    // Parse string format "HH:MM:SS" or "HH:MM"
    const parts = String(timeValue).split(":");
    if (parts.length < 2) return "-";

    const hours = parseInt(parts[0], 10);
    const minutes = parts[1].substring(0, 2); // Take only first 2 chars

    if (isNaN(hours)) return "-";

    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "";
    const date = new Date(dateTimeStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      Active: "status-active",
      Completed: "status-completed",
      Canceled: "status-canceled",
      Unfulfilled: "status-unfulfilled",
    };
    return (
      <span className={`status-badge ${statusClasses[status] || ""}`}>
        {status}
      </span>
    );
  };

  const getAccessLevelBadge = (level) => {
    if (!level) return null;
    const className = `badge level-${level.slice(-2).toLowerCase()}`;
    return <span className={className}>{level}</span>;
  };

  return (
    <div className="my-bookings">
      <div className="page-header">
        <h2>My Bookings</h2>
        <p>View and manage all bookings</p>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label htmlFor="status">Filter by Status:</label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Canceled">Canceled</option>
            <option value="Unfulfilled">Unfulfilled</option>
          </select>
        </div>

        <button className="btn-primary" onClick={fetchBookings}>
          🔄 Refresh
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.type === "success" ? "✅" : "❌"} {message.text}
        </div>
      )}

      {loading && <div className="loading">Loading bookings...</div>}

      {error && <div className="error">Error: {error}</div>}

      {!loading && !error && (
        <>
          <div className="bookings-count">
            Showing <strong>{bookings.length}</strong> booking
            {bookings.length !== 1 ? "s" : ""}
          </div>

          {bookings.length === 0 ? (
            <div className="no-data">
              <p>No bookings found.</p>
              <p>
                Go to <strong>Available Slots</strong> to make a booking.
              </p>
            </div>
          ) : (
            <div className="bookings-table-container">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Student</th>
                    <th>Instrument</th>
                    <th>Date & Time</th>
                    <th>Location</th>
                    <th>Check-In</th>
                    <th>Check-Out</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.BookingID}>
                      <td>
                        <strong>#{booking.BookingID}</strong>
                      </td>
                      <td>
                        <div className="student-cell">
                          <div>{booking.StudentName}</div>
                          <small>{booking.StudentEmail}</small>
                        </div>
                      </td>
                      <td>
                        <div className="instrument-cell">
                          <div>{booking.InstrumentName}</div>
                          <small>{booking.Model}</small>
                          {getAccessLevelBadge(booking.InstrumentAccessLevel)}
                        </div>
                      </td>
                      <td>
                        <div className="datetime-cell">
                          <div>{formatDate(booking.ScheduleDate)}</div>
                          <small>
                            {formatTime(booking.StartTime)} -{" "}
                            {formatTime(booking.EndTime)}
                          </small>
                        </div>
                      </td>
                      <td>{booking.Location}</td>
                      <td>{formatTime(booking.CheckInTime)}</td>
                      <td>{formatTime(booking.CheckOutTime)}</td>
                      <td>{getStatusBadge(booking.BookingStatus)}</td>
                      <td>
                        {booking.BookingStatus === "Active" && (
                          <button
                            className="btn-danger btn-sm"
                            onClick={() => handleCancel(booking.BookingID)}
                            disabled={cancellingId === booking.BookingID}
                          >
                            {cancellingId === booking.BookingID
                              ? "Cancelling..."
                              : "❌ Cancel"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MyBookings;
