import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon } from 'lucide-react';
import { RequestData } from '../../services/requestService';
import { TableCell, TableRow, Chip, IconButton, TextField, MenuItem, Select, FormControl, InputLabel, Button } from '@mui/material';
import { Visibility, Download } from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface RequestsTableProps {
  requests: RequestData[];
  onRequestClick?: (requestId: number) => void;
}

const RequestsTable: React.FC<RequestsTableProps> = ({ requests, onRequestClick }) => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
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

  // Calculate total price for filtered requests
  const totalPrice = filteredRequests.reduce((sum, request) => {
    const price = Number(request.price) || 0;
    return sum + price;
  }, 0);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div ref={tableRef} className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Total: KES. {totalPrice.toFixed(2)}
                    </h3>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Total Runs: {filteredRequests.length}
                    </h3>
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Download />}
                      onClick={handleExportToPDF}
                      disabled={isExporting || filteredRequests.length === 0}
                      sx={{
                        backgroundColor: '#dc2626',
                        '&:hover': {
                          backgroundColor: '#b91c1c',
                        },
                      }}
                    >
                      {isExporting ? 'Exporting...' : 'Export to PDF'}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <TextField
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    fullWidth
                  />
                  <FormControl size="small" fullWidth>
                    <InputLabel>Client</InputLabel>
                    <Select
                      value={selectedClient}
                      label="Client"
                      onChange={(e) => setSelectedClient(e.target.value)}
                    >
                      <MenuItem value="">All Clients</MenuItem>
                      {uniqueClients.map((client) => (
                        <MenuItem key={client} value={client}>
                          {client}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Branch</InputLabel>
                    <Select
                      value={selectedBranch}
                      label="Branch"
                      onChange={(e) => setSelectedBranch(e.target.value)}
                    >
                      <MenuItem value="">All Branches</MenuItem>
                      {uniqueBranches.map((branch) => (
                        <MenuItem key={branch} value={branch}>
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Charges
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pickup Date
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No requests found
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestsTable; 