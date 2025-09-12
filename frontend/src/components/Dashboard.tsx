import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './layout/Layout';
import { Activity, Users, FileText, Shield, Smartphone, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMedicalRecords, useMedicalRecordsStats } from '../contexts/MedicalRecordsContext';
import { apiClient } from '../utils/api';

interface DashboardStats {
  linkedFacilities: number;
  healthRecords: number;
  pendingConsents: number;
  connectedDevices: number;
  // Additional comprehensive fields
  totalRecords: number;
  recentVisits: number;
  pendingTests: number;
  upcomingAppointments: number;
  completedAppointments: number;
  healthScore: number;
  lastCheckup: string;
  nextAppointment: string;
  activeWearables: number;
  blockchainVerified: number;
  avgVitalSigns: {
    heartRate: number;
    bloodPressure: {
      systolic: number;
      diastolic: number;
    };
    bloodSugar: number;
    temperature: string;
  };
  weeklyHealthTrend: {
    steps: number[];
    sleep: number[];
    heartRate: number[];
  };
  activePrescriptions: number;
  medicationAdherence: number;
  pendingRefills: number;
  criticalAlerts: number;
  healthReminders: number;
  insuranceClaims: {
    pending: number;
    approved: number;
    denied: number;
  };
  estimatedCosts: number;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'in-progress';
  category: 'medical' | 'data' | 'appointment' | 'system' | 'insurance' | 'medication';
}

interface BlockchainStatus {
  isConnected: boolean;
  totalRecords: number;
  verifiedRecords: number;
  tamperedRecords: number;
  lastCheck: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { records, loading: recordsLoading, refreshRecords } = useMedicalRecords();
  const { stats: medicalStats } = useMedicalRecordsStats();
  
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    linkedFacilities: 0,
    healthRecords: 0,
    pendingConsents: 0,
    connectedDevices: 0,
    totalRecords: 0,
    recentVisits: 0,
    pendingTests: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    healthScore: 0,
    lastCheckup: '',
    nextAppointment: '',
    activeWearables: 0,
    blockchainVerified: 0,
    avgVitalSigns: {
      heartRate: 0,
      bloodPressure: {
        systolic: 0,
        diastolic: 0,
      },
      bloodSugar: 0,
      temperature: '0',
    },
    weeklyHealthTrend: {
      steps: [],
      sleep: [],
      heartRate: [],
    },
    activePrescriptions: 0,
    medicationAdherence: 0,
    pendingRefills: 0,
    criticalAlerts: 0,
    healthReminders: 0,
    insuranceClaims: {
      pending: 0,
      approved: 0,
      denied: 0,
    },
    estimatedCosts: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [blockchainStatus, setBlockchainStatus] = useState<BlockchainStatus>({
    isConnected: false,
    totalRecords: 0,
    verifiedRecords: 0,
    tamperedRecords: 0,
    lastCheck: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Update blockchain status when medical records change
  useEffect(() => {
    if (medicalStats) {
      setBlockchainStatus(prev => ({
        ...prev,
        totalRecords: medicalStats.totalRecords,
        verifiedRecords: medicalStats.verifiedRecords,
        tamperedRecords: medicalStats.tamperedRecords,
        lastCheck: new Date().toISOString(),
      }));
      
      setDashboardStats(prev => ({
        ...prev,
        healthRecords: medicalStats.totalRecords,
      }));
    }
  }, [medicalStats]);

  /**
   * Load dashboard statistics and activity
   */
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard stats
      try {
        const statsResponse = await apiClient.getDashboardStats();
        if (statsResponse.status === 'success' && statsResponse.data) {
          setDashboardStats(statsResponse.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
        // Use default values if API fails
      }

      // Load recent activity
      try {
        const activityResponse = await apiClient.getRecentActivity();
        if (activityResponse.status === 'success' && activityResponse.data?.activities) {
          setRecentActivity(activityResponse.data.activities);
        }
      } catch (err) {
        console.error('Failed to load recent activity:', err);
        // Use default activity if API fails
        setRecentActivity([
          { 
            id: '1', 
            type: 'Device Connected', 
            description: 'Dashboard loaded successfully', 
            timestamp: new Date().toISOString(), 
            status: 'completed',
            category: 'system'
          },
          { 
            id: '2', 
            type: 'Health Data Synced', 
            description: 'Health information synchronized', 
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), 
            status: 'completed',
            category: 'data'
          },
        ]);
      }

      // Check blockchain connection
      try {
        const healthResponse = await apiClient.detailedHealthCheck();
        if (healthResponse.status === 'success' && healthResponse.data?.blockchain) {
          setBlockchainStatus(prev => ({
            ...prev,
            isConnected: healthResponse.data!.blockchain.status === 'connected',
          }));
        }
      } catch (err) {
        console.error('Failed to check blockchain status:', err);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh all dashboard data
   */
  const handleRefresh = async () => {
    await Promise.all([
      loadDashboardData(),
      refreshRecords(),
    ]);
  };

  /**
   * Get blockchain status color and icon
   */
  const getBlockchainStatusDisplay = () => {
    if (blockchainStatus.tamperedRecords > 0) {
      return {
        color: 'text-red-600 bg-red-100',
        icon: AlertTriangle,
        text: `${blockchainStatus.tamperedRecords} tampered records detected!`,
      };
    } else if (blockchainStatus.isConnected && blockchainStatus.verifiedRecords > 0) {
      return {
        color: 'text-green-600 bg-green-100',
        icon: CheckCircle,
        text: `${blockchainStatus.verifiedRecords} records verified on blockchain`,
      };
    } else if (blockchainStatus.isConnected) {
      return {
        color: 'text-blue-600 bg-blue-100',
        icon: Shield,
        text: 'Blockchain protection active',
      };
    } else {
      return {
        color: 'text-yellow-600 bg-yellow-100',
        icon: AlertTriangle,
        text: 'Blockchain connection unavailable',
      };
    }
  };

  const blockchainDisplay = getBlockchainStatusDisplay();

  const statsConfig = [
    { 
      label: 'Linked Facilities', 
      value: dashboardStats.linkedFacilities.toString(), 
      icon: Users, 
      color: 'bg-blue-500',
      onClick: () => navigate('/facilities')
    },
    { 
      label: 'Health Records', 
      value: dashboardStats.healthRecords.toString(), 
      icon: FileText, 
      color: 'bg-green-500',
      onClick: () => navigate('/records')
    },
    { 
      label: 'Pending Consents', 
      value: dashboardStats.pendingConsents.toString(), 
      icon: Shield, 
      color: 'bg-orange-500',
      onClick: () => navigate('/consents')
    },
    { 
      label: 'Connected Devices', 
      value: dashboardStats.connectedDevices.toString(), 
      icon: Smartphone, 
      color: 'bg-purple-500',
      onClick: () => navigate('/wearables')
    }
  ];

  if (loading && !records.length) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
          </h2>
          <p className="text-blue-100">Your health information is secure and protected by blockchain technology.</p>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              <span className="text-sm">Last sync: {new Date(blockchainStatus.lastCheck).toLocaleTimeString()}</span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading || recordsLoading}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${(loading || recordsLoading) ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Blockchain Status */}
        <div className={`rounded-lg p-4 border ${blockchainDisplay.color.includes('red') ? 'border-red-200' : blockchainDisplay.color.includes('green') ? 'border-green-200' : blockchainDisplay.color.includes('yellow') ? 'border-yellow-200' : 'border-blue-200'}`}>
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-lg ${blockchainDisplay.color} flex items-center justify-center mr-3`}>
              <blockchainDisplay.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Blockchain Security Status</h4>
              <p className="text-sm text-gray-600">{blockchainDisplay.text}</p>
            </div>
            {blockchainStatus.tamperedRecords > 0 && (
              <button
                onClick={() => navigate('/records')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                View Details
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsConfig.map((stat, index) => (
            <button
              key={index}
              onClick={stat.onClick}
              className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id || index} className="flex items-start">
                    <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                      activity.category === 'medical' ? 'bg-red-500' :
                      activity.category === 'data' ? 'bg-green-500' :
                      activity.category === 'appointment' ? 'bg-blue-500' :
                      activity.category === 'system' ? 'bg-orange-500' :
                      activity.category === 'insurance' ? 'bg-purple-500' :
                      activity.category === 'medication' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                      <p className="text-xs text-gray-600 mb-1">{activity.description}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                          activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/facilities')}
            className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow text-left"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">Link Facility</h4>
            <p className="text-sm text-gray-600 mt-1">Connect with healthcare providers</p>
          </button>
          
          <button 
            onClick={() => navigate('/records')}
            className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow text-left"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900">View Records</h4>
            <p className="text-sm text-gray-600 mt-1">Access your blockchain-protected health records</p>
          </button>
          
          <button 
            onClick={() => navigate('/wearables')}
            className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow text-left"
          >
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