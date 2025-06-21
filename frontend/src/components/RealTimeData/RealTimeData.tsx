import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { socketService } from '../../services/socket';
import { Disaster, SocialMediaPost, Resource } from '../../types';

interface RealTimeDataProps {
  disasterId?: string;
  showWeather?: boolean;
  showEmergencyAlerts?: boolean;
  showSocialMedia?: boolean;
  showResources?: boolean;
}

interface RealTimeDataState {
  disasters: Disaster[];
  socialMedia: SocialMediaPost[];
  weather: any[];
  emergencyAlerts: any[];
  resources: Resource[];
  lastUpdate: string;
  loading: boolean;
  error: string | null;
}

const RealTimeData: React.FC<RealTimeDataProps> = ({
  disasterId,
  showWeather = true,
  showEmergencyAlerts = true,
  showSocialMedia = true,
  showResources = true
}) => {
  const [data, setData] = useState<RealTimeDataState>({
    disasters: [],
    socialMedia: [],
    weather: [],
    emergencyAlerts: [],
    resources: [],
    lastUpdate: '',
    loading: true,
    error: null
  });

  useEffect(() => {
    // Connect to socket for real-time updates
    socketService.connect();

    // Join disaster room if disasterId is provided
    if (disasterId) {
      socketService.joinDisaster(disasterId);
    }

    // Load initial data
    loadRealTimeData();

    // Set up real-time listeners
    const handleRealTimeUpdate = (updateData: any) => {
      setData(prev => ({
        ...prev,
        ...updateData.data,
        lastUpdate: updateData.timestamp
      }));
    };

    const handleDisasterRealTimeUpdate = (updateData: any) => {
      if (disasterId && updateData.disasterId === disasterId) {
        setData(prev => ({
          ...prev,
          ...updateData.data,
          lastUpdate: updateData.timestamp
        }));
      }
    };

    socketService.on('realtime_update', handleRealTimeUpdate);
    socketService.on('disaster_realtime_update', handleDisasterRealTimeUpdate);

    // Cleanup
    return () => {
      if (disasterId) {
        socketService.leaveDisaster(disasterId);
      }
      socketService.off('realtime_update', handleRealTimeUpdate);
      socketService.off('disaster_realtime_update', handleDisasterRealTimeUpdate);
    };
  }, [disasterId]);

  const loadRealTimeData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await apiService.getRealTimeData(disasterId);
      
      if (response.success) {
        setData({
          disasters: response.data.disasters || [],
          socialMedia: response.data.socialMedia || [],
          weather: response.data.weather || [],
          emergencyAlerts: response.data.emergencyAlerts || [],
          resources: response.data.resources || [],
          lastUpdate: response.data.timestamp || new Date().toISOString(),
          loading: false,
          error: null
        });
      } else {
        setData(prev => ({ ...prev, loading: false, error: response.error || 'Failed to load data' }));
      }
    } catch (error) {
      setData(prev => ({ ...prev, loading: false, error: 'Failed to load real-time data' }));
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'extreme':
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'severe':
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'moderate':
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (data.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading real-time data...</span>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading real-time data</h3>
            <p className="text-sm text-red-700 mt-1">{data.error}</p>
            <button
              onClick={loadRealTimeData}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Real-Time Data</h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-500">
            Last updated: {formatTimestamp(data.lastUpdate)}
          </span>
        </div>
      </div>

      {/* Weather Alerts */}
      {showWeather && data.weather.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            Weather Alerts ({data.weather.length})
          </h3>
          <div className="space-y-3">
            {data.weather.slice(0, 5).map((alert) => (
              <div key={alert.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{alert.type}</h4>
                    <p className="text-sm text-gray-600">{alert.area}</p>
                    <p className="text-sm text-gray-500 mt-1">{alert.description}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Alerts */}
      {showEmergencyAlerts && data.emergencyAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Emergency Alerts ({data.emergencyAlerts.length})
          </h3>
          <div className="space-y-3">
            {data.emergencyAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="border-l-4 border-red-500 pl-4 py-2">
                <div>
                  <h4 className="font-medium text-gray-900">{alert.title}</h4>
                  <p className="text-sm text-gray-600">{alert.state}, {alert.county}</p>
                  <p className="text-sm text-gray-500 mt-1">{alert.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Declared: {formatTimestamp(alert.declarationDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Media */}
      {showSocialMedia && data.socialMedia.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            Social Media Updates ({data.socialMedia.length})
          </h3>
          <div className="space-y-3">
            {data.socialMedia.slice(0, 5).map((post) => (
              <div key={post.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">@{post.user}</span>
                      <span className="text-xs text-gray-500">{formatTimestamp(post.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{post.content}</p>
                  </div>
                  {post.priority && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(post.priority)}`}>
                      {post.priority}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources */}
      {showResources && data.resources.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Available Resources ({data.resources.length})
          </h3>
          <div className="space-y-3">
            {data.resources.slice(0, 5).map((resource) => (
              <div key={resource.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{resource.name}</h4>
                    <p className="text-sm text-gray-600">{resource.location_name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Type: {resource.type} {resource.capacity && `• Capacity: ${resource.capacity}`}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Available
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data */}
      {!data.loading && 
       data.weather.length === 0 && 
       data.emergencyAlerts.length === 0 && 
       data.socialMedia.length === 0 && 
       data.resources.length === 0 && (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No real-time data available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Check back later for updates from emergency services and social media.
          </p>
        </div>
      )}
    </div>
  );
};

export default RealTimeData; 