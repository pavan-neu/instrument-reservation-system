import { useState } from "react";
import Dashboard from "./components/Dashboard";
import AvailableSlots from "./components/AvailableSlots";
import CreateBooking from "./components/CreateBooking";
import MyBookings from "./components/MyBookings";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setCurrentPage("create-booking");
  };

  const handleBookingCreated = () => {
    setSelectedSlot(null);
    setRefreshKey((prev) => prev + 1);
    setCurrentPage("my-bookings");
  };

  const handleBookingCancelled = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard key={refreshKey} />;
      case "available-slots":
        return (
          <AvailableSlots key={refreshKey} onSlotSelect={handleSlotSelect} />
        );
      case "create-booking":
        return (
          <CreateBooking
            selectedSlot={selectedSlot}
            onBookingCreated={handleBookingCreated}
            onCancel={() => setCurrentPage("available-slots")}
          />
        );
      case "my-bookings":
        return (
          <MyBookings
            key={refreshKey}
            onBookingCancelled={handleBookingCancelled}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🔬 Instrument Reservation System</h1>
          <p className="header-subtitle">Laboratory Equipment Booking Portal</p>
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-btn ${currentPage === "dashboard" ? "active" : ""}`}
          onClick={() => setCurrentPage("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-btn ${
            currentPage === "available-slots" ? "active" : ""
          }`}
          onClick={() => setCurrentPage("available-slots")}
        >
          📅 Available Slots
        </button>
        <button
          className={`nav-btn ${
            currentPage === "create-booking" ? "active" : ""
          }`}
          onClick={() => setCurrentPage("create-booking")}
        >
          ➕ Create Booking
        </button>
        <button
          className={`nav-btn ${currentPage === "my-bookings" ? "active" : ""}`}
          onClick={() => setCurrentPage("my-bookings")}
        >
          📋 My Bookings
        </button>
      </nav>

      <main className="app-main">{renderPage()}</main>

      <footer className="app-footer">
        <p>Instrument Reservation System © 2025 | Database Systems Project</p>
      </footer>
    </div>
  );
}

export default App;
