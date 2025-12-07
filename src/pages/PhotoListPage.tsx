import React, { useState, useEffect, useRef } from 'react';
import { Staff, staffService } from '../services/staffService';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type StatusFilter = 'all' | 'active' | 'inactive';

const PhotoListPage: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const contentRef = useRef<HTMLDivElement>(null);
  const { user, isLoading: authLoading } = useAuth();

  // Get current date in format: DD MMMM YYYY
  const currentDate = new Date().toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  useEffect(() => {
    // Wait for auth to finish loading before making API calls
    if (authLoading) {
      return;
    }
    
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchStaff = async () => {
      try {
        const data = await staffService.getStaffList();
        setStaff(data);
        setError(null);
      } catch (err: any) {
        // Check if it's an authentication error
        if (err?.status === 401) {
          setError('Authentication required. Please log in again.');
        } else {
        setError('Failed to load staff list');
        }
        console.error('Error fetching staff:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, [user, authLoading]);

  const exportToPDF = async () => {
    if (!contentRef.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 297; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`cit-photo-list-${currentDate.replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-3"></div>
          <div className="text-xs text-gray-600">Loading staff list...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <div className="text-xs text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  const activeStaff = staff.filter(s => s.status === 1);
  const inactiveStaff = staff.filter(s => s.status === 0);

  // Filter staff based on selected status
  const getFilteredStaff = () => {
    switch (statusFilter) {
      case 'active':
        return activeStaff;
      case 'inactive':
        return inactiveStaff;
      default:
        return staff;
    }
  };

  const filteredStaff = getFilteredStaff();

  return (
    <div className="px-3 sm:px-4 lg:px-6">
      {/* Header Section */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-base font-bold text-gray-900">Staff Photo Directory</h1>
            <p className="text-xs text-gray-500 mt-1">{currentDate}</p>
          </div>
            <button
              onClick={exportToPDF}
              disabled={isExporting}
            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg shadow-sm text-white transition-colors ${
              isExporting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
            }`}
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </>
            )}
          </button>
        </div>

        {/* Status Filter */}
        <div className="mb-4">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">Filter by Status:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({staff.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === 'active'
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active ({activeStaff.length})
                </button>
                <button
                  onClick={() => setStatusFilter('inactive')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === 'inactive'
                      ? 'bg-gray-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Inactive ({inactiveStaff.length})
            </button>
          </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-blue-600 font-medium mb-1">Total Staff</div>
            <div className="text-sm font-bold text-blue-900">{staff.length}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
            <div className="text-xs text-green-600 font-medium mb-1">Active</div>
            <div className="text-sm font-bold text-green-900">{activeStaff.length}</div>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-600 font-medium mb-1">Inactive</div>
            <div className="text-sm font-bold text-gray-900">{inactiveStaff.length}</div>
          </div>
        </div>
      </div>

      {/* Photo Grid - Display Version */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">
            {statusFilter === 'all' && 'All Staff Members'}
            {statusFilter === 'active' && 'Active Staff Members'}
            {statusFilter === 'inactive' && 'Inactive Staff Members'}
            <span className="ml-2 text-xs font-normal text-gray-500">({filteredStaff.length})</span>
          </h2>
        </div>
        <div className="p-4">
          {filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-xs text-gray-500">
                {statusFilter === 'all' && 'No staff members found'}
                {statusFilter === 'active' && 'No active staff members found'}
                {statusFilter === 'inactive' && 'No inactive staff members found'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredStaff.map((member) => (
                <div
                  key={member.id}
                  className={`group bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-200 ${
                    member.status === 1
                      ? 'hover:shadow-md hover:border-red-300'
                      : 'opacity-75 hover:opacity-100 hover:shadow-md'
                  }`}
                >
                  <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 aspect-square flex items-center justify-center overflow-hidden">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={member.name}
                        className={`w-full h-full object-cover transition-transform duration-200 ${
                          member.status === 1
                            ? 'group-hover:scale-105'
                            : 'grayscale group-hover:grayscale-0'
                        }`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          if (target.nextElementSibling) {
                            (target.nextElementSibling as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      className={`absolute inset-0 flex items-center justify-center ${member.photo_url ? 'hidden' : 'flex'}`}
                    >
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        member.status === 1
                          ? 'bg-gradient-to-br from-red-400 to-red-600'
                          : 'bg-gradient-to-br from-gray-400 to-gray-600'
                      }`}>
                        <span className="text-white text-lg font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${
                        member.status === 1
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {member.status === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 space-y-1">
                    <h4 className="text-xs font-semibold text-gray-900 truncate" title={member.name}>
                      {member.name}
                    </h4>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-gray-600 font-medium">{member.role}</p>
                      <p className="text-[10px] text-gray-500">#{member.empl_no}</p>
                      <p className="text-[10px] text-gray-500">ID: {member.id_no}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PDF Export Version - Off-screen with compact design */}
      <div ref={contentRef} className="fixed -left-[9999px] top-0 w-[297mm] bg-white p-4" style={{ width: '297mm', minHeight: '210mm' }}>
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold text-gray-900 mb-1">Staff Photo Directory</h1>
          <p className="text-xs text-gray-600 mb-2">{currentDate}</p>
          <div className="flex justify-center gap-4 mb-3">
            <div className="text-xs">
              <span className="font-semibold">Total:</span> {staff.length}
            </div>
            <div className="text-xs">
              <span className="font-semibold">Active:</span> {activeStaff.length}
            </div>
            <div className="text-xs">
              <span className="font-semibold">Inactive:</span> {inactiveStaff.length}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-6 gap-2">
          {activeStaff.map((member) => (
                <div
                  key={member.id}
              className="bg-white border border-gray-300 rounded overflow-hidden"
                >
              <div className="relative bg-gray-100 aspect-square flex items-center justify-center overflow-hidden" style={{ height: '80px' }}>
                {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.nextElementSibling) {
                        (target.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className={`absolute inset-0 flex items-center justify-center ${member.photo_url ? 'hidden' : 'flex'}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    member.status === 1
                      ? 'bg-red-600'
                      : 'bg-gray-500'
                  }`}>
                    <span className="text-white text-sm font-bold">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-1.5 bg-white">
                <h4 className="text-xs font-bold text-gray-900 mb-0.5 text-center leading-tight">
                  {member.name}
                </h4>
                <div className="space-y-0.5 text-center">
                  <p className="text-[10px] font-semibold text-gray-800">{member.role}</p>
                  <p className="text-[9px] text-gray-600">#{member.empl_no}</p>
                  <p className="text-[9px] text-gray-600">ID: {member.id_no}</p>
                  <span className={`inline-block mt-0.5 px-1 py-0.5 rounded text-[9px] font-medium ${
                    member.status === 1
                      ? 'bg-green-200 text-green-900'
                      : 'bg-red-200 text-red-900'
                  }`}>
                    {member.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                  </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};

export default PhotoListPage;