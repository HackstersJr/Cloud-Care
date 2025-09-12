import { useState, useEffect } from 'react';
import Layout from './layout/Layout';
import { 
  Activity, Heart, Footprints, Plus, Wifi, Battery, 
  TrendingUp, Moon, Zap, BarChart3, Eye
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { healthApi } from '../services/healthApi';
import { processHealthData, ProcessedHealthData, getWeekAgoDateString, formatHealthValue } from '../utils/healthDataProcessor';

const Wearables = () => {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'today' | 'weekly'>('today');
  const [healthData, setHealthData] = useState<ProcessedHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataTypes, setDataTypes] = useState<{[key: string]: number}>({});

  // Load health data
  useEffect(() => {
    const loadHealthData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check available data types first
        const availableData = await healthApi.getAllAvailableData();
        setDataTypes(availableData);

        // Fetch data for the last week
        const startDate = getWeekAgoDateString();

        const [steps, heartRate, calories, sleep, distance] = await Promise.all([
          healthApi.getStepsData(startDate),
          healthApi.getHeartRateData(startDate),
          healthApi.getCaloriesData(startDate),
          healthApi.getSleepData(startDate),
          healthApi.getDistanceData(startDate)
        ]);

        const processed = processHealthData({
          steps,
          heartRate,
          calories,
          sleep,
          distance
        });

        setHealthData(processed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load health data');
        console.error('Failed to load health data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHealthData();
  }, []);

  const connectedDevices = [
    {
      id: 1,
      name: 'Xiaomi Mi Band',
      type: 'Fitness Tracker',
      battery: 85,
      lastSync: '2 minutes ago',
      status: 'Connected',
      icon: Activity,
      color: 'bg-orange-100 text-orange-600',
      dataCount: dataTypes.activeCaloriesBurned || 0
    }
  ];

  const availableDevices = [
    { name: 'Fitbit', icon: Activity, color: 'bg-blue-100 text-blue-600' },
    { name: 'Apple Health', icon: Heart, color: 'bg-gray-100 text-gray-600' },
    { name: 'Google Fit', icon: Footprints, color: 'bg-green-100 text-green-600' },
    { name: 'Samsung Health', icon: Activity, color: 'bg-purple-100 text-purple-600' },
    { name: 'Garmin', icon: Activity, color: 'bg-orange-100 text-orange-600' },
    { name: 'Xiaomi Mi Fit', icon: Activity, color: 'bg-yellow-100 text-yellow-600' }
  ];

  const handleConnectDevice = (deviceName: string) => {
    setSelectedDevice(deviceName);
    setTimeout(() => {
      setSelectedDevice(null);
      setShowConnectModal(false);
    }, 2000);
  };

  if (loading) {
    return (
      <Layout title="Wearables & Devices">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading health data...</span>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Wearables & Devices">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-sm font-medium">!</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading health data</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="text-sm text-red-600 underline mt-2"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const todayMetrics = healthData ? [
    { 
      label: 'Steps Today', 
      value: formatHealthValue(healthData.steps.today, 'steps'), 
      change: '+12%', 
      color: 'text-green-600',
      icon: Footprints,
      bgColor: 'bg-green-100'
    },
    { 
      label: 'Heart Rate', 
      value: formatHealthValue(healthData.heartRate.current, 'heartRate'), 
      change: 'Normal', 
      color: 'text-red-600',
      icon: Heart,
      bgColor: 'bg-red-100'
    },
    { 
      label: 'Sleep', 
      value: formatHealthValue(healthData.sleep.lastNight, 'sleep'), 
      change: '+8%', 
      color: 'text-purple-600',
      icon: Moon,
      bgColor: 'bg-purple-100'
    },
    { 
      label: 'Calories', 
      value: formatHealthValue(healthData.calories.today, 'calories'), 
      change: `${Math.round((healthData.calories.today / healthData.calories.target) * 100)}%`, 
      color: 'text-orange-600',
      icon: Zap,
      bgColor: 'bg-orange-100'
    }
  ] : [];

  return (
    <Layout title="Wearables & Devices">
      <div className="space-y-6">
        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setViewMode('today')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Eye className="w-4 h-4 mr-2" />
              Today's View
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Weekly Trends
            </button>
          </div>
        </div>

        {viewMode === 'today' ? (
          <>
            {/* Today's Health Summary */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
              <h2 className="text-xl font-bold mb-4">Today's Health Summary</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {todayMetrics.map((metric, index) => (
                  <div key={index} className="bg-white/20 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <metric.icon className="w-4 h-4 mr-2" />
                      <p className="text-sm text-blue-100">{metric.label}</p>
                    </div>
                    <p className="text-xl font-bold">{metric.value}</p>
                    <p className="text-xs text-blue-200">{metric.change}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Detailed Charts */}
            {healthData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Heart Rate Trend */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Heart Rate Today</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={healthData.heartRate.trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Calories Goal */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Calories Goal</h3>
                  <div className="flex items-center justify-center h-48">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Burned', value: healthData.calories.today },
                            { name: 'Remaining', value: Math.max(0, healthData.calories.target - healthData.calories.today) }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#f97316" />
                          <Cell fill="#e5e7eb" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{healthData.calories.today}</p>
                    <p className="text-sm text-gray-600">of {healthData.calories.target} calories</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Weekly Trends */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Weekly Health Trends</h3>
              </div>
              <div className="p-6">
                {healthData && (
                  <div className="space-y-8">
                    {/* Steps Weekly */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Daily Steps</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={healthData.steps.weekly}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Calories Weekly */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Daily Calories Burned</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={healthData.calories.weekly}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="value" stroke="#f97316" fill="#f9731660" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Sleep Weekly */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Daily Sleep Hours</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={healthData.sleep.weekly}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Connected Devices */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Connected Devices</h3>
              <button 
                onClick={() => setShowConnectModal(true)}
                className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Device
              </button>
            </div>
          </div>
          
          <div className="divide-y">
            {connectedDevices.map((device) => (
              <div key={device.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-lg ${device.color} flex items-center justify-center mr-4`}>
                      <device.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{device.name}</h4>
                      <p className="text-sm text-gray-600">{device.type}</p>
                      <p className="text-xs text-green-600">{device.dataCount} data points synced</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Wifi className="w-3 h-3 mr-1" />
                      <span className="text-green-600">{device.status}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Battery className="w-3 h-3 mr-1" />
                      <span>{device.battery}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-gray-600">Last sync: {device.lastSync}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Insights */}
        {healthData && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Health Insights</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-900">Steps Trend</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Average {Math.round(healthData.steps.weekly.reduce((sum, day) => sum + day.value, 0) / 7)} steps/day this week
                  </p>
                </div>
                
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Heart className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-sm font-medium text-red-900">Heart Health</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    Average resting HR: {healthData.heartRate.average} bpm
                  </p>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Moon className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-purple-900">Sleep Quality</span>
                  </div>
                  <p className="text-sm text-purple-700 mt-1">
                    Average {healthData.sleep.average}h sleep per night
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
          <h4 className="font-medium text-yellow-900 mb-2">Privacy & Data Security</h4>
          <p className="text-sm text-yellow-800">
            Your wearable data is encrypted and stored securely. Only you control who can access this information. 
            Healthcare providers require your explicit consent to view wearable data.
          </p>
        </div>
      </div>

      {/* Connect Device Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Connect Device</h3>
              <button 
                onClick={() => setShowConnectModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              {availableDevices.map((device, index) => (
                <button
                  key={index}
                  onClick={() => handleConnectDevice(device.name)}
                  disabled={selectedDevice === device.name}
                  className={`w-full flex items-center p-4 border-2 rounded-lg transition-all ${
                    selectedDevice === device.name
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${device.color} flex items-center justify-center mr-3`}>
                    {selectedDevice === device.name ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                    ) : (
                      <device.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="font-medium text-gray-900">{device.name}</span>
                  {selectedDevice === device.name && (
                    <div className="ml-auto flex items-center text-sm text-blue-600">
                      Connecting...
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Make sure your device is nearby and has Bluetooth enabled. 
                Some devices may require you to install their companion app first.
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Wearables;