import React from 'react';
import Layout from './layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import PatientDashboard from './dashboard/PatientDashboard';
import DoctorDashboard from './dashboard/DoctorDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  // Show loading state if user is not loaded yet
  if (!user) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  // Render role-specific dashboard
  const renderDashboardContent = () => {
    switch (user.role) {
      case 'doctor':
        return <DoctorDashboard />;
      case 'nurse':
        return <DoctorDashboard />; // Nurses can use the same doctor interface for now
      case 'admin':
        return <DoctorDashboard />; // Admins can use the same doctor interface for now
      case 'patient':
      default:
        return <PatientDashboard />;
    }
  };

  return (
    <Layout title="Dashboard">
      {renderDashboardContent()}
    </Layout>
  );
};

export default Dashboard;