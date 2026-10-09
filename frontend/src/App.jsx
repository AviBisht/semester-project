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
      <div className="min-h-screen bg-[#191817] text-[#F0E6D8] flex flex-col font-sans selection:bg-[#C47A35] selection:text-[#191817]">
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
        <footer className="border-t border-[#594538]/50 bg-[#242321] py-4 text-center text-xs text-[#B5A493]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>&copy; {new Date().getFullYear()} Flood & Emergency Incident Reporting System &bull; Dehradun District</span>
            <span className="text-[11px] text-[#B5A493]/70">College Mini-Project &bull; Leaflet &bull; FastAPI &bull; SQLite</span>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
