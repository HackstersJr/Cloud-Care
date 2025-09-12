import React, { useState } from 'react';
import Layout from './layout/Layout';
import { Eye, CheckCircle, Clock, XCircle } from 'lucide-react';

const Consents = () => {
  const [activeTab, setActiveTab] = useState('Requests');
  const [activeFilter, setActiveFilter] = useState('Pending');
  
  const consents = [
    {
      id: 1,
      facility: 'HIU',
      type: 'Subscription Request',
      purpose: 'Self Requested',
      duration: 'From 04-Aug-2023 To 25-Dec-2023',
      date: '20-Dec-2023',
      status: 'Pending'
    },
    {
      id: 2,
      facility: 'HIU', 
      type: 'Subscription Request',
      purpose: 'Care Management',
      duration: 'From 04-Apr-2023 To 30-Nov-2023',
      date: '29-Sep-2023',
      status: 'Pending'
    },
    {
      id: 3,
      facility: 'Archana Eye Clinic',
      type: 'Data Access Request',
      purpose: 'Treatment Planning',
      duration: 'From 01-Jan-2024 To 31-Dec-2024',
      date: '15-Jan-2024',
      status: 'Approved'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Denied': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'text-yellow-600';
      case 'Approved': return 'text-green-600';
      case 'Denied': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredConsents = consents.filter(consent => 
    activeTab === 'Approved' ? consent.status === 'Approved' : 
    activeFilter === 'All' || consent.status === activeFilter
  );

  return (
    <Layout title="Consents">
      <div className="space-y-6">
        {/* Tab Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['Requests', 'Approved'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filter Tabs */}
        {activeTab === 'Requests' && (
          <div className="flex space-x-1 border-b">
            {['All', 'Pending', 'Denied', 'Expired'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeFilter === filter
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        {/* Consents List */}
        <div className="space-y-4">
          {filteredConsents.map((consent) => (
            <div key={consent.id} className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{consent.facility}</h3>
                  <p className="text-sm text-gray-600">{consent.type}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(consent.status)}
                  <span className={`text-sm font-medium ${getStatusColor(consent.status)}`}>
                    {consent.status}
                  </span>
                  <span className="text-sm text-gray-500">{consent.date}</span>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Purpose of request</p>
                  <p className="text-sm text-gray-600">{consent.purpose}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Information request duration</p>
                  <p className="text-sm text-gray-600">{consent.duration}</p>
                </div>
              </div>
              
              <button className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                <Eye className="w-4 h-4 mr-1" />
                View details
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Consents;