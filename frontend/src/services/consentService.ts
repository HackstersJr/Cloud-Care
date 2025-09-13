import { apiClient } from '../utils/api';

export interface ConsentRequest {
  id: string;
  facilityId?: string;
  facilityName: string;
  requestorName: string;
  requestorEmail: string;
  consentType: 'data_access' | 'subscription' | 'emergency_access' | 'research';
  purpose: string;
  permissionLevel: 'read' | 'write' | 'full_access';
  dataTypes: string[];
  status: 'pending' | 'approved' | 'denied' | 'expired' | 'revoked';
  requestedDate: string;
  validFrom?: string;
  validTo?: string;
  approvedDate?: string;
  deniedDate?: string;
  revokedDate?: string;
  blockchainHash?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface GetConsentsParams {
  page?: number;
  limit?: number;
  status?: string;
  consentType?: string;
}

export interface ConsentStatusUpdate {
  action: 'approved' | 'denied' | 'revoked';
  reason?: string;
}

export const consentService = {
  // Get all consent requests for the current patient
  async getConsents(params: GetConsentsParams = {}) {
    return apiClient.getConsents(params);
  },

  // Get a specific consent request by ID
  async getConsentById(id: string) {
    return apiClient.getConsentById(id);
  },

  // Update consent status (approve/deny/revoke)
  async updateConsentStatus(id: string, update: ConsentStatusUpdate) {
    return apiClient.updateConsentStatus(id, update);
  },

  // Create a new consent request (for testing)
  async createConsent(consentData: {
    facilityName: string;
    requestorName: string;
    requestorEmail: string;
    consentType: 'data_access' | 'subscription' | 'emergency_access' | 'research';
    purpose: string;
    permissionLevel: 'read' | 'write' | 'full_access';
    dataTypes: string[];
    validFrom?: string;
    validTo?: string;
  }) {
    return apiClient.createConsent(consentData);
  },

  // Helper methods for common actions
  async approveConsent(id: string, reason?: string) {
    return this.updateConsentStatus(id, { action: 'approved', reason });
  },

  async denyConsent(id: string, reason?: string) {
    return this.updateConsentStatus(id, { action: 'denied', reason });
  },

  async revokeConsent(id: string, reason?: string) {
    return this.updateConsentStatus(id, { action: 'revoked', reason });
  }
};

export default consentService;
