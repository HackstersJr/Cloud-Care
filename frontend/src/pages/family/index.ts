// Family Management Pages
export { default as FamilyGroupsPage } from './FamilyGroupsPage';
export { default as FamilyMembersPage } from './FamilyMembersPage';
export { default as QRSharePage } from './QRSharePage';

// Page routes for router configuration
export const familyRoutes = [
  {
    path: '/family',
    component: 'FamilyGroupsPage',
    title: 'Family Groups'
  },
  {
    path: '/family/:groupId/members',
    component: 'FamilyMembersPage', 
    title: 'Family Members'
  },
  {
    path: '/family/qr-share',
    component: 'QRSharePage',
    title: 'QR Share'
  }
];
