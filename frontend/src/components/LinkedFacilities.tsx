import React, { useState } from 'react';
import Layout from './layout/Layout';
import { Eye, Building2, Stethoscope, Plus, QrCode, Upload } from 'lucide-react';

const LinkedFacilities = () => {
  const [showScanModal, setShowScanModal] = useState(false);
  
  const facilities = [
    {
      name: 'Archana Eye Clinic',
      patientId: '22343',
      type: 'Eye Care',
      icon: Eye,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      name: 'Dr Lal Pathlabs NRL-HIP',
      patientId: 'REF00117-25',
      type: 'Diagnostic',
      icon: Building2,
      color: 'bg-green-100 text-green-600'
    },
    {
      name: 'Kidney Center Hospital',
      patientId: '22585',
      type: 'Nephrology',
      icon: Stethoscope,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      name: 'LTIM HIU',
      patientId: 'swanand123@sbx',
      type: 'Health Information',
      icon: Building2,
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  return (
    <Layout title="Linked Facilities">
      <div className="space-y-4">
        {facilities.map((facility, index) => (
          <div key={index} className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start">
                <div className={`w-12 h-12 rounded-lg ${facility.color} flex items-center justify-center mr-4`}>
                  <facility.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{facility.name}</h3>
                  <p className="text-sm text-gray-600">Patient ID</p>
                  <p className="text-sm font-medium text-gray-900">{facility.patientId}</p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button className="flex-1 flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Eye className="w-4 h-4 mr-2" />
                View details
              </button>
              <button 
                onClick={() => setShowScanModal(true)}
                className="flex-1 flex items-center justify-center py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Pull records
              </button>
            </div>
          </div>
        ))}
        
        <button className="w-full bg-orange-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-orange-700 flex items-center justify-center">
          <Plus className="w-5 h-5 mr-2" />
          Link new facility
        </button>
      </div>

      {/* Scan Modal */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Options</h3>
              <button 
                onClick={() => setShowScanModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              The scan and share feature allows users to share ABHA details with a facility and receive a token number.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                  <QrCode className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium">Scan the QR code</span>
              </button>
              
              <button className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                  <Upload className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-sm font-medium">Upload through gallery</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LinkedFacilities;