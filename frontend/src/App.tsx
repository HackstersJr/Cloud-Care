import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import DoctorDashboard from './components/dashboard/DoctorDashboard';
import LoginPage from './components/auth/LoginPage';
import StandardLoginPage from './components/auth/StandardLoginPage';
import RegisterPage from './components/auth/RegisterPage';
import DoctorLoginPage from './components/auth/DoctorLoginPage';
import Dashboard from './components/Dashboard';
import LinkedFacilities from './components/LinkedFacilities';
import Consents from './components/Consents';
import MyRecords from './components/MyRecords';
import ScanShare from './components/ScanShare';
import Wearables from './components/Wearables';
import Settings from './components/Settings';
import Profile from './components/Profile';
import PatientDataLanding from './components/PatientDataLanding';
import PatientRecordsView from './components/PatientRecordsView';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';

export type UserType = 'abha' | 'doctor' | null;

// Main App Routes Component
function AppRoutes() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (userType: UserType) => {
    if (userType === 'doctor') {
      navigate('/doctor-login');
    } else {
      navigate('/abha-login');
    }
  };

  const handleBackToLanding = () => {
    navigate('/');
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute requireAuth={false}>
            <LandingPage onLogin={handleLogin} />
          </ProtectedRoute>
        } 
      />
      
      {/* Authentication Routes */}
      <Route 
        path="/login" 
        element={
          <ProtectedRoute requireAuth={false}>
            <StandardLoginPage onBack={handleBackToLanding} />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/register" 
        element={
          <ProtectedRoute requireAuth={false}>
            <RegisterPage onBack={handleBackToLanding} />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/abha-login" 
        element={
          <ProtectedRoute requireAuth={false}>
            <LoginPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/doctor-login" 
        element={
          <ProtectedRoute requireAuth={false}>
            <DoctorLoginPage 
              onBack={handleBackToLanding} 
              onAbhaLogin={() => navigate('/abha-login')}
            />
          </ProtectedRoute>
        } 
      />

      {/* Protected Patient Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/facilities" 
        element={
          <ProtectedRoute>
            <LinkedFacilities />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/consents" 
        element={
          <ProtectedRoute>
            <Consents />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/records" 
        element={
          <ProtectedRoute>
            <MyRecords />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/scan" 
        element={
          <ProtectedRoute>
            <ScanShare />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/wearables" 
        element={
          <ProtectedRoute>
            <Wearables />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />

      {/* Protected Doctor Routes */}
      <Route 
        path="/doctor-dashboard" 
        element={
          <ProtectedRoute>
            {user?.role === 'doctor' ? (
              <DoctorDashboard />
            ) : (
              <Navigate to="/dashboard" replace />
            )}
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/patient-records" 
        element={
          <ProtectedRoute>
            {user?.role === 'doctor' ? (
              <PatientRecordsView />
            ) : (
              <Navigate to="/dashboard" replace />
            )}
          </ProtectedRoute>
        } 
      />

      {/* Public Patient Data Access */}
      <Route path="/patient-data" element={<PatientDataLanding />} />

      {/* Fallback Route */}
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
