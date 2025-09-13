import React, { useState, useEffect } from 'react';
import { Users, Plus, Settings, Share2, Heart, Shield } from 'lucide-react';
import { getFamilyGroups, createFamilyGroup } from '../../utils/api';

interface FamilyGroup {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  adminId: string;
  admin: {
    id: string;
    firstName: string;
    lastName: string;
  };
  members: Array<{
    id: string;
    relationship: string;
    role: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      dateOfBirth: string;
    };
  }>;
  _count: {
    members: number;
    sharedRecords: number;
  };
}

const FamilyGroupsPage: React.FC = () => {
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: ''
  });

  // Helper function to check if current user is admin of a group
  const isCurrentUserAdmin = (group: FamilyGroup): boolean => {
    // For now, just check if there's an admin in the group
    // This is a simplified check - in practice you'd need to properly match User ID to Patient ID
    return group.members.some(member => member.role === 'admin');
  };

  useEffect(() => {
    loadFamilyGroups();
  }, []);

  const loadFamilyGroups = async () => {
    try {
      setLoading(true);
      const response = await getFamilyGroups();
      console.log('Family groups response:', response);
      
      // Handle the response structure properly
      const groups = response.data || [];
      setFamilyGroups(groups);
      setError(null);
    } catch (err: any) {
      console.error('Error loading family groups:', err);
      setError(err.message || 'Failed to load family groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    try {
      const response = await createFamilyGroup(createForm);
      console.log('Create group response:', response);
      
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '' });
      await loadFamilyGroups(); // Reload the groups
    } catch (err: any) {
      console.error('Error creating family group:', err);
      setError(err.message || 'Failed to create family group');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading family groups...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Family Groups</h1>
              <p className="text-gray-600">Manage your family health network and shared medical records</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Family Group
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Family Groups Grid */}
        {familyGroups.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Family Groups Yet</h3>
            <p className="text-gray-600 mb-6">Create your first family group to start sharing health information with your loved ones.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Family Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {familyGroups.map((group) => (
              <div key={group.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{group.name}</h3>
                      {isCurrentUserAdmin(group) && (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Group Settings"
                    aria-label="Group Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>

                {group.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{group.description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{group._count.members} members</span>
                  </div>
                  <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                    View Details
                  </button>
                  <button className="flex items-center gap-1 bg-green-50 text-green-600 py-2 px-4 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>

                {group.inviteCode && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Invite Code</p>
                    <code className="text-sm font-mono text-gray-900">{group.inviteCode}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Family Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Create Family Group</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Family Group Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={createForm.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Smith Family"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={createForm.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of your family group..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Group
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

export default FamilyGroupsPage;
