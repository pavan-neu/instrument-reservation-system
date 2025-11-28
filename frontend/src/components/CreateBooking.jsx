import { useState, useEffect } from "react";

const API_URL = "http://localhost:3001/api";

function CreateBooking({ selectedSlot, onBookingCreated, onCancel }) {
  const [students, setStudents] = useState([]);
  const [instrumentTypes, setInstrumentTypes] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedInstrumentType, setSelectedInstrumentType] = useState(
    selectedSlot?.InstrumentTypeID?.toString() || ""
  );
  const [selectedSlotId, setSelectedSlotId] = useState(
    selectedSlot?.ScheduleID?.toString() || ""
  );

  useEffect(() => {
    fetchStudents();
    fetchInstrumentTypes();
  }, []);

  useEffect(() => {
    if (selectedInstrumentType) {
      fetchAvailableSlots(selectedInstrumentType);
    } else {
      setAvailableSlots([]);
    }
  }, [selectedInstrumentType]);

  // Pre-select slot if coming from Available Slots page
  useEffect(() => {
    if (selectedSlot) {
      setSelectedInstrumentType(selectedSlot.InstrumentTypeID.toString());
      setSelectedSlotId(selectedSlot.ScheduleID.toString());
    }
  }, [selectedSlot]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/students`);
      if (!response.ok) throw new Error("Failed to fetch students");
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstrumentTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/instrument-types`);
      if (!response.ok) throw new Error("Failed to fetch instrument types");
      const data = await response.json();
      setInstrumentTypes(data);
    } catch (err) {
      console.error("Error fetching instrument types:", err);
    }
  };

  const fetchAvailableSlots = async (instrumentTypeId) => {
    try {
      const response = await fetch(
        `${API_URL}/available-slots?instrumentTypeId=${instrumentTypeId}`
      );
      if (!response.ok) throw new Error("Failed to fetch slots");
      const data = await response.json();
      setAvailableSlots(data);
    } catch (err) {
      console.error("Error fetching slots:", err);
    }
  };

  const formatDateTime = (slot) => {
    const date = new Date(slot.Date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const startTime = formatTime(slot.StartTime);
    const endTime = formatTime(slot.EndTime);
    return `${date} | ${startTime} - ${endTime} | ${slot.Location}`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    const hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStudentAccessLevel = (studentId) => {
    const student = students.find((s) => s.StudentID.toString() === studentId);
    return student?.AccessLevel || null;
  };

  const getInstrumentAccessLevel = (typeId) => {
    const type = instrumentTypes.find(
      (t) => t.InstrumentTypeID.toString() === typeId
    );
    return type?.AccessLevel || null;
  };

  const isAccessLevelSufficient = () => {
    if (!selectedStudent || !selectedInstrumentType) return true;

    const studentLevel = getStudentAccessLevel(selectedStudent);
    const instrumentLevel = getInstrumentAccessLevel(selectedInstrumentType);

    if (!studentLevel || !instrumentLevel) return true;

    const studentNum = parseInt(studentLevel.slice(-2));
    const instrumentNum = parseInt(instrumentLevel.slice(-2));

    return studentNum >= instrumentNum;
  };

  const getSelectedStudentInfo = () => {
    return students.find((s) => s.StudentID.toString() === selectedStudent);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStudent || !selectedSlotId) {
      setError("Please select a student and a time slot");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: parseInt(selectedStudent),
          scheduleIds: [parseInt(selectedSlotId)], // Array to support multiple slots
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(
          `Booking created successfully! Booking ID: ${data.bookingId}`
        );
        setTimeout(() => {
          onBookingCreated();
        }, 1500);
      } else {
        setError(data.error || "Failed to create booking");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const studentInfo = getSelectedStudentInfo();
  const accessWarning = !isAccessLevelSufficient();

  return (
    <div className="create-booking">
      <div className="page-header">
        <h2>Create Booking</h2>
        <p>Reserve an instrument time slot</p>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <form onSubmit={handleSubmit} className="booking-form">
          {/* Student Selection */}
          <div className="form-group">
            <label htmlFor="student">Select Student: *</label>
            <select
              id="student"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              required
            >
              <option value="">-- Choose a Student --</option>
              {students.map((student) => (
                <option
                  key={student.StudentID}
                  value={student.StudentID}
                  disabled={student.QuotaStatus === "Penalized"}
                >
                  {student.StudentName} - {student.Major || "N/A"}(
                  {student.AccessLevel || "No Plan"})
                  {student.QuotaStatus === "Penalized" ? " ⚠️ PENALIZED" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Student Info Card */}
          {studentInfo && (
            <div className={`info-card ${accessWarning ? "warning" : ""}`}>
              <h4>Student Information</h4>
              <p>
                <strong>Name:</strong> {studentInfo.StudentName}
              </p>
              <p>
                <strong>Email:</strong> {studentInfo.Email}
              </p>
              <p>
                <strong>Major:</strong> {studentInfo.Major || "N/A"}
              </p>
              <p>
                <strong>Access Level:</strong>{" "}
                {studentInfo.AccessLevel || "None"}
              </p>
              <p>
                <strong>Penalty Points:</strong>{" "}
                {studentInfo.PenaltyPoints || 0}
              </p>
              <p>
                <strong>Status:</strong>
                <span
                  className={`status-badge ${studentInfo.QuotaStatus?.toLowerCase()}`}
                >
                  {studentInfo.QuotaStatus || "No Active Plan"}
                </span>
              </p>
            </div>
          )}

          {/* Instrument Type Selection */}
          <div className="form-group">
            <label htmlFor="instrumentType">Select Instrument Type: *</label>
            <select
              id="instrumentType"
              value={selectedInstrumentType}
              onChange={(e) => {
                setSelectedInstrumentType(e.target.value);
                setSelectedSlotId("");
              }}
              required
            >
              <option value="">-- Choose an Instrument Type --</option>
              {instrumentTypes.map((type) => (
                <option
                  key={type.InstrumentTypeID}
                  value={type.InstrumentTypeID}
                >
                  {type.Name} ({type.Model}) - {type.AccessLevel}
                </option>
              ))}
            </select>
          </div>

          {/* Access Level Warning */}
          {accessWarning && (
            <div className="alert alert-warning">
              ⚠️ <strong>Warning:</strong> Student's access level (
              {getStudentAccessLevel(selectedStudent)}) is lower than the
              instrument requirement (
              {getInstrumentAccessLevel(selectedInstrumentType)}). This booking
              will be rejected.
            </div>
          )}

          {/* Time Slot Selection */}
          <div className="form-group">
            <label htmlFor="slot">Select Time Slot: *</label>
            <select
              id="slot"
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
              required
              disabled={!selectedInstrumentType || availableSlots.length === 0}
            >
              <option value="">
                {!selectedInstrumentType
                  ? "-- Select an instrument type first --"
                  : availableSlots.length === 0
                  ? "-- No available slots --"
                  : "-- Choose a Time Slot --"}
              </option>
              {availableSlots.map((slot) => (
                <option key={slot.ScheduleID} value={slot.ScheduleID}>
                  {formatDateTime(slot)}
                </option>
              ))}
            </select>
          </div>

          {/* Error/Success Messages */}
          {error && <div className="alert alert-error">❌ {error}</div>}
          {success && <div className="alert alert-success">✅ {success}</div>}

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || accessWarning}
            >
              {submitting ? "Creating..." : "📝 Create Booking"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default CreateBooking;
