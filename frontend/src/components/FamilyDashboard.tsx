import React, { useState, useEffect } from 'react';
import { Users, Plus, Share2, UserPlus, Clock, Calendar, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../utils/api';

interface FamilyMember {
  id: string;
  relationship: string;
  role: string;
  permissions: string[];
  joinedAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
  };
}

interface FamilyGroup {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  adminId: string;
  admin: {
    id: string;
    firstName: string;
    lastName: string;
  };
  members: FamilyMember[];
  _count: {
    members: number;
    sharedRecords: number;
  };
  createdAt: string;
}

interface SharedRecord {
  id: string;
  shareLevel: string;
  permissions: string[];
  sharedAt: string;
  record: {
    id: string;
    title: string;
    recordType: string;
    visitDate: string;
  };
  sharer: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface FamilyInvitation {
  id: string;
  token: string;
  proposedRelationship: string;
  status: string;
  message: string;
  expiresAt: string;
  familyGroup: {
    name: string;
    description: string;
  };
  inviter: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

const FamilyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<FamilyGroup | null>(null);
  const [sharedRecords, setSharedRecords] = useState<SharedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: ''
  });
  const [inviteForm, setInviteForm] = useState({
    email: '',
    relationship: '',
    message: ''
  });

  useEffect(() => {
    if (user?.role === 'patient') {
      loadFamilyData();
    }
  }, [user]);

  const loadFamilyData = async () => {
    try {
      setLoading(true);
      const [groupsResponse, invitationsResponse] = await Promise.all([
        apiClient.get('/family/groups'),
        apiClient.get('/family/invitations?type=received')
      ]);

      if (groupsResponse.status === 'success' && groupsResponse.data) {
        const groups = groupsResponse.data as FamilyGroup[];
        setFamilyGroups(groups);
        if (groups.length > 0 && !selectedGroup) {
          setSelectedGroup(groups[0]);
          loadSharedRecords(groups[0].id);
        }
      }

      if (invitationsResponse.status === 'success' && invitationsResponse.data) {
        setInvitations(invitationsResponse.data as FamilyInvitation[]);
      }
    } catch (error) {
      console.error('Error loading family data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSharedRecords = async (familyGroupId: string) => {
    try {
      const response = await apiClient.get(`/family/groups/${familyGroupId}/shared-records`);
      if (response.status === 'success' && response.data) {
        setSharedRecords(response.data as SharedRecord[]);
      }
    } catch (error) {
      console.error('Error loading shared records:', error);
    }
  };

  const handleGroupSelect = (group: FamilyGroup) => {
    setSelectedGroup(group);
    loadSharedRecords(group.id);
  };

  const handleInvitationResponse = async (invitationId: string, action: 'accept' | 'decline') => {
    try {
      // Find the invitation token by ID
      const invitation = invitations.find(inv => inv.id === invitationId);
      if (!invitation?.token) {
        console.error('Invitation token not found');
        return;
      }
      
      const response = await apiClient.patch(`/family/invitations/${invitation.token}`, { action });
      if (response.status === 'success') {
        loadFamilyData(); // Reload data after accepting/declining
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
    }
  };

  const handleCreateFamilyGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/family/groups', {
        name: createForm.name,
        description: createForm.description
      });
      
      if (response.status === 'success') {
        setCreateForm({ name: '', description: '' });
        setShowCreateModal(false);
        loadFamilyData(); // Reload data to show new group
      }
    } catch (error) {
      console.error('Error creating family group:', error);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    
    try {
      const response = await apiClient.post('/family/invitations', {
        familyGroupId: selectedGroup.id,
        email: inviteForm.email,
        proposedRelationship: inviteForm.relationship,
        message: inviteForm.message
      });
      
      if (response.status === 'success') {
        setInviteForm({ email: '', relationship: '', message: '' });
        setShowInviteModal(false);
        // Optionally show success message
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRelationshipColor = (relationship: string) => {
    const colors: { [key: string]: string } = {
      parent: 'bg-blue-100 text-blue-800',
      child: 'bg-green-100 text-green-800',
      spouse: 'bg-purple-100 text-purple-800',
      sibling: 'bg-orange-100 text-orange-800',
      grandparent: 'bg-indigo-100 text-indigo-800',
      grandchild: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[relationship] || colors.other;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👑';
      case 'moderator': return '⭐';
      default: return '👤';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Family Health Network</h1>
          <p className="text-gray-600">Connect with family members and share health information securely</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowInviteModal(true)}
            disabled={!selectedGroup}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Family Group
          </button>
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-yellow-800 font-medium flex items-center mb-4">
            <Clock className="h-5 w-5 mr-2" />
            Pending Family Invitations ({invitations.length})
          </h3>
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div className="flex-1">
                  <div className="font-medium">
                    {invitation.inviter.firstName} {invitation.inviter.lastName} invited you to join "{invitation.familyGroup.name}"
                  </div>
                  <div className="text-sm text-gray-600">
                    As: <span className={`px-2 py-1 rounded-full text-xs ${getRelationshipColor(invitation.proposedRelationship)}`}>
                      {invitation.proposedRelationship}
                    </span>
                  </div>
                  {invitation.message && (
                    <div className="text-sm text-gray-500 mt-1">"{invitation.message}"</div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    Expires: {formatDate(invitation.expiresAt)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleInvitationResponse(invitation.id, 'accept')}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleInvitationResponse(invitation.id, 'decline')}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Family Groups Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-medium flex items-center mb-4">
              <Users className="h-5 w-5 mr-2" />
              Your Family Groups
            </h3>
            {familyGroups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No family groups yet</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  Create Your First Family Group
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {familyGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedGroup?.id === group.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleGroupSelect(group)}
                  >
                    <div className="font-medium">{group.name}</div>
                    <div className="text-sm text-gray-600 mb-2">{group.description}</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {group._count.members} members
                      </span>
                      <span className="text-gray-500">
                        {group._count.sharedRecords} shared records
                      </span>
                    </div>
                    {group.adminId === user?.id && (
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded mt-2">Admin</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Family Group Details */}
        <div className="lg:col-span-2">
          {selectedGroup ? (
            <div className="space-y-6">
              {/* Group Info */}
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">{selectedGroup.name}</h3>
                  <span className="px-2 py-1 border rounded text-sm">Invite Code: {selectedGroup.inviteCode}</span>
                </div>
                {selectedGroup.description && (
                  <p className="text-gray-600 mb-4">{selectedGroup.description}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="font-semibold text-blue-600">{selectedGroup._count.members}</div>
                    <div className="text-sm text-gray-600">Members</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Share2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="font-semibold text-green-600">{selectedGroup._count.sharedRecords}</div>
                    <div className="text-sm text-gray-600">Shared Records</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="font-semibold text-purple-600">{formatDate(selectedGroup.createdAt)}</div>
                    <div className="text-sm text-gray-600">Created</div>
                  </div>
                </div>
              </div>

              {/* Family Members */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-medium mb-4">Family Members</h3>
                <div className="space-y-4">
                  {selectedGroup.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                          {member.patient.firstName[0]}{member.patient.lastName[0]}
                        </div>
                        <div>
                          <div className="font-medium">
                            {getRoleIcon(member.role)} {member.patient.firstName} {member.patient.lastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            Age: {new Date().getFullYear() - new Date(member.patient.dateOfBirth).getFullYear()}
                            {member.patient.gender && ` • ${member.patient.gender}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${getRelationshipColor(member.relationship)}`}>
                          {member.relationship}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          Joined {formatDate(member.joinedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shared Medical Records */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-medium flex items-center mb-4">
                  <Heart className="h-5 w-5 mr-2" />
                  Shared Medical Records
                </h3>
                {sharedRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No medical records shared yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sharedRecords.map((shared) => (
                      <div key={shared.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{shared.record.title}</div>
                          <span className="px-2 py-1 border rounded text-sm">{shared.shareLevel}</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Type: {shared.record.recordType} • Date: {formatDate(shared.record.visitDate)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Shared by {shared.sharer.firstName} {shared.sharer.lastName} on {formatDate(shared.sharedAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border p-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Family Group Selected</h3>
              <p className="text-gray-500 mb-4">Select a family group from the sidebar to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Family Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create Family Group</h3>
            <form onSubmit={handleCreateFamilyGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Family Group Name *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Smith Family"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Optional description of your family group"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Invite Family Member</h3>
            <form onSubmit={handleSendInvitation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="member@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship *
                </label>
                <select
                  required
                  value={inviteForm.relationship}
                  onChange={(e) => setInviteForm({...inviteForm, relationship: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Select relationship"
                >
                  <option value="">Select relationship</option>
                  <option value="parent">Parent</option>
                  <option value="child">Child</option>
                  <option value="spouse">Spouse</option>
                  <option value="sibling">Sibling</option>
                  <option value="grandparent">Grandparent</option>
                  <option value="grandchild">Grandchild</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Message
                </label>
                <textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm({...inviteForm, message: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Optional message to include with the invitation"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyDashboard;