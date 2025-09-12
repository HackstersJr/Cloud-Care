import React from 'react';

export default function DiseaseChart() {
  const diseases = [
    { name: 'Diabetes', count: 456, percentage: 28.5, color: 'bg-blue-500' },
    { name: 'Hypertension', count: 389, percentage: 24.3, color: 'bg-green-500' },
    { name: 'Cardiovascular', count: 267, percentage: 16.7, color: 'bg-yellow-500' },
    { name: 'Respiratory', count: 198, percentage: 12.4, color: 'bg-orange-500' },
    { name: 'Neurological', count: 145, percentage: 9.1, color: 'bg-purple-500' },
    { name: 'Others', count: 142, percentage: 8.9, color: 'bg-gray-500' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Diseases by Category</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-orange-600">↓Category</span>
          <span className="text-sm text-orange-600">↓Count</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {diseases.map((disease, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="w-24 text-sm text-gray-600 text-right">{disease.name}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
              <div
                className={`${disease.color} h-full rounded-full transition-all duration-300`}
                style={{ width: `${disease.percentage}%` }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-end pr-2">
                <span className="text-xs font-medium text-white">
                  {disease.count}
                </span>
              </div>
            </div>
            <div className="w-12 text-sm text-gray-900 font-medium">
              {disease.percentage}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}