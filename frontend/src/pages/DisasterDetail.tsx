import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  User, 
  Tag, 
  FileText, 
  MapPin as MapPinIcon,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { apiService } from '../services/api';
import { Disaster, Report, Resource, SocialMediaPost } from '../types';
import { formatDistanceToNow } from 'date-fns';
import UnifiedMap from '../components/Maps/UnifiedMap';

const DisasterDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch disaster data
  const { data: disasterData, isLoading: disasterLoading } = useQuery(
    ['disaster', id],
    () => apiService.getDisaster(id!),
    { enabled: !!id }
  );

  // Fetch related data
  const { data: reportsData } = useQuery(
    ['reports', id],
    () => apiService.getReports({ disaster_id: id! }),
    { enabled: !!id }
  );

  const { data: resourcesData } = useQuery(
    ['resources', id],
    () => apiService.getResources({ disaster_id: id! }),
    { enabled: !!id }
  );

  const { data: socialMediaData } = useQuery(
    ['social-media', id],
    () => apiService.getSocialMediaPosts(id!),
    { enabled: !!id }
  );

  const disaster = disasterData?.data;

  if (disasterLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!disaster) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Disaster not found</h2>
        <p className="text-gray-600 mb-4">The disaster you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/disasters')} className="btn-primary">
          Back to Disasters
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: AlertTriangle },
    { id: 'reports', label: 'Reports', icon: FileText, count: reportsData?.data?.length },
    { id: 'resources', label: 'Resources', icon: MapPinIcon, count: resourcesData?.data?.length },
    { id: 'social', label: 'Social Media', icon: MessageSquare, count: socialMediaData?.data?.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/disasters')}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{disaster.title}</h1>
          <p className="text-gray-600">{disaster.location_name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                </div>
                <div className="card-body">
                  <p className="text-gray-700">{disaster.description}</p>
                </div>
              </div>

              {/* Map Section */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Location & Resources</h3>
                </div>
                <div className="card-body p-0">
                  <UnifiedMap
                    center={disaster.location ? { lat: disaster.location.lat, lng: disaster.location.lng } : undefined}
                    zoom={12}
                    height="400px"
                    locations={[
                      // Disaster location
                      ...(disaster.location ? [{
                        lat: disaster.location.lat,
                        lng: disaster.location.lng,
                        name: disaster.title,
                        type: 'disaster',
                        description: disaster.description
                      }] : []),
                      // Nearby resources
                      ...(resourcesData?.data?.map(resource => ({
                        lat: resource.location?.lat || 0,
                        lng: resource.location?.lng || 0,
                        name: resource.name,
                        type: resource.type,
                        description: `${resource.type} - ${resource.available ? 'Available' : 'Unavailable'}`
                      })) || [])
                    ]}
                    onLocationClick={(location) => {
                      console.log('Location clicked:', location);
                    }}
                  />
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Details</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Location</p>
                        <p className="text-sm text-gray-600">{disaster.location_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Created by</p>
                        <p className="text-sm text-gray-600">{disaster.owner_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Created</p>
                        <p className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(disaster.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Updated</p>
                        <p className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(disaster.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {disaster.tags && disaster.tags.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
                  </div>
                  <div className="card-body">
                    <div className="flex flex-wrap gap-2">
                      {disaster.tags.map((tag) => (
                        <span key={tag} className="badge-primary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Reports</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {reportsData?.data?.length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Resources</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {resourcesData?.data?.length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Social Posts</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {socialMediaData?.data?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    <button className="w-full btn-primary">
                      <FileText className="w-4 h-4 mr-2" />
                      Add Report
                    </button>
                    <button className="w-full btn-secondary">
                      <MapPinIcon className="w-4 h-4 mr-2" />
                      Add Resource
                    </button>
                    <button className="w-full btn-secondary">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      View Social Media
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            {reportsData?.data && reportsData.data.length > 0 ? (
              reportsData.data.map((report) => (
                <div key={report.id} className="card">
                  <div className="card-body">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-900 mb-2">{report.content}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>by {report.user_id}</span>
                          <span>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
                          <span className={`badge ${
                            report.verification_status === 'verified' ? 'badge-success' :
                            report.verification_status === 'rejected' ? 'badge-danger' : 'badge-warning'
                          }`}>
                            {report.verification_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No reports found for this disaster.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-4">
            {resourcesData?.data && resourcesData.data.length > 0 ? (
              resourcesData.data.map((resource) => (
                <div key={resource.id} className="card">
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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No resources found for this disaster.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-4">
            {socialMediaData?.data && socialMediaData.data.length > 0 ? (
              socialMediaData.data.map((post) => (
                <div key={post.id} className="card">
                  <div className="card-body">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">@{post.user}</span>
                          <span className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                          </span>
                          <span className={`badge ${
                            post.priority === 'urgent' ? 'badge-danger' :
                            post.priority === 'high' ? 'badge-warning' :
                            post.priority === 'medium' ? 'badge-primary' : 'badge-success'
                          }`}>
                            {post.priority}
                          </span>
                        </div>
                        <p className="text-gray-700">{post.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No social media posts found for this disaster.</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DisasterDetail; 