import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  Heart, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Share2,
  FileText
} from 'lucide-react';
import { 
  getFamilyGroup, 
  sendFamilyInvitation, 
  getFamilyInvitations,
  respondToFamilyInvitation,
  getFamilySharedRecords 
} from '../../utils/api';

interface FamilyMember {
  id: string;
  patientId: string;
  relationship: string;
  role: 'admin' | 'member';
  joinedAt: string;
  patient: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };
}

interface FamilyInvitation {
  id: string;
  token: string;
  inviteeEmail: string;
  inviteePhone?: string;
  proposedRelationship: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  createdAt: string;
}

interface SharedRecord {
  id: string;
  medicalRecordId: string;
  shareLevel: string;
  sharedAt: string;
  sharedBy: string;
  record: {
    id: string;
    type: string;
    title: string;
    date: string;
  };
}

const FamilyMembersPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  
  const [familyGroup, setFamilyGroup] = useState<any>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [sharedRecords, setSharedRecords] = useState<SharedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'records'>('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    inviteeEmail: '',
    inviteePhone: '',
    proposedRelationship: '',
    message: ''
  });

  useEffect(() => {
    if (groupId) {
      loadFamilyData();
    }
  }, [groupId]);

  const loadFamilyData = async () => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      
      // Load family group details
      const groupResponse = await getFamilyGroup(groupId);
      setFamilyGroup(groupResponse.data);
      
      // Load invitations
      const invitationsResponse = await getFamilyInvitations('sent');
      setInvitations(invitationsResponse.data?.invitations || []);
      
      // Load shared records
      const recordsResponse = await getFamilySharedRecords(groupId);
      setSharedRecords(recordsResponse.data || []);
      
      setError(null);
    } catch (err: any) {
      console.error('Error loading family data:', err);
      setError(err.message || 'Failed to load family data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !inviteForm.inviteeEmail || !inviteForm.proposedRelationship) return;

    try {
      await sendFamilyInvitation({
        familyGroupId: groupId,
        ...inviteForm
      });
      
      setShowInviteModal(false);
      setInviteForm({
        inviteeEmail: '',
        inviteePhone: '',
        proposedRelationship: '',
        message: ''
      });
      
      // Reload invitations
      await loadFamilyData();
    } catch (err: any) {
      console.error('Error sending invitation:', err);
      setError(err.message || 'Failed to send invitation');
    }
  };

  const handleInviteInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInviteForm(prev => ({ ...prev, [name]: value }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading family details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!familyGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Family Group Not Found</h2>
          <p className="text-gray-600 mb-6">The requested family group could not be found.</p>
          <button
            onClick={() => navigate('/family')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Family Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/family')}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Back to Family Groups"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{familyGroup.name}</h1>
              <p className="text-gray-600">{familyGroup.description || 'Family health network'}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
                activeTab === 'members' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Members ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
                activeTab === 'invitations' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              Invitations ({invitations.length})
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
                activeTab === 'records' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Shared Records ({sharedRecords.length})
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Family Members</h2>
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Invite Member
              </button>
            </div>

            {members.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Members Yet</h3>
                <p className="text-gray-600 mb-6">Invite family members to start sharing health information.</p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send First Invitation
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => (
                  <div key={member.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Heart className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {member.patient.firstName} {member.patient.lastName}
                          </h3>
                          <p className="text-sm text-gray-600 capitalize">{member.relationship}</p>
                        </div>
                      </div>
                      {member.role === 'admin' && (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {member.patient.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{member.patient.email}</span>
                        </div>
                      )}
                      {member.patient.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{member.patient.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button className="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                        View Profile
                      </button>
                      <button className="flex items-center gap-1 bg-green-50 text-green-600 py-2 px-4 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium">
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'invitations' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Pending Invitations</h2>
            
            {invitations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow">
                <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Invitations</h3>
                <p className="text-gray-600">All invitations have been responded to or expired.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(invitation.status)}
                          <h3 className="font-semibold text-gray-900">{invitation.inviteeEmail}</h3>
                          <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full capitalize">
                            {invitation.proposedRelationship}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">
                          Invited {new Date(invitation.createdAt).toLocaleDateString()}
                        </p>
                        {invitation.message && (
                          <p className="text-gray-600 text-sm italic">"{invitation.message}"</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          invitation.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : invitation.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : invitation.status === 'declined'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                        </span>
                        {invitation.status === 'pending' && (
                          <p className="text-xs text-gray-500 mt-1">
                            Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'records' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Shared Medical Records</h2>
            
            {sharedRecords.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shared Records</h3>
                <p className="text-gray-600">No medical records have been shared with this family group yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sharedRecords.map((sharedRecord) => (
                  <div key={sharedRecord.id} className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{sharedRecord.record.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">
                          Type: {sharedRecord.record.type} • Date: {new Date(sharedRecord.record.date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600 text-sm">
                          Shared {new Date(sharedRecord.sharedAt).toLocaleDateString()} by {sharedRecord.sharedBy}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {sharedRecord.shareLevel}
                        </span>
                        <div className="mt-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View Record
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Invite Member Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Invite Family Member</h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendInvitation} className="space-y-4">
                <div>
                  <label htmlFor="inviteeEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="inviteeEmail"
                    name="inviteeEmail"
                    value={inviteForm.inviteeEmail}
                    onChange={handleInviteInputChange}
                    placeholder="member@example.com"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="inviteePhone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    id="inviteePhone"
                    name="inviteePhone"
                    value={inviteForm.inviteePhone}
                    onChange={handleInviteInputChange}
                    placeholder="+1234567890"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="proposedRelationship" className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship *
                  </label>
                  <select
                    id="proposedRelationship"
                    name="proposedRelationship"
                    value={inviteForm.proposedRelationship}
                    onChange={handleInviteInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select relationship</option>
                    <option value="spouse">Spouse</option>
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                    <option value="sibling">Sibling</option>
                    <option value="grandparent">Grandparent</option>
                    <option value="grandchild">Grandchild</option>
                    <option value="guardian">Guardian</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Personal Message (Optional)
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={inviteForm.message}
                    onChange={handleInviteInputChange}
                    placeholder="Add a personal message to your invitation..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyMembersPage;
