import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DoctorPortal from './pages/DoctorPortal';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientPortal from './pages/PatientPortal';
import ReportView from './pages/ReportView';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/doctor" element={<DoctorPortal />} />
      <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
      <Route path="/patient" element={<PatientPortal />} />
      <Route path="/report/:code" element={<ReportView />} />
    </Routes>
  );
}

export default App;
