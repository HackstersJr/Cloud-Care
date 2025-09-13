import React, { useState, useEffect } from 'react';
import Layout from './layout/Layout';
import { Eye, CheckCircle, Clock, XCircle, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import consentService from '../services/consentService';
import type { ConsentRequest as ConsentRequestType } from '../services/consentService';

const Consents: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('pending');
  const [consents, setConsents] = useState<ConsentRequestType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load consents from API
  useEffect(() => {
    loadConsents();
  }, [activeFilter]);

  const loadConsents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = activeFilter !== 'all' ? { status: activeFilter } : {};
      const response = await consentService.getConsents(params);
      
      // Handle the actual API response format: { success: true, data: {...} }
      if (response.success && response.data) {
        setConsents(response.data.consents || []);
      } else {
        setError('Failed to load consent requests');
      }
    } catch (error) {
      console.error('Error loading consents:', error);
      setError('Failed to load consent requests');
      // Set some mock data as fallback for development
      setConsents([
        {
          id: '1',
          facilityName: 'City Hospital',
          requestorName: 'Dr. Sarah Johnson',
          requestorEmail: 'sarah.johnson@cityhospital.com',
          consentType: 'data_access',
          purpose: 'Need access to medical history for upcoming surgery consultation',
          permissionLevel: 'read',
          dataTypes: ['medical_records', 'lab_results'],
          status: 'pending',
          requestedDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          facilityName: 'Metro Health Services',
          requestorName: 'Dr. Michael Chen',
          requestorEmail: 'michael.chen@metrohealth.com',
          consentType: 'subscription',
          purpose: 'Ongoing monitoring and care coordination for chronic condition management',
          permissionLevel: 'full_access',
          dataTypes: ['medical_records', 'vitals', 'medications'],
          status: 'approved',
          requestedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          approvedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          validFrom: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          validTo: new Date(Date.now() + 358 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveConsent = async (consentId: string) => {
    try {
      const response = await consentService.approveConsent(consentId);
      if (response.status === 'success') {
        setConsents(prev => prev.map(consent => 
          consent.id === consentId 
            ? { ...consent, status: 'approved' as const }
            : consent
        ));
      }
    } catch (error) {
      console.error('Error approving consent:', error);
    }
  };

  const handleDenyConsent = async (consentId: string) => {
    try {
      const response = await consentService.denyConsent(consentId);
      if (response.status === 'success') {
        setConsents(prev => prev.map(consent => 
          consent.id === consentId 
            ? { ...consent, status: 'denied' as const }
            : consent
        ));
      }
    } catch (error) {
      console.error('Error denying consent:', error);
    }
  };

  const handleRevokeConsent = async (consentId: string) => {
    try {
      const response = await consentService.revokeConsent(consentId);
      if (response.status === 'success') {
        setConsents(prev => prev.map(consent => 
          consent.id === consentId 
            ? { ...consent, status: 'revoked' as const }
            : consent
        ));
      }
    } catch (error) {
      console.error('Error revoking consent:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'denied': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'expired': return <XCircle className="w-4 h-4 text-gray-600" />;
      case 'revoked': return <XCircle className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'approved': return 'text-green-600';
      case 'denied': return 'text-red-600';
      case 'expired': return 'text-gray-600';
      case 'revoked': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getConsentTypeLabel = (type: string) => {
    switch (type) {
      case 'data_access': return 'Data Access Request';
      case 'subscription': return 'Subscription Request';
      case 'emergency_access': return 'Emergency Access';
      case 'research': return 'Research Participation';
      default: return 'Unknown Request';
    }
  };

  const filteredConsents = consents.filter(consent => {
    if (activeFilter === 'all') {
      return true;
    }
    return consent.status === activeFilter;
  });

  return (
    <Layout title="Consent Management">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Shield className="w-6 h-6 mr-2 text-blue-600" />
              Consent Management
            </h1>
            <p className="text-gray-600 mt-1">Manage your data sharing consents and permissions</p>
          </div>
          <button 
            onClick={loadConsents}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex space-x-4 mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['pending', 'approved', 'denied', 'all'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeFilter === filter
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Loading consent requests...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredConsents.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No consent requests found</h3>
            <p className="text-gray-600">
              {activeFilter === 'all' 
                ? 'You have no consent requests at the moment.' 
                : `No ${activeFilter} consent requests found.`}
            </p>
          </div>
        )}

        {/* Consents List */}
        <div className="space-y-4">
          {filteredConsents.map((consent) => (
            <div key={consent.id} className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{consent.facilityName}</h3>
                  <p className="text-sm text-gray-600">{getConsentTypeLabel(consent.consentType)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(consent.status)}
                  <span className={`text-sm font-medium ${getStatusColor(consent.status)}`}>
                    {consent.status.charAt(0).toUpperCase() + consent.status.slice(1)}
                  </span>
                  <span className="text-sm text-gray-500">{new Date(consent.requestedDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Purpose of request</p>
                  <p className="text-sm text-gray-600">{consent.purpose}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Information request duration</p>
                  <p className="text-sm text-gray-600">
                    {consent.validFrom && consent.validTo 
                      ? `${new Date(consent.validFrom).toLocaleDateString()} to ${new Date(consent.validTo).toLocaleDateString()}`
                      : 'Duration not specified'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <button className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                  <Eye className="w-4 h-4 mr-1" />
                  View details
                </button>
                
                <div className="flex space-x-2">
                  {consent.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveConsent(consent.id)}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDenyConsent(consent.id)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200"
                      >
                        Deny
                      </button>
                    </>
                  )}
                  {consent.status === 'approved' && (
                    <button
                      onClick={() => handleRevokeConsent(consent.id)}
                      className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Consents;
