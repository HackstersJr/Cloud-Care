import React from 'react';

export default function PatientChart() {
  const patientData = [
    { category: 'Age 0-18', male: 245, female: 267, color: 'bg-blue-500' },
    { category: 'Age 19-35', male: 456, female: 523, color: 'bg-green-500' },
    { category: 'Age 36-50', male: 389, female: 412, color: 'bg-yellow-500' },
    { category: 'Age 51-65', male: 298, female: 334, color: 'bg-orange-500' },
    { category: 'Age 65+', male: 187, female: 221, color: 'bg-purple-500' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Patient Demographics</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded"></div>
            <span className="text-sm text-gray-600">Male</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-400 rounded"></div>
            <span className="text-sm text-gray-600">Female</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {patientData.map((data, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">{data.category}</span>
              <span className="text-gray-600">Total: {data.male + data.female}</span>
            </div>
            <div className="flex space-x-1">
              <div className="flex-1 bg-gray-200 rounded h-4 overflow-hidden">
                <div className="flex h-full">
                  <div
                    className="bg-blue-400 transition-all duration-300"
                    style={{ width: `${(data.male / (data.male + data.female)) * 100}%` }}
                  ></div>
                  <div
                    className="bg-orange-400 transition-all duration-300"
                    style={{ width: `${(data.female / (data.male + data.female)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>M: {data.male}</span>
              <span>F: {data.female}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}