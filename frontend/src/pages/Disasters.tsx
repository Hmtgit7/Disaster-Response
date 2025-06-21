import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  User, 
  Tag,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiService } from '../services/api';
import { Disaster, DisasterFilters } from '../types';
import { formatDistanceToNow } from 'date-fns';
import CreateDisasterModal from '../components/Modals/CreateDisasterModal';

const Disasters: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState<DisasterFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch disasters
  const { data: disastersData, isLoading, error } = useQuery(
    ['disasters', filters, page],
    () => apiService.getDisasters(filters, page, 10)
  );

  // Delete disaster mutation
  const deleteMutation = useMutation(
    (id: string) => apiService.deleteDisaster(id),
    {
      onSuccess: () => {
        toast.success('Disaster deleted successfully');
        queryClient.invalidateQueries(['disasters']);
      },
      onError: () => {
        toast.error('Failed to delete disaster');
      }
    }
  );

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setPage(1);
  };

  const handleFilterChange = (key: keyof DisasterFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this disaster?')) {
      deleteMutation.mutate(id);
    }
  };

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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Failed to load disasters</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary mt-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disasters</h1>
          <p className="text-gray-600">Manage and monitor disaster events</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Disaster
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search disasters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Tag Filter */}
            <div>
              <select
                value={filters.tag || ''}
                onChange={(e) => handleFilterChange('tag', e.target.value)}
                className="input"
              >
                <option value="">All Tags</option>
                <option value="flood">Flood</option>
                <option value="fire">Fire</option>
                <option value="earthquake">Earthquake</option>
                <option value="tornado">Tornado</option>
                <option value="hurricane">Hurricane</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Owner Filter */}
            <div>
              <select
                value={filters.owner_id || ''}
                onChange={(e) => handleFilterChange('owner_id', e.target.value)}
                className="input"
              >
                <option value="">All Owners</option>
                <option value="netrunnerX">netrunnerX</option>
                <option value="reliefAdmin">reliefAdmin</option>
                <option value="anonymous">Anonymous</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Disasters List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : disastersData?.data && disastersData.data.length > 0 ? (
          disastersData.data.map((disaster) => (
            <motion.div
              key={disaster.id}
              variants={itemVariants}
              className="card hover:shadow-medium transition-shadow"
            >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {disaster.title}
                      </h3>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{disaster.location_name}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{disaster.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{disaster.owner_id}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDistanceToNow(new Date(disaster.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {disaster.tags && disaster.tags.length > 0 && (
                      <div className="flex items-center space-x-2 mt-3">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <div className="flex flex-wrap gap-1">
                          {disaster.tags.map((tag) => (
                            <span key={tag} className="badge-primary">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => navigate(`/disasters/${disaster.id}`)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/disasters/${disaster.id}?edit=true`)}
                      className="p-2 text-gray-400 hover:text-warning-600 hover:bg-warning-50 rounded-md"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(disaster.id)}
                      className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-md"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="card">
            <div className="card-body text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No disasters found</h3>
              <p className="text-gray-500 mb-4">
                {filters.search || filters.tag || filters.owner_id 
                  ? 'Try adjusting your filters' 
                  : 'Get started by creating your first disaster'
                }
              </p>
              {!filters.search && !filters.tag && !filters.owner_id && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Disaster
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {disastersData?.pagination && disastersData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, disastersData.pagination.total)} of{' '}
            {disastersData.pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {disastersData.pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(prev => Math.min(disastersData.pagination.totalPages, prev + 1))}
              disabled={page === disastersData.pagination.totalPages}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Disaster Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateDisasterModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              queryClient.invalidateQueries(['disasters']);
              toast.success('Disaster created successfully');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Disasters; 