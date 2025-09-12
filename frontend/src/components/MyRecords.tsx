import React, { useState } from 'react';
import Layout from './layout/Layout';
import { FileText, Download, Calendar, Filter } from 'lucide-react';

const MyRecords = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const categories = ['All', 'Lab Reports', 'Prescriptions', 'Imaging', 'Discharge Summary'];
  
  const records = [
    {
      id: 1,
      title: 'Blood Test Report',
      facility: 'Dr Lal Pathlabs',
      date: '2024-01-15',
      category: 'Lab Reports',
      size: '2.3 MB'
    },
    {
      id: 2,
      title: 'Eye Examination Report',
      facility: 'Archana Eye Clinic',
      date: '2024-01-10',
      category: 'Imaging',
      size: '1.8 MB'
    },
    {
      id: 3,
      title: 'Prescription - Diabetes',
      facility: 'Kidney Center Hospital',
      date: '2024-01-08',
      category: 'Prescriptions',
      size: '0.5 MB'
    },
    {
      id: 4,
      title: 'Discharge Summary',
      facility: 'LTIM HIU',
      date: '2024-01-05',
      category: 'Discharge Summary',
      size: '1.2 MB'
    }
  ];

  const filteredRecords = selectedCategory === 'All' 
    ? records 
    : records.filter(record => record.category === selectedCategory);

  return (
    <Layout title="My Records">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Health Records</h2>
          <button className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
            <Filter className="w-4 h-4 mr-1" />
            Filter
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Records List */}
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <div key={record.id} className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{record.title}</h3>
                    <p className="text-sm text-gray-600 mb-1">{record.facility}</p>
                    <div className="flex items-center text-xs text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                      <span>{record.size}</span>
                      <span className="px-2 py-1 bg-gray-100 rounded-full">
                        {record.category}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
            <p className="text-gray-600">No records match the selected category.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyRecords;