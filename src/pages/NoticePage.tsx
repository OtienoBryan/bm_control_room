import React, { useState, useEffect, useMemo } from 'react';
import { Notice, noticeService, CreateNoticeData } from '../services/noticeService';
import { 
  Chip, 
  IconButton, 
  TextField, 
  Button,
  Card,
  CardContent,
  Typography,
  Badge,
  Tooltip,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import { 
  Visibility, 
  Edit, 
  Delete, 
  Add, 
  Search,
  Filter,
  Refresh,
  Schedule,
  Person,
  Message,
  Announcement,
  CheckCircle,
  Cancel
} from '@mui/icons-material';

const NoticePage: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [newNotice, setNewNotice] = useState<CreateNoticeData>({
    title: '',
    content: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setIsLoading(true);
      const data = await noticeService.getNotices();
      setNotices(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching notices:', err);
      setError('Failed to load notices. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewNotice(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && editingNotice) {
        const updatedNotice = await noticeService.updateNotice(editingNotice.id, newNotice);
        setNotices(prev => prev.map(n => n.id === editingNotice.id ? updatedNotice : n));
      } else {
        const createdNotice = await noticeService.createNotice(newNotice);
        setNotices(prev => [...prev, createdNotice]);
      }

      // Reset form and close modal
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingNotice(null);
      setNewNotice({
        title: '',
        content: ''
      });
    } catch (err) {
      console.error('Error saving notice:', err);
      setError(isEditMode ? 'Failed to update notice' : 'Failed to create notice');
    }
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setNewNotice({
      title: notice.title,
      content: notice.content
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      try {
        await noticeService.deleteNotice(id);
        setNotices(prev => prev.filter(n => n.id !== id));
      } catch (err) {
        console.error('Error deleting notice:', err);
        setError('Failed to delete notice');
      }
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const updatedNotice = await noticeService.toggleNoticeStatus(id, newStatus);
      setNotices(prev => prev.map(n => n.id === id ? updatedNotice : n));
    } catch (err) {
      console.error('Error updating notice status:', err);
      setError('Failed to update notice status');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const filteredNotices = useMemo(() => {
    return notices.filter(notice => {
      const matchesSearch = !searchTerm || 
                           notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           notice.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' ? true : 
                           (statusFilter === 'active' ? notice.status === 1 : notice.status === 0);
      
      return matchesSearch && matchesStatus;
    });
  }, [notices, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = notices.length;
    const active = notices.filter(n => n.status === 1).length;
    const inactive = notices.filter(n => n.status === 0).length;
    
    return { total, active, inactive };
  }, [notices]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Notice Board</h1>
              <p className="text-xs text-gray-500 mt-1">Manage and communicate important announcements</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outlined"
                size="small"
                startIcon={<Filter />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{ fontSize: '0.75rem', minWidth: 'auto', padding: '4px 12px' }}
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Refresh />}
                onClick={fetchNotices}
                disabled={isLoading}
                sx={{ fontSize: '0.75rem', minWidth: 'auto', padding: '4px 12px' }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<Add />}
                onClick={() => {
                  setIsModalOpen(true);
                  setIsEditMode(false);
                  setEditingNotice(null);
                  setNewNotice({
                    title: '',
                    content: ''
                  });
                }}
                sx={{ fontSize: '0.75rem', minWidth: 'auto', padding: '4px 12px' }}
              >
                Add Notice
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" className="mb-6" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <Card className="bg-white shadow-sm border p-3 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Notices</p>
                  <p className="text-lg font-bold text-blue-600">{stats.total}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Announcement className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-sm border p-3 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Active</p>
                  <p className="text-lg font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-sm border p-3 border-l-4 border-l-gray-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Inactive</p>
                  <p className="text-lg font-bold text-gray-600">{stats.inactive}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-full">
                  <Cancel className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField
                    fullWidth
                    size="small"
                    label="Search"
                    placeholder="Search by title or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search className="text-gray-400" style={{ fontSize: '0.875rem' }} />
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '0.75rem', padding: '6px 12px' },
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' }
                    }}
                  />

                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                      label="Status"
                      sx={{
                        fontSize: '0.75rem',
                        '& .MuiSelect-select': { fontSize: '0.75rem', padding: '6px 12px' }
                      }}
                    >
                      <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>All Status</MenuItem>
                      <MenuItem value="active" sx={{ fontSize: '0.75rem' }}>Active</MenuItem>
                      <MenuItem value="inactive" sx={{ fontSize: '0.75rem' }}>Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </div>

                <div className="flex justify-end mt-4">
                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    size="small"
                    sx={{ fontSize: '0.75rem', minWidth: 'auto', padding: '4px 12px' }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* View Toggle */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'table', label: 'Table View', icon: '📋' },
                { key: 'cards', label: 'Card View', icon: '🃏' }
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key as 'cards' | 'table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    viewMode === key
                      ? 'bg-red-600 text-white shadow-lg transform scale-105'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-red-300'
                  }`}
                >
                  <span className="mr-1.5">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notices List */}
        {viewMode === 'table' ? (
          // Table View
          <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Content
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th scope="col" className="relative px-3 py-2">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNotices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-xs text-gray-500">
                        <div className="flex flex-col items-center">
                          <Announcement className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm font-medium text-gray-900 mb-1">No notices found</p>
                          <p className="text-xs text-gray-500">
                            {searchTerm || statusFilter !== 'all'
                              ? 'Try adjusting your filters or search terms.'
                              : 'Get started by creating your first notice.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredNotices.map((notice) => (
                      <tr key={notice.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900">{notice.title}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {notice.content}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <Chip
                            label={notice.status === 1 ? 'Active' : 'Inactive'}
                            color={notice.status === 1 ? 'success' : 'default'}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: '20px' }}
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {formatDate(notice.created_at)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {notice.updated_at !== notice.created_at ? formatDate(notice.updated_at) : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {notice.created_by_name || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <div className="flex items-center space-x-1">
                            <Tooltip title="Edit Notice">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(notice)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                sx={{ padding: '4px' }}
                              >
                                <Edit className="h-4 w-4" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title={notice.status === 1 ? 'Deactivate' : 'Activate'}>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleStatus(notice.id, notice.status)}
                                className={`${
                                  notice.status === 1 
                                    ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
                                    : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                                }`}
                                sx={{ padding: '4px' }}
                              >
                                <Visibility className="h-4 w-4" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete Notice">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(notice.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                sx={{ padding: '4px' }}
                              >
                                <Delete className="h-4 w-4" />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Card View
          <div className="space-y-4">
            {filteredNotices.length === 0 ? (
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6 text-center">
                  <Announcement className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem', fontWeight: 500 }} gutterBottom>
                    No notices found
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your filters or search terms.'
                      : 'Get started by creating your first notice.'}
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              filteredNotices.map((notice) => (
                <Card 
                  key={notice.id} 
                  className={`bg-white shadow-sm transition-all duration-200 hover:shadow-md ${
                    notice.status === 1 ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-300'
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                      {/* Left Section - Notice Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Typography variant="body1" sx={{ fontSize: '0.875rem', fontWeight: 600 }} className="text-gray-900">
                            {notice.title}
                          </Typography>
                          <Chip
                            label={notice.status === 1 ? 'Active' : 'Inactive'}
                            color={notice.status === 1 ? 'success' : 'default'}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: '20px' }}
                          />
                        </div>

                        <Typography 
                          variant="body2" 
                          color="textSecondary" 
                          className="mb-2 line-clamp-2"
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {notice.content}
                        </Typography>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Schedule className="h-3 w-3" />
                            <span>Created: {formatDate(notice.created_at)}</span>
                          </div>
                          {notice.updated_at !== notice.created_at && (
                            <div className="flex items-center space-x-1">
                              <Schedule className="h-3 w-3" />
                              <span>Updated: {formatDate(notice.updated_at)}</span>
                            </div>
                          )}
                          {notice.created_by_name && (
                            <div className="flex items-center space-x-1">
                              <Person className="h-3 w-3" />
                              <span>By: {notice.created_by_name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <Tooltip title="Edit Notice">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(notice)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            sx={{ padding: '4px' }}
                          >
                            <Edit className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={notice.status === 1 ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(notice.id, notice.status)}
                            className={`${
                              notice.status === 1 
                                ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
                                : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                            }`}
                            sx={{ padding: '4px' }}
                          >
                            <Visibility className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Notice">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(notice.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            sx={{ padding: '4px' }}
                          >
                            <Delete className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Notice Modal */}
      <Dialog 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '0.875rem', fontWeight: 600, padding: '12px 16px' }}>
          <div className="flex items-center space-x-2">
            <Announcement className="h-4 w-4 text-blue-600" />
            <span>{isEditMode ? 'Edit Notice' : 'Add New Notice'}</span>
          </div>
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <TextField
              label="Title"
              name="title"
              required
              fullWidth
              value={newNotice.title}
              onChange={handleInputChange}
              placeholder="Enter notice title..."
              variant="outlined"
              size="small"
              sx={{
                '& .MuiInputBase-input': { fontSize: '0.75rem' },
                '& .MuiInputLabel-root': { fontSize: '0.75rem' }
              }}
            />
            <TextField
              label="Content"
              name="content"
              required
              fullWidth
              multiline
              rows={4}
              value={newNotice.content}
              onChange={handleInputChange}
              placeholder="Enter notice content..."
              variant="outlined"
              size="small"
              sx={{
                '& .MuiInputBase-input': { fontSize: '0.75rem' },
                '& .MuiInputLabel-root': { fontSize: '0.75rem' }
              }}
            />
          </form>
        </DialogContent>
        <DialogActions sx={{ padding: '8px 16px' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setIsModalOpen(false);
              setIsEditMode(false);
              setEditingNotice(null);
              setNewNotice({
                title: '',
                content: ''
              });
            }}
            sx={{ fontSize: '0.75rem', minWidth: 'auto', padding: '4px 12px' }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="small"
            onClick={handleSubmit}
            disabled={!newNotice.title.trim() || !newNotice.content.trim()}
            sx={{ fontSize: '0.75rem', minWidth: 'auto', padding: '4px 12px' }}
          >
            {isEditMode ? 'Update Notice' : 'Add Notice'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default NoticePage;