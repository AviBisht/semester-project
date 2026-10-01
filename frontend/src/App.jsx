import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ReportIncidentPage from './pages/ReportIncidentPage';
import TrackReportPage from './pages/TrackReportPage';
import OperatorLoginPage from './pages/OperatorLoginPage';
import OperatorDashboard from './pages/OperatorDashboard';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#FAF7F2] text-[#1F3A4D] flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public citizen routes */}
            <Route path="/" element={<ReportIncidentPage />} />
            <Route path="/track" element={<TrackReportPage />} />

            {/* Operator portal routes */}
            <Route path="/operator/login" element={<OperatorLoginPage />} />
            <Route path="/operator/dashboard" element={<OperatorDashboard />} />

            {/* Analytics */}
            <Route path="/analytics" element={<AnalyticsPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="border-t border-[#E8E2D9] bg-[#FFFFFF] py-4 text-center text-xs text-gray-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>&copy; {new Date().getFullYear()} Flood & Emergency Incident Reporting System &bull; Dehradun District</span>
            <span className="text-[11px] text-gray-400">College Mini-Project &bull; Leaflet &bull; FastAPI &bull; SQLite</span>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
