import React, { useState, useMemo } from 'react';
import { SosData, sosService } from '../services/sosService';
import { 
  Chip, 
  IconButton, 
  Select, 
  MenuItem, 
  FormControl, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Box,
  InputLabel,
  Card,
  CardContent,
  Typography,
  Badge,
  Tooltip,
  Alert,
  Skeleton
} from '@mui/material';
import { 
  MapPin, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Filter,
  Search,
  RefreshCw,
  Calendar,
  User,
  MessageSquare
} from 'lucide-react';
import LocationModal from '../components/Requests/LocationModal';
import { useSos } from '../contexts/SosContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const SosListPage: React.FC = () => {
  const { sosList, isLoading, hasActiveSos, refreshSosList } = useSos();
  const [selectedSos, setSelectedSos] = useState<SosData | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ id: number; status: SosData['status'] } | null>(null);
  const [statusFilter, setStatusFilter] = useState<SosData['status'] | 'all'>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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

  const handleDateChange = (setter: React.Dispatch<React.SetStateAction<Date | null>>) => (date: Date | null) => {
    setter(date);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setStartDate(null);
    setEndDate(null);
    setSearchTerm('');
  };

  const filteredSosList = useMemo(() => {
    return sosList.filter(sos => {
      const sosDate = new Date(sos.created_at);
      const matchesStatus = statusFilter === 'all' ? true : sos.status === statusFilter;
      
      const matchesDateRange = (!startDate || sosDate >= startDate) && 
                              (!endDate || sosDate <= new Date(endDate.setHours(23, 59, 59, 999)));
      
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
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: SosData['status']) => {
    switch (status) {
      case 'pending':
        return 'error';
      case 'in_progress':
        return 'warning';
      case 'resolved':
        return 'success';
      default:
        return 'default';
    }
  };

  const getSosTypeColor = (sosType: string) => {
    return sosType === 'emergency' ? 'error' : 'warning';
  };

  const stats = useMemo(() => {
    const total = sosList.length;
    const pending = sosList.filter(s => s.status === 'pending').length;
    const inProgress = sosList.filter(s => s.status === 'in_progress').length;
    const resolved = sosList.filter(s => s.status === 'resolved').length;
    
    return { total, pending, inProgress, resolved };
  }, [sosList]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SOS Alerts</h1>
            <p className="text-gray-600 mt-2">Monitor and manage security alerts in real-time</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outlined"
              startIcon={<RefreshCw className="h-4 w-4" />}
              onClick={refreshSosList}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<Filter className="h-4 w-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </div>

        {/* Active SOS Alert */}
        {hasActiveSos && (
          <Alert severity="error" className="mb-6">
            <AlertTriangle className="h-5 w-5" />
            <strong>Active SOS Alert!</strong> There are {stats.pending} active SOS alerts requiring immediate attention.
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white shadow-sm border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Alerts
                  </Typography>
                  <Typography variant="h4" className="font-bold text-blue-600">
                    {stats.total}
                  </Typography>
                </div>
                <AlertTriangle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Pending
                  </Typography>
                  <Typography variant="h4" className="font-bold text-red-600">
                    {stats.pending}
                  </Typography>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    In Progress
                  </Typography>
                  <Typography variant="h4" className="font-bold text-yellow-600">
                    {stats.inProgress}
                  </Typography>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Resolved
                  </Typography>
                  <Typography variant="h4" className="font-bold text-green-600">
                    {stats.resolved}
                  </Typography>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  placeholder="Search by guard name, type, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search className="h-4 w-4 text-gray-400 mr-2" />
                  }}
                />

                {/* Status Filter */}
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as SosData['status'] | 'all')}
                    label="Status"
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="resolved">Resolved</MenuItem>
                  </Select>
                </FormControl>

                {/* Date Range */}
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={handleDateChange(setStartDate)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={handleDateChange(setEndDate)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </div>

              <div className="flex justify-end mt-4">
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  size="small"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* SOS List */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Skeleton variant="circular" width={40} height={40} />
                    <div>
                      <Skeleton variant="text" width={120} height={24} />
                      <Skeleton variant="text" width={80} height={16} />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Skeleton variant="text" width={100} height={32} />
                    <Skeleton variant="text" width={80} height={32} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredSosList.length === 0 ? (
          // Empty state
          <Card className="bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No SOS alerts found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {searchTerm || statusFilter !== 'all' || startDate || endDate
                  ? 'Try adjusting your filters or search terms.'
                  : 'All clear! No active security alerts at the moment.'}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          // SOS Alert Cards
          filteredSosList.map((sos) => (
            <Card 
              key={sos.id} 
              className={`bg-white shadow-sm transition-all duration-200 hover:shadow-md ${
                sos.status === 'pending' ? 'border-l-4 border-l-red-500' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Section - Alert Info */}
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      <Badge
                        badgeContent={sos.status === 'pending' ? '!' : ''}
                        color="error"
                        invisible={sos.status !== 'pending'}
                      >
                        <div className={`p-2 rounded-full ${
                          sos.status === 'pending' ? 'bg-red-100' : 
                          sos.status === 'in_progress' ? 'bg-yellow-100' : 'bg-green-100'
                        }`}>
                          {getStatusIcon(sos.status)}
                        </div>
                      </Badge>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <Chip
                          label={sos.sos_type}
                          color={getSosTypeColor(sos.sos_type) as any}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={sos.status.replace('_', ' ')}
                          color={getStatusColor(sos.status) as any}
                          size="small"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <Typography variant="body1" className="font-medium">
                            {sos.guard_name}
                          </Typography>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <Typography variant="body2" color="textSecondary">
                            {new Date(sos.created_at).toLocaleString()}
                          </Typography>
                        </div>

                        {sos.comment && (
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                            <Typography variant="body2" color="textSecondary" className="line-clamp-2">
                              {sos.comment}
                            </Typography>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    {/* Status Update */}
                    <FormControl size="small" variant="outlined">
                      <Select
                        value={sos.status}
                        onChange={(e) => handleStatusChange(sos.id, e.target.value as SosData['status'])}
                        size="small"
                        sx={{ minWidth: 140 }}
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="in_progress">In Progress</MenuItem>
                        <MenuItem value="resolved">Resolved</MenuItem>
                      </Select>
                    </FormControl>

                    {/* Location Button */}
                    <Tooltip title="View Location">
                      <IconButton
                        size="small"
                        onClick={() => handleViewLocation(sos)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <MapPin className="h-5 w-5" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
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
      <Dialog open={isCommentDialogOpen} onClose={handleCommentCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Update SOS Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" className="mb-4">
            Please provide a comment for the status update to {pendingStatusUpdate?.status}.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Comment"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter details about the status update..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCommentCancel}>Cancel</Button>
          <Button 
            onClick={handleCommentSubmit} 
            variant="contained" 
            color="primary"
            disabled={!comment.trim()}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SosListPage; 