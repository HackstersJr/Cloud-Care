import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import DoctorDashboard from './components/DoctorDashboard';
import LoginPage from './components/auth/LoginPage';
import DoctorLoginPage from './components/auth/DoctorLoginPage';
import Dashboard from './components/Dashboard';
import LinkedFacilities from './components/LinkedFacilities';
import Consents from './components/Consents';
import MyRecords from './components/MyRecords';
import ScanShare from './components/ScanShare';
import Wearables from './components/Wearables';
import Settings from './components/Settings';
import PatientDataLanding from './components/PatientDataLanding';
import { AuthProvider, useAuth } from './contexts/AuthContext';

export type UserType = 'abha' | 'doctor' | null;

// Main App Routes Component
function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showDoctorDashboard, setShowDoctorDashboard] = useState(false);
  const [showDoctorLogin, setShowDoctorLogin] = useState(false);

  const handleLogin = (userType: UserType) => {
    if (userType === 'doctor') {
      setShowDoctorLogin(true);
    }
  };

  const handleDoctorLoginSuccess = () => {
    setShowDoctorLogin(false);
    setShowDoctorDashboard(true);
  };

  const handleBackToLanding = () => {
    setShowDoctorLogin(false);
  };

  const handleAbhaLoginFromDoctor = () => {
    setShowDoctorLogin(false);
    // Navigate to ABHA login page
    navigate('/login');
  };

  const handleLogout = () => {
    setShowDoctorDashboard(false);
    setShowDoctorLogin(false);
  };

  // If user is authenticated (ABHA user), show the PWA routes
  if (isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/facilities" element={<LinkedFacilities />} />
        <Route path="/consents" element={<Consents />} />
        <Route path="/records" element={<MyRecords />} />
        <Route path="/scan" element={<ScanShare />} />
        <Route path="/wearables" element={<Wearables />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/patient-data" element={<PatientDataLanding />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // If doctor login page should be shown
  if (showDoctorLogin) {
    return (
      <DoctorLoginPage
        onLogin={handleDoctorLoginSuccess}
        onBack={handleBackToLanding}
        onAbhaLogin={handleAbhaLoginFromDoctor}
      />
    );
  }

  // If doctor is logged in, show doctor dashboard
  if (showDoctorDashboard) {
    return <DoctorDashboard onLogout={handleLogout} />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage onLogin={handleLogin} />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/patient-data" element={<PatientDataLanding />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
