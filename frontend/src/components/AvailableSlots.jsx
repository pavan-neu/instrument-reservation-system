import { useState, useEffect } from "react";

const API_URL = "http://localhost:3001/api";

function AvailableSlots({ onSlotSelect }) {
  const [slots, setSlots] = useState([]);
  const [instrumentTypes, setInstrumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedType, setSelectedType] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    fetchInstrumentTypes();
    fetchSlots();
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [selectedType, selectedDate]);

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

  const fetchSlots = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/available-slots`;
      const params = new URLSearchParams();

      if (selectedType) params.append("instrumentTypeId", selectedType);
      if (selectedDate) params.append("date", selectedDate);

      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch slots");
      const data = await response.json();
      setSlots(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";

    // Handle different time formats from SQL Server
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
    if (parts.length < 2) return "";

    const hours = parseInt(parts[0], 10);
    const minutes = parts[1].substring(0, 2);

    if (isNaN(hours)) return "";

    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
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

  const getAccessLevelBadge = (level) => {
    const className = `badge level-${level.slice(-2).toLowerCase()}`;
    return <span className={className}>{level}</span>;
  };

  const handleBookSlot = (slot) => {
    onSlotSelect(slot);
  };

  const clearFilters = () => {
    setSelectedType("");
    setSelectedDate("");
  };

  return (
    <div className="available-slots">
      <div className="page-header">
        <h2>Available Slots</h2>
        <p>Browse and book available instrument time slots</p>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label htmlFor="instrumentType">Instrument Type:</label>
          <select
            id="instrumentType"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">All Instruments</option>
            {instrumentTypes.map((type) => (
              <option key={type.InstrumentTypeID} value={type.InstrumentTypeID}>
                {type.Name} ({type.Model}) - {type.AccessLevel}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <button className="btn-secondary" onClick={clearFilters}>
          Clear Filters
        </button>

        <button className="btn-primary" onClick={fetchSlots}>
          🔄 Refresh
        </button>
      </div>

      {loading && <div className="loading">Loading available slots...</div>}

      {error && <div className="error">Error: {error}</div>}

      {!loading && !error && (
        <>
          <div className="slots-count">
            Found <strong>{slots.length}</strong> available slot
            {slots.length !== 1 ? "s" : ""}
          </div>

          {slots.length === 0 ? (
            <div className="no-data">
              <p>No available slots found matching your criteria.</p>
              <p>Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <div className="slots-grid">
              {slots.map((slot) => (
                <div key={slot.ScheduleID} className="slot-card">
                  <div className="slot-header">
                    <h3>{slot.InstrumentName}</h3>
                    {getAccessLevelBadge(slot.AccessLevel)}
                  </div>

                  <div className="slot-details">
                    <div className="slot-detail">
                      <span className="detail-icon">📅</span>
                      <span>{formatDate(slot.Date)}</span>
                    </div>
                    <div className="slot-detail">
                      <span className="detail-icon">🕐</span>
                      <span>
                        {formatTime(slot.StartTime)} -{" "}
                        {formatTime(slot.EndTime)}
                      </span>
                    </div>
                    <div className="slot-detail">
                      <span className="detail-icon">📍</span>
                      <span>{slot.Location}</span>
                    </div>
                    <div className="slot-detail">
                      <span className="detail-icon">🔧</span>
                      <span>Model: {slot.Model}</span>
                    </div>
                  </div>

                  <button
                    className="btn-book"
                    onClick={() => handleBookSlot(slot)}
                  >
                    📝 Book This Slot
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AvailableSlots;
