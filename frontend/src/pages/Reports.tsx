import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { FileText, User, Calendar } from 'lucide-react';
import { apiService } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

const Reports: React.FC = () => {
  const { data: reportsData, isLoading } = useQuery(
    'reports',
    () => apiService.getReports({}, 1, 20)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">View and manage disaster reports</p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        {reportsData?.data && reportsData.data.length > 0 ? (
          reportsData.data.map((report) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="card-body">
                <p className="text-gray-900 mb-2">{report.content}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{report.user_id}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
                  </div>
                  <span className={`badge ${
                    report.verification_status === 'verified' ? 'badge-success' :
                    report.verification_status === 'rejected' ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {report.verification_status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-500">Reports will appear here when they are created.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Reports; 