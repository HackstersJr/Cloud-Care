import React from 'react';

export default function TrendChart() {
  const trendData = [
    { month: 'Jan', reports: 25000, consultations: 18000 },
    { month: 'Feb', reports: 32000, consultations: 24000 },
    { month: 'Mar', reports: 28000, consultations: 21000 },
    { month: 'Apr', reports: 35000, consultations: 28000 },
    { month: 'May', reports: 30000, consultations: 25000 },
    { month: 'Jun', reports: 38000, consultations: 32000 },
    { month: 'Jul', reports: 42000, consultations: 36000 },
    { month: 'Aug', reports: 39000, consultations: 34000 },
    { month: 'Sep', reports: 45000, consultations: 38000 }
  ];

  const maxValue = Math.max(...trendData.flatMap(d => [d.reports, d.consultations]));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Health Reports & Consultation Trend</h3>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Medical Reports</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Consultations</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select className="text-sm border border-gray-300 rounded px-2 py-1">
              <option>All</option>
              <option>Critical</option>
              <option>Normal</option>
            </select>
            <select className="text-sm border border-gray-300 rounded px-2 py-1">
              <option>All</option>
              <option>Emergency</option>
              <option>Routine</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-gray-500">
          <span>From: 01/01/2025 To: 30/09/2025</span>
          <span>Apply | Select Month and Year | Week | Last 30 Days | All</span>
        </div>
        
        <div className="h-64 relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 w-12">
            <span>50,000</span>
            <span>40,000</span>
            <span>30,000</span>
            <span>20,000</span>
            <span>10,000</span>
            <span>0</span>
          </div>
          
          {/* Chart area */}
          <div className="ml-12 h-full relative bg-gradient-to-t from-blue-50 to-transparent rounded">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border-t border-gray-200 first:border-t-0"></div>
              ))}
            </div>
            
            {/* Data visualization */}
            <div className="absolute inset-0 flex items-end justify-between px-4">
              {trendData.map((data, index) => (
                <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                  <div className="flex flex-col items-center space-y-1 w-full">
                    {/* Reports bar */}
                    <div 
                      className="bg-blue-500 w-4 rounded-t transition-all duration-300 hover:bg-blue-600"
                      style={{ height: `${(data.reports / maxValue) * 200}px` }}
                      title={`Reports: ${data.reports.toLocaleString()}`}
                    ></div>
                    {/* Consultations bar */}
                    <div 
                      className="bg-orange-500 w-4 rounded-t transition-all duration-300 hover:bg-orange-600"
                      style={{ height: `${(data.consultations / maxValue) * 200}px` }}
                      title={`Consultations: ${data.consultations.toLocaleString()}`}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}