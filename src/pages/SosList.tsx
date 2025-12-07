import React, { useState, useMemo } from 'react';
import { SosData, sosService } from '../services/sosService';
import { 
  MapPin, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Search,
  RefreshCw,
  X
} from 'lucide-react';
import LocationModal from '../components/Requests/LocationModal';
import { useSos } from '../contexts/SosContext';

const SosListPage: React.FC = () => {
  const { sosList, isLoading, hasActiveSos, refreshSosList } = useSos();
  const [selectedSos, setSelectedSos] = useState<SosData | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ id: number; status: SosData['status'] } | null>(null);
  const [statusFilter, setStatusFilter] = useState<SosData['status'] | 'all' | 'active'>('active');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleViewLocation = (sos: SosData) => {
    setSelectedSos(sos);
    setIsLocationModalOpen(true);
  };

  const handleStatusChange = async (sosId: number, newStatus: SosData['status']) => {
    setPendingStatusUpdate({ id: sosId, status: newStatus });
    setIsCommentDialogOpen(true);
  };

  const handleCommentSubmit = async () => {
    if (!pendingStatusUpdate) return;

    try {
      await sosService.updateSosStatus(pendingStatusUpdate.id, pendingStatusUpdate.status, comment);
      await refreshSosList();
      setIsCommentDialogOpen(false);
      setComment('');
      setPendingStatusUpdate(null);
    } catch (error) {
      console.error('Error updating SOS status:', error);
    }
  };

  const handleCommentCancel = () => {
    setIsCommentDialogOpen(false);
    setComment('');
    setPendingStatusUpdate(null);
  };



  const filteredSosList = useMemo(() => {
    return sosList.filter(sos => {
      const sosDate = new Date(sos.created_at);
      
      // Status matching - 'active' means status === 'active' in database
      let matchesStatus = false;
      if (statusFilter === 'all') {
        matchesStatus = true;
      } else if (statusFilter === 'active') {
        matchesStatus = (sos.status as string) === 'active';
      } else {
        matchesStatus = sos.status === statusFilter;
      }
      
      // Date range matching - fix mutation issue
      let matchesDateRange = true;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDateRange = matchesDateRange && sosDate >= start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && sosDate <= end;
      }
      
      const matchesSearch = !searchTerm || 
                           sos.guard_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sos.sos_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sos.status.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesDateRange && matchesSearch;
    });
  }, [sosList, statusFilter, startDate, endDate, searchTerm]);

  const getStatusIcon = (status: SosData['status']) => {
    switch (status) {
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const stats = useMemo(() => {
    const total = sosList.length;
    const pending = sosList.filter(s => s.status === 'pending').length;
    const inProgress = sosList.filter(s => s.status === 'in_progress').length;
    const resolved = sosList.filter(s => s.status === 'resolved').length;
    
    return { total, pending, inProgress, resolved };
  }, [sosList]);

  return (
    <div className="px-4 py-3">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">SOS Alerts</h1>
            <p className="text-xs text-gray-500 mt-0.5">{filteredSosList.length} alert{filteredSosList.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={refreshSosList}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Active Alert Banner */}
        {hasActiveSos && (
          <div className="bg-red-500 text-white px-3 py-2 rounded-lg mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs font-medium">{stats.pending} active alert{stats.pending !== 1 ? 's' : ''} requiring attention</span>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SosData['status'] | 'all' | 'active')}
              className="px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <input
              type="date"
              value={startDate ? startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="date"
              value={endDate ? endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* SOS List */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                  <div className="h-2.5 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))
        ) : filteredSosList.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">
              {searchTerm || statusFilter !== 'all' || startDate || endDate
                ? 'No alerts match your filters'
                : 'No active alerts'}
            </p>
          </div>
        ) : (
          filteredSosList.map((sos) => (
            <div 
              key={sos.id} 
              className="bg-white rounded-lg border border-gray-200 p-3 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                    sos.status === 'pending' || sos.status === 'active' 
                      ? 'bg-red-50' 
                      : sos.status === 'in_progress'
                      ? 'bg-yellow-50'
                      : 'bg-green-50'
                  }`}>
                    {getStatusIcon(sos.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-medium text-gray-900">{sos.guard_name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        sos.status === 'pending' || sos.status === 'active'
                          ? 'bg-red-100 text-red-700'
                          : sos.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {sos.status.replace('_', ' ')}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        sos.sos_type === 'emergency' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {sos.sos_type}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{new Date(sos.created_at).toLocaleDateString()} {new Date(sos.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    
                    {sos.comment && (
                      <p className="text-xs text-gray-600 mt-1.5 line-clamp-1">{sos.comment}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={sos.status}
                    onChange={(e) => handleStatusChange(sos.id, e.target.value as SosData['status'])}
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <button
                    onClick={() => handleViewLocation(sos)}
                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                    title="View Location"
                  >
                    <MapPin className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Location Modal */}
      {selectedSos && (
        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={() => {
            setIsLocationModalOpen(false);
            setSelectedSos(null);
          }}
          latitude={selectedSos.latitude}
          longitude={selectedSos.longitude}
          requestId={selectedSos.id.toString()}
        />
      )}

      {/* Comment Dialog */}
      {isCommentDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Update Status</h3>
              <button
                onClick={handleCommentCancel}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 py-4">
              <p className="text-xs text-gray-600 mb-3">
                Add a comment for status: <span className="font-medium">{pendingStatusUpdate?.status}</span>
              </p>
              <textarea
                autoFocus
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter comment..."
                rows={3}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={handleCommentCancel}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCommentSubmit}
                disabled={!comment.trim()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SosListPage; 