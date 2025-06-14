import React, { useState, useEffect } from 'react';
import { SosData, sosService } from '../../services/sosService';
import { TableCell, TableRow, Chip, IconButton } from '@mui/material';
import { MapPin } from 'lucide-react';
import LocationModal from '../Requests/LocationModal';

const SosList: React.FC = () => {
  const [sosList, setSosList] = useState<SosData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSos, setSelectedSos] = useState<SosData | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const fetchSosList = async () => {
    try {
      const data = await sosService.getSosList();
      setSosList(data);
    } catch (error) {
      console.error('Error fetching SOS list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSosList();
  }, []);

  const handleViewLocation = (sos: SosData) => {
    setSelectedSos(sos);
    setIsLocationModalOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              SOS Alerts
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SOS Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guard Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sosList.map((sos) => (
                  <TableRow key={sos.id}>
                    <TableCell>
                      <Chip
                        label={sos.sos_type}
                        color={sos.sos_type === 'emergency' ? 'error' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{sos.guard_name}</TableCell>
                    <TableCell>
                      {new Date(sos.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewLocation(sos)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <MapPin className="h-5 w-5" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default SosList; 