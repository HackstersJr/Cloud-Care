/**
 * CloudCare Loading Components
 * 
 * Provides various loading indicators and skeleton components
 * for different parts of the application.
 */

import { RefreshCw, Activity, Shield, Database } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'gray' | 'white';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  color = 'blue', 
  text, 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    gray: 'text-gray-600',
    white: 'text-white',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center space-x-2">
        <RefreshCw className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`} />
        {text && (
          <span className={`text-sm ${colorClasses[color]}`}>
            {text}
          </span>
        )}
      </div>
    </div>
  );
}

interface PageLoadingProps {
  title?: string;
  subtitle?: string;
  showBlockchainStatus?: boolean;
}

export function PageLoading({ 
  title = 'Loading...', 
  subtitle, 
  showBlockchainStatus = false 
}: PageLoadingProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-blue-600 animate-pulse" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        
        {subtitle && (
          <p className="text-gray-600 mb-6">{subtitle}</p>
        )}
        
        <div className="flex items-center justify-center space-x-2 mb-6">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-gray-600">Please wait...</span>
        </div>

        {showBlockchainStatus && (
          <div className="bg-white rounded-lg p-4 shadow-sm border max-w-sm mx-auto">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-900">Blockchain Protection</span>
            </div>
            <p className="text-xs text-gray-600">
              Verifying data integrity on Polygon network...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface CardSkeletonProps {
  rows?: number;
  showAvatar?: boolean;
  className?: string;
}

export function CardSkeleton({ rows = 3, showAvatar = false, className = '' }: CardSkeletonProps) {
  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm border ${className}`}>
      <div className="animate-pulse">
        {showAvatar && (
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="ml-3 flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface DashboardSkeletonProps {
  showStats?: boolean;
  showActivity?: boolean;
  showActions?: boolean;
}

export function DashboardSkeleton({ 
  showStats = true, 
  showActivity = true, 
  showActions = true 
}: DashboardSkeletonProps) {
  return (
    <div className="space-y-6 p-6">
      {/* Welcome Section Skeleton */}
      <div className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>

      {/* Stats Grid Skeleton */}
      {showStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm border animate-pulse">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="ml-3 flex-1">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Activity Skeleton */}
      {showActivity && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-start animate-pulse">
                  <div className="w-2 h-2 bg-gray-200 rounded-full mt-2 mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Skeleton */}
      {showActions && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm border animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface BlockchainLoadingProps {
  action: 'connecting' | 'verifying' | 'storing' | 'syncing';
  recordTitle?: string;
  className?: string;
}

export function BlockchainLoading({ action, recordTitle, className = '' }: BlockchainLoadingProps) {
  const actionMessages = {
    connecting: 'Connecting to Polygon network...',
    verifying: 'Verifying record integrity on blockchain...',
    storing: 'Storing record hash on blockchain...',
    syncing: 'Synchronizing with blockchain...',
  };

  const actionIcons = {
    connecting: Database,
    verifying: Shield,
    storing: Database,
    syncing: RefreshCw,
  };

  const ActionIcon = actionIcons[action];

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <ActionIcon className="w-4 h-4 text-blue-600 animate-pulse" />
        </div>
        
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">
            {actionMessages[action]}
          </p>
          {recordTitle && (
            <p className="text-xs text-blue-700 mt-1">
              Record: {recordTitle}
            </p>
          )}
        </div>
        
        <LoadingSpinner size="sm" color="blue" />
      </div>
    </div>
  );
}

interface InlineLoadingProps {
  text?: string;
  size?: 'sm' | 'md';
  color?: 'blue' | 'green' | 'gray';
  className?: string;
}

export function InlineLoading({ 
  text = 'Loading...', 
  size = 'sm', 
  color = 'gray',
  className = '' 
}: InlineLoadingProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LoadingSpinner size={size} color={color} />
      <span className={`text-${size === 'sm' ? 'sm' : 'base'} text-gray-600`}>
        {text}
      </span>
    </div>
  );
}

// List of loading messages for better UX
export const loadingMessages = {
  authentication: [
    'Verifying credentials...',
    'Connecting to secure servers...',
    'Setting up your session...',
  ],
  blockchain: [
    'Connecting to Polygon network...',
    'Verifying blockchain status...',
    'Checking wallet connection...',
  ],
  medicalRecords: [
    'Loading your health records...',
    'Verifying data integrity...',
    'Fetching latest updates...',
  ],
  dashboard: [
    'Loading your health dashboard...',
    'Gathering health statistics...',
    'Checking recent activity...',
  ],
};

export default LoadingSpinner;
