import { useState, useEffect } from "react";

const API_URL = "http://localhost:3001/api";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/dashboard/stats`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  const statCards = [
    {
      label: "Total Students",
      value: stats?.totalStudents || 0,
      icon: "👨‍🎓",
      color: "#3498db",
    },
    {
      label: "Total Instruments",
      value: stats?.totalInstruments || 0,
      icon: "🔬",
      color: "#9b59b6",
    },
    {
      label: "Active Bookings",
      value: stats?.activeBookings || 0,
      icon: "📅",
      color: "#2ecc71",
    },
    {
      label: "Completed Bookings",
      value: stats?.completedBookings || 0,
      icon: "✅",
      color: "#27ae60",
    },
    {
      label: "Available Slots",
      value: stats?.availableSlots || 0,
      icon: "🕐",
      color: "#f39c12",
    },
    {
      label: "Penalized Students",
      value: stats?.penalizedStudents || 0,
      icon: "⚠️",
      color: "#e74c3c",
    },
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of the Instrument Reservation System</p>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="stat-card"
            style={{ borderLeftColor: stat.color }}
          >
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-info">
        <div className="info-card">
          <h3>🎯 Quick Actions</h3>
          <ul>
            <li>
              Browse <strong>Available Slots</strong> to see open time slots
            </li>
            <li>
              Use <strong>Create Booking</strong> to reserve an instrument
            </li>
            <li>
              View and cancel bookings in <strong>My Bookings</strong>
            </li>
          </ul>
        </div>

        <div className="info-card">
          <h3>📋 Access Levels</h3>
          <ul>
            <li>
              <span className="badge level-01">Level 01</span> Basic instruments
              (Microscope, Balance, pH Meter)
            </li>
            <li>
              <span className="badge level-02">Level 02</span> Intermediate
              (Spectrometer, Centrifuge, HPLC)
            </li>
            <li>
              <span className="badge level-03">Level 03</span> Advanced (PCR,
              NMR, Mass Spec, SEM)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
