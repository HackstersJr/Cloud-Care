import React, { useState } from 'react';
import { 
  Heart, Users, Activity, FileText, TrendingUp, 
  Calendar, Bell, Settings, LogOut, User, 
  Stethoscope, Pill, TestTube
} from 'lucide-react';
import DashboardHeader from './DashboardHeader';
import MetricsCard from './MetricsCard';
import DiseaseChart from './DiseaseChart';
import PatientChart from './PatientChart';
import StateWiseChart from './StateWiseChart';
import TrendChart from './TrendChart';

interface DoctorDashboardProps {
  onLogout: () => void;
}

export default function DoctorDashboard({ onLogout }: DoctorDashboardProps) {
  const [activeTab, setActiveTab] = useState('health-insights');

  const tabs = [
    { id: 'health-insights', label: 'Health Insights' },
    { id: 'patient-records', label: 'Patient Records' },
    { id: 'disease-analysis', label: 'Disease Analysis' },
    { id: 'reports', label: 'Medical Reports' },
    { id: 'appointments', label: 'Appointments' }
  ];

  const metrics = [
    {
      title: 'Total Patients',
      value: '2,845',
      change: '+12.5%',
      period: 'Today',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Active Cases',
      value: '1,247',
      change: '+8.2%',
      period: 'Current Month',
      icon: Activity,
      color: 'green'
    },
    {
      title: 'Critical Patients',
      value: '23',
      change: '-2.1%',
      period: 'Today',
      icon: Heart,
      color: 'red'
    },
    {
      title: 'Reports Generated',
      value: '156',
      change: '+15.3%',
      period: 'Today',
      icon: FileText,
      color: 'orange'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader onLogout={onLogout} />
      
      {/* Navigation Tabs */}
      <nav className="bg-blue-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 whitespace-nowrap text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-400 text-white'
                    : 'border-transparent text-blue-100 hover:text-white hover:border-blue-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <div className="flex-1"></div>
            <div className="flex items-center text-white text-sm py-4">
              Last Updated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <MetricsCard key={index} {...metric} />
          ))}
        </div>

        {/* State-wise Analytics */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">State/UT - wise Health Analytics</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Absolute</span>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input type="checkbox" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                  <label className="toggle-label block overflow-hidden h-6 rounded-full bg-orange-400 cursor-pointer"></label>
                </div>
                <span className="text-sm text-gray-600">Saturation</span>
              </div>
            </div>
          </div>
          
          <StateWiseChart />
        </div>

        {/* Disease Analysis Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Disease Distribution Analysis</h2>
          <div className="grid lg:grid-cols-2 gap-6">
            <DiseaseChart />
            <PatientChart />
          </div>
        </div>

        {/* Health Reports Trend */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Health Reports Trend</h2>
          <TrendChart />
        </div>
      </main>
    </div>
  );
}