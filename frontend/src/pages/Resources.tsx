import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { MapPin, Calendar, Map, List } from 'lucide-react';
import { apiService } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import UnifiedMap from '../components/Maps/UnifiedMap';

const Resources: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  const { data: resourcesData, isLoading } = useQuery(
    'resources',
    () => apiService.getResources({}, 1, 20)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const mapLocations = resourcesData?.data?.map(resource => ({
    lat: resource.location?.lat || 0,
    lng: resource.location?.lng || 0,
    name: resource.name,
    type: resource.type,
    description: `${resource.type} - ${resource.available ? 'Available' : 'Unavailable'}`
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
          <p className="text-gray-600">View and manage disaster response resources</p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4 inline mr-1" />
            List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Map className="w-4 h-4 inline mr-1" />
            Map
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="card">
          <div className="card-body p-0">
            <UnifiedMap
              center={{ lat: 40.7128, lng: -74.0060 }} // Default to NYC
              zoom={10}
              height="600px"
              locations={mapLocations}
              onLocationClick={(location) => {
                console.log('Resource clicked:', location);
              }}
            />
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {resourcesData?.data && resourcesData.data.length > 0 ? (
            resourcesData.data.map((resource) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{resource.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{resource.location_name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="badge-primary">{resource.type}</span>
                        {resource.capacity && <span>Capacity: {resource.capacity}</span>}
                        <span className={`badge ${resource.available ? 'badge-success' : 'badge-danger'}`}>
                          {resource.available ? 'Available' : 'Unavailable'}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-500">Resources will appear here when they are created.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Resources; 