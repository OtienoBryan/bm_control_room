import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientService, Client } from '../../services/clientService';
import { Eye, Building2 } from 'lucide-react';

const ClientsTable: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        console.log('Fetching clients...');
        const data = await clientService.getClients();
        console.log('Clients data received:', data);
        setClients(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching clients:', err);
        setError(err.message || 'Failed to fetch clients');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-xs text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center text-red-600">
          <p className="text-sm font-semibold">Error</p>
          <p className="text-xs">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Account Number
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-3 py-2 text-right text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-center text-xs text-gray-500">
                      No clients found
                    </td>
                  </tr>
                ) : (
                  clients.map(client => (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-xs font-medium text-gray-900">
                              {client.name}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {client.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {client.account_number}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {client.phone || 'N/A'}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {client.address || 'No address'}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                        <div className="flex justify-end space-x-1.5">
                          <button
                            onClick={() => navigate(`/dashboard/clients/${client.id}`)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-[11px] font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                          >
                            <Eye className="h-3 w-3 mr-0.5" />
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsTable;