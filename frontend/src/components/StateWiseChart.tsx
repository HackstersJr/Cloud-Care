import React from 'react';

export default function StateWiseChart() {
  const stateData = [
    {
      category: 'Critical Cases',
      states: [
        { name: 'Uttar Pradesh', value: 1414, color: 'bg-red-500' },
        { name: 'Maharashtra', value: 631, color: 'bg-red-400' },
        { name: 'Bihar', value: 563, color: 'bg-red-300' },
        { name: 'Rajasthan', value: 634, color: 'bg-red-400' },
        { name: 'West Bengal', value: 492, color: 'bg-red-300' },
        { name: 'Gujarat', value: 488, color: 'bg-red-300' },
        { name: 'Madhya Pradesh', value: 501, color: 'bg-red-300' },
        { name: 'Karnataka', value: 346, color: 'bg-red-200' },
        { name: 'Kerala', value: 256, color: 'bg-red-200' },
        { name: 'Andhra Pradesh', value: 466, color: 'bg-red-300' }
      ]
    },
    {
      category: 'Recovery Rate %',
      states: [
        { name: 'Kerala', value: 98.2, color: 'bg-green-500' },
        { name: 'Karnataka', value: 94.8, color: 'bg-green-400' },
        { name: 'Maharashtra', value: 89.1, color: 'bg-green-300' },
        { name: 'Tamil Nadu', value: 87.6, color: 'bg-green-300' },
        { name: 'Andhra Pradesh', value: 85.3, color: 'bg-green-300' },
        { name: 'Gujarat', value: 84.2, color: 'bg-green-200' },
        { name: 'Rajasthan', value: 82.7, color: 'bg-green-200' },
        { name: 'Uttar Pradesh', value: 81.4, color: 'bg-green-200' },
        { name: 'Bihar', value: 79.8, color: 'bg-green-200' },
        { name: 'West Bengal', value: 78.3, color: 'bg-green-200' }
      ]
    },
    {
      category: 'Healthcare Professionals',
      states: [
        { name: 'Uttar Pradesh', value: 98441, color: 'bg-blue-500' },
        { name: 'Maharashtra', value: 71018, color: 'bg-blue-400' },
        { name: 'Karnataka', value: 68692, color: 'bg-blue-400' },
        { name: 'Andhra Pradesh', value: 63386, color: 'bg-blue-300' },
        { name: 'Rajasthan', value: 57728, color: 'bg-blue-300' },
        { name: 'Bihar', value: 40867, color: 'bg-blue-200' },
        { name: 'Kerala', value: 39820, color: 'bg-blue-200' },
        { name: 'Telangana', value: 24636, color: 'bg-blue-200' },
        { name: 'Chhattisgarh', value: 24486, color: 'bg-blue-200' },
        { name: 'Assam', value: 24099, color: 'bg-blue-200' }
      ]
    }
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {stateData.map((category, categoryIndex) => (
        <div key={categoryIndex} className="bg-blue-700 text-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{category.category}</h3>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-orange-400">↓State/UT</span>
              <span className="text-orange-400">↓Value</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {category.states.map((state, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1 flex items-center space-x-3">
                  <span className="text-sm font-medium w-24 text-right">{state.name}</span>
                  <div className="flex-1 bg-white/20 rounded h-4 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${state.color.replace('bg-', 'bg-white/').replace('-500', '/70').replace('-400', '/60').replace('-300', '/50').replace('-200', '/40')}`}
                      style={{ 
                        width: `${categoryIndex === 1 ? state.value : (state.value / Math.max(...category.states.map(s => s.value))) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm font-medium w-16 text-right">
                  {typeof state.value === 'number' && state.value < 100 
                    ? `${state.value}%` 
                    : state.value.toLocaleString()
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}