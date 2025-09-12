import React, { useState } from 'react';
import Layout from './layout/Layout';
import { Smartphone, Activity, Heart, Footprints, Plus, Wifi, Battery, Check } from 'lucide-react';

const Wearables = () => {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  
  const connectedDevices = [
    {
      id: 1,
      name: 'Fitbit Charge 5',
      type: 'Fitness Tracker',
      battery: 85,
      lastSync: '2 minutes ago',
      status: 'Connected',
      icon: Activity,
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 2,
      name: 'Apple Watch Series 9',
      type: 'Smartwatch',
      battery: 72,
      lastSync: '5 minutes ago',
      status: 'Connected',
      icon: Heart,
      color: 'bg-red-100 text-red-600'
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

  const healthMetrics = [
    { label: 'Steps Today', value: '8,245', change: '+12%', color: 'text-green-600' },
    { label: 'Heart Rate', value: '72 bpm', change: 'Normal', color: 'text-blue-600' },
    { label: 'Sleep', value: '7h 32m', change: '+8%', color: 'text-purple-600' },
    { label: 'Calories', value: '2,156', change: '+5%', color: 'text-orange-600' }
  ];

  const handleConnectDevice = (deviceName: string) => {
    setSelectedDevice(deviceName);
    // Simulate connection process
    setTimeout(() => {
      setSelectedDevice(null);
      setShowConnectModal(false);
      // In a real app, you would add the device to connectedDevices
    }, 2000);
  };

  return (
    <Layout title="Wearables & Devices">
      <div className="space-y-6">
        {/* Health Metrics Overview */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Today's Health Summary</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {healthMetrics.map((metric, index) => (
              <div key={index} className="bg-white/20 rounded-lg p-3">
                <p className="text-sm text-blue-100">{metric.label}</p>
                <p className="text-xl font-bold">{metric.value}</p>
                <p className="text-xs text-blue-200">{metric.change}</p>
              </div>
            ))}
          </div>
        </div>

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

        {/* Data Sync Settings */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Sync Settings</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Auto-sync health data</p>
                  <p className="text-sm text-gray-600">Automatically sync data every hour</p>
                </div>
                <button className="bg-blue-600 rounded-full w-12 h-6 flex items-center justify-end px-1">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Share with healthcare providers</p>
                  <p className="text-sm text-gray-600">Allow linked facilities to access wearable data</p>
                </div>
                <button className="bg-gray-300 rounded-full w-12 h-6 flex items-center justify-start px-1">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </button>
              </div>
            </div>
          </div>
        </div>

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