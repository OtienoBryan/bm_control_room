import React, { useState, useMemo, useRef } from 'react';
import { RequestData } from '../../services/requestService';
import { TableCell, TableRow, IconButton, TextField, MenuItem, Select, FormControl, InputLabel, Button } from '@mui/material';
import { Visibility, Download } from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface RequestsTableProps {
  requests: RequestData[];
  onRequestClick?: (requestId: number) => void;
}

const RequestsTable: React.FC<RequestsTableProps> = ({ requests, onRequestClick }) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const tableRef = useRef<HTMLDivElement>(null);

  const handleRequestClick = (requestId: number) => {
    if (onRequestClick) {
      onRequestClick(requestId);
    }
  };

  const handleExportToPDF = async () => {
    if (!tableRef.current) return;
    
    setIsExporting(true);
    try {
      // Create a canvas from the table
      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape orientation
      
      const imgWidth = 297; // A4 width in mm
      const pageHeight = 210; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `runs-report-${currentDate}.pdf`;
      
      // Download the PDF
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Get unique clients and branches for filter options
  const uniqueClients = useMemo(() => {
    return Array.from(new Set(requests.map(request => request.clientName))).sort();
  }, [requests]);

  const uniqueBranches = useMemo(() => {
    return Array.from(new Set(requests.map(request => request.branchName))).sort();
  }, [requests]);

  // Filter requests by all criteria
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const requestDate = new Date(request.pickupDate);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      // Date filter
      const dateMatch = (!start || requestDate >= start) && (!end || requestDate <= end);
      
      // Client filter
      const clientMatch = !selectedClient || request.clientName === selectedClient;
      
      // Branch filter
      const branchMatch = !selectedBranch || request.branchName === selectedBranch;

      return dateMatch && clientMatch && branchMatch;
    });
  }, [requests, startDate, endDate, selectedClient, selectedBranch]);

  // Pagination calculations for filtered requests
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, selectedClient, selectedBranch, itemsPerPage]);

  // Calculate total price for filtered requests
  const totalPrice = filteredRequests.reduce((sum, request) => {
    const price = Number(request.price) || 0;
    return sum + price;
  }, 0);

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-4 lg:-mx-6">
        <div className="py-2 align-middle inline-block min-w-full sm:px-4 lg:px-6">
          <div ref={tableRef} className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <div className="px-3 py-3 border-b border-gray-200 sm:px-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h3 className="text-xs leading-4 font-medium text-gray-900">
                      Total: KES. {totalPrice.toFixed(2)}
                    </h3>
                    <h3 className="text-xs leading-4 font-medium text-gray-900">
                      Total Runs: {filteredRequests.length}
                    </h3>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Download />}
                      onClick={handleExportToPDF}
                      disabled={isExporting || filteredRequests.length === 0}
                      sx={{
                        backgroundColor: '#dc2626',
                        fontSize: '0.75rem',
                        padding: '4px 12px',
                        '&:hover': {
                          backgroundColor: '#b91c1c',
                        },
                        '& .MuiButton-startIcon': {
                          marginRight: '4px',
                          '& svg': {
                            fontSize: '0.875rem'
                          }
                        }
                      }}
                    >
                      {isExporting ? 'Exporting...' : 'Export to PDF'}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <TextField
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true, style: { fontSize: '0.75rem' } }}
                    size="small"
                    fullWidth
                    sx={{
                      '& .MuiInputBase-input': {
                        fontSize: '0.75rem',
                        padding: '6px 12px'
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '0.75rem'
                      }
                    }}
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true, style: { fontSize: '0.75rem' } }}
                    size="small"
                    fullWidth
                    sx={{
                      '& .MuiInputBase-input': {
                        fontSize: '0.75rem',
                        padding: '6px 12px'
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '0.75rem'
                      }
                    }}
                  />
                  <FormControl size="small" fullWidth>
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Client</InputLabel>
                    <Select
                      value={selectedClient}
                      label="Client"
                      onChange={(e) => setSelectedClient(e.target.value)}
                      sx={{
                        fontSize: '0.75rem',
                        '& .MuiSelect-select': {
                          padding: '6px 12px',
                          fontSize: '0.75rem'
                        }
                      }}
                    >
                      <MenuItem value="" sx={{ fontSize: '0.75rem' }}>All Clients</MenuItem>
                      {uniqueClients.map((client) => (
                        <MenuItem key={client} value={client} sx={{ fontSize: '0.75rem' }}>
                          {client}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth>
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Branch</InputLabel>
                    <Select
                      value={selectedBranch}
                      label="Branch"
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      sx={{
                        fontSize: '0.75rem',
                        '& .MuiSelect-select': {
                          padding: '6px 12px',
                          fontSize: '0.75rem'
                        }
                      }}
                    >
                      <MenuItem value="" sx={{ fontSize: '0.75rem' }}>All Branches</MenuItem>
                      {uniqueBranches.map((branch) => (
                        <MenuItem key={branch} value={branch} sx={{ fontSize: '0.75rem' }}>
                          {branch}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              </div>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Location
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Charges
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Pickup Date
                  </th>
                  <th scope="col" className="relative px-3 py-2">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-2 text-center text-[11px] text-gray-500">
                      No requests found
                    </td>
                  </tr>
                ) : (
                  <>
                    {paginatedRequests.map((request) => (
                      <TableRow key={request.id} sx={{ '& td': { padding: '6px 12px', fontSize: '0.6875rem' } }}>
                        <TableCell>{request.clientName}</TableCell>
                        <TableCell>{request.branchName}</TableCell>
                        <TableCell>{request.deliveryLocation}</TableCell>
                        <TableCell>{Number(request.price || 0).toFixed(2)}</TableCell>
                        <TableCell>{new Date(request.pickupDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleRequestClick(request.id)}
                            title="View Details"
                            sx={{ padding: '3px', '& svg': { fontSize: '0.75rem' } }}
                          >
                            <Visibility />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {filteredRequests.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-700">Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-xs text-gray-700">entries</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length} entries
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page, and pages around current
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      // Add ellipsis if there's a gap
                      const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore && (
                            <span className="px-1 text-xs text-gray-500">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-2 py-1 text-xs border rounded ${
                              currentPage === page
                                ? 'bg-red-600 text-white border-red-600'
                                : 'border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestsTable; 