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
      <div className="min-h-screen bg-[#F5F0E5] text-[#343B30] flex flex-col font-sans selection:bg-[#697C58] selection:text-white">
        <Navbar />
        <main className="flex-1 flex flex-col min-h-0">
          <Routes>
            <Route path="/" element={<ReportIncidentPage />} />
            <Route path="/track" element={<TrackReportPage />} />

            <Route path="/operator/login" element={<OperatorLoginPage />} />
            <Route path="/operator/dashboard" element={<OperatorDashboard />} />

            <Route path="/analytics" element={<AnalyticsPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="shrink-0 border-t border-[#DFD8C8] bg-[#FCFAF6] py-3 text-xs text-[#5A6354]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#343B30]">DECTS</span>
              <span className="text-[#DFD8C8]">&bull;</span>
              <span>Emergency Coordination</span>
            </div>
            <div className="text-[11px] text-[#5A6354]">
              Dehradun District Operational Platform &bull; Real-time Incident Dispatch
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
