import React from 'react';
import Layout from './layout/Layout';
import { Activity, Users, FileText, Shield, Smartphone } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { label: 'Linked Facilities', value: '5', icon: Users, color: 'bg-blue-500' },
    { label: 'Health Records', value: '23', icon: FileText, color: 'bg-green-500' },
    { label: 'Pending Consents', value: '3', icon: Shield, color: 'bg-orange-500' },
    { label: 'Connected Devices', value: '2', icon: Smartphone, color: 'bg-purple-500' }
  ];

  const recentActivity = [
    { title: 'Health record shared with Archana Eye Clinic', time: '2 hours ago', type: 'share' },
    { title: 'New consent request from Dr Lal Pathlabs', time: '1 day ago', type: 'consent' },
    { title: 'Fitbit data synced successfully', time: '2 days ago', type: 'device' },
    { title: 'Lab report uploaded', time: '3 days ago', type: 'upload' }
  ];

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
          <p className="text-blue-100">Your health information is secure and up to date.</p>
          <div className="mt-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            <span className="text-sm">Last sync: Just now</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow text-left">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">Link Facility</h4>
            <p className="text-sm text-gray-600 mt-1">Connect with healthcare providers</p>
          </button>
          
          <button className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow text-left">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900">View Records</h4>
            <p className="text-sm text-gray-600 mt-1">Access your health records</p>
          </button>
          
          <button className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow text-left">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <Smartphone className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900">Connect Device</h4>
            <p className="text-sm text-gray-600 mt-1">Sync wearable devices</p>
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;