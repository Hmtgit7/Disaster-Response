import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { 
  AlertTriangle, 
  FileText, 
  MapPin, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Clock,
  Activity
} from 'lucide-react';
import { apiService } from '../services/api';
import { Disaster, Report, Resource, SocialMediaPost } from '../types';
import { formatDistanceToNow } from 'date-fns';
import RealTimeData from '../components/RealTimeData/RealTimeData';

const Dashboard: React.FC = () => {
  const [urgentAlerts, setUrgentAlerts] = useState<SocialMediaPost[]>([]);

  // Fetch dashboard data
  const { data: disastersData, isLoading: disastersLoading } = useQuery(
    'disasters-dashboard',
    () => apiService.getDisasters({}, 1, 5)
  );

  const { data: reportsData, isLoading: reportsLoading } = useQuery(
    'reports-dashboard',
    () => apiService.getReports({}, 1, 10)
  );

  const { data: resourcesData, isLoading: resourcesLoading } = useQuery(
    'resources-dashboard',
    () => apiService.getResources({}, 1, 10)
  );

  // Fetch real-time data for urgent alerts
  const { data: realTimeData } = useQuery(
    'realtime-data',
    () => apiService.getRealTimeData(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchIntervalInBackground: true
    }
  );

  // Update urgent alerts from real-time data
  useEffect(() => {
    if (realTimeData?.success && realTimeData.data?.socialMedia) {
      const urgent = realTimeData.data.socialMedia.filter(
        (post: SocialMediaPost) => post.priority === 'urgent' || post.priority === 'high'
      );
      setUrgentAlerts(urgent.slice(0, 5));
    }
  }, [realTimeData]);

  const stats = [
    {
      title: 'Active Disasters',
      value: disastersData?.data?.length || 0,
      change: '+12%',
      changeType: 'increase' as const,
      icon: AlertTriangle,
      color: 'text-danger-600',
      bgColor: 'bg-danger-50'
    },
    {
      title: 'Total Reports',
      value: reportsData?.data?.length || 0,
      change: '+8%',
      changeType: 'increase' as const,
      icon: FileText,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50'
    },
    {
      title: 'Available Resources',
      value: resourcesData?.data?.filter(r => r.available)?.length || 0,
      change: '-3%',
      changeType: 'decrease' as const,
      icon: MapPin,
      color: 'text-success-600',
      bgColor: 'bg-success-50'
    },
    {
      title: 'Social Media Posts',
      value: realTimeData?.data?.socialMedia?.length || 156,
      change: '+25%',
      changeType: 'increase' as const,
      icon: MessageSquare,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (disastersLoading || reportsLoading || resourcesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Disaster Response Coordination Overview</p>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">
            Last updated: {formatDistanceToNow(new Date(), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              className="card"
            >
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className={`w-4 h-4 ${
                    stat.changeType === 'increase' ? 'text-success-500' : 'text-danger-500'
                  }`} />
                  <span className={`ml-1 text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">from last hour</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Real-Time Data Section */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="card"
      >
        <RealTimeData 
          showWeather={true}
          showEmergencyAlerts={true}
          showSocialMedia={false}
          showResources={false}
        />
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Disasters */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Disasters</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {disastersData?.data?.map((disaster) => (
                <div key={disaster.id} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-danger-500 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {disaster.title}
                    </p>
                    <p className="text-sm text-gray-500">{disaster.location_name}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(disaster.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))}
              {(!disastersData?.data || disastersData.data.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">No recent disasters</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Urgent Alerts */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Urgent Alerts</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {urgentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-danger-500 rounded-full mt-2 animate-pulse"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">@{alert.user}</span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{alert.content}</p>
                  </div>
                </div>
              ))}
              {urgentAlerts.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No urgent alerts</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Recent Reports */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {reportsData?.data?.slice(0, 5).map((report) => (
                <div key={report.id} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    report.verification_status === 'verified' ? 'bg-success-500' :
                    report.verification_status === 'rejected' ? 'bg-danger-500' : 'bg-warning-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{report.content}</p>
                    <p className="text-xs text-gray-500">by {report.user_id}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))}
              {(!reportsData?.data || reportsData.data.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">No recent reports</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Available Resources */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Available Resources</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {resourcesData?.data?.filter(r => r.available).slice(0, 5).map((resource) => (
                <div key={resource.id} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{resource.name}</p>
                    <p className="text-xs text-gray-500">{resource.type} • {resource.location_name}</p>
                  </div>
                  {resource.capacity && (
                    <span className="text-xs text-gray-500">Cap: {resource.capacity}</span>
                  )}
                </div>
              ))}
              {(!resourcesData?.data || resourcesData.data.filter(r => r.available).length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">No available resources</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard; 