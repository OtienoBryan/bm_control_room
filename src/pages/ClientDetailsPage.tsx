import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService, Client } from '../services/clientService';
import { Branch, getBranches, deleteBranch } from '../services/branchService';
import serviceChargeService, { ServiceCharge } from '../services/serviceChargeService';
import { 
  Building2, 
  Plus, 
  Pencil, 
  Trash2, 
  Truck, 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Hash, 
  Calendar,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import BranchModal from '../components/Clients/BranchModal';
import ServiceChargeModal from '../components/Clients/ServiceChargeModal';

const ClientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [serviceCharges, setServiceCharges] = useState<ServiceCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isServiceChargeModalOpen, setIsServiceChargeModalOpen] = useState(false);
  const [editingServiceCharge, setEditingServiceCharge] = useState<ServiceCharge | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'branches' | 'service-charges'>('overview');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [clientData, branchesData, serviceChargesData] = await Promise.all([
        clientService.getClient(Number(id)),
        getBranches(id),
        serviceChargeService.getServiceCharges(Number(id))
      ]);
      setClient(clientData);
      setBranches(branchesData);
      setServiceCharges(serviceChargesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddBranch = () => {
    setSelectedBranch(null);
    setIsBranchModalOpen(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsBranchModalOpen(true);
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (window.confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      try {
        await deleteBranch(id, branchId);
        setBranches(branches.filter(b => b.id !== branchId));
      } catch (err: any) {
        setError(err.message || 'Failed to delete branch');
      }
    }
  };

  const handleAddServiceCharge = () => {
    setEditingServiceCharge(null);
    setIsServiceChargeModalOpen(true);
  };

  const handleEditServiceCharge = (charge: ServiceCharge) => {
    setEditingServiceCharge(charge);
    setIsServiceChargeModalOpen(true);
  };

  const handleDeleteServiceCharge = async (chargeId: number) => {
    if (window.confirm('Are you sure you want to delete this service charge? This action cannot be undone.')) {
      try {
        await serviceChargeService.deleteServiceCharge(Number(id), chargeId);
        setServiceCharges(serviceCharges.filter(charge => charge.id !== chargeId));
      } catch (error) {
        console.error('Error deleting service charge:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center text-red-600">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg font-semibold">Error Loading Client</p>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/dashboard/clients')}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-semibold text-gray-900">Client not found</p>
          <p className="mt-2 text-gray-600">The client you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/dashboard/clients')}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  const totalServiceCharges = serviceCharges.length;
  const totalBranches = branches.length;
  const clientAge = Math.floor((Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard/clients')}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Clients
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                <p className="mt-1 text-sm text-gray-500">Client Details & Management</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Overview Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <Hash className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Account Number</dt>
                    <dd className="text-lg font-medium text-gray-900 font-mono">{client.account_number}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Branches</dt>
                    <dd className="text-lg font-medium text-gray-900">{totalBranches}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Service Charges</dt>
                    <dd className="text-lg font-medium text-gray-900">{totalServiceCharges}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Client Since</dt>
                    <dd className="text-lg font-medium text-gray-900">{clientAge}d ago</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Information Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Client Information</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-500">Company Name</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Hash className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 font-mono">{client.account_number}</p>
                    <p className="text-sm text-gray-500">Account Number</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{client.email}</p>
                    <p className="text-sm text-gray-500">Email Address</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {client.phone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{client.phone}</p>
                      <p className="text-sm text-gray-500">Phone Number</p>
                    </div>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{client.address}</p>
                      <p className="text-sm text-gray-500">Address</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(client.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">Created Date</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('branches')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'branches'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Branches ({totalBranches})
              </button>
              <button
                onClick={() => setActiveTab('service-charges')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'service-charges'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Service Charges ({totalServiceCharges})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Actions */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setActiveTab('branches')}
                        className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-red-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center">
                          <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-sm font-medium text-gray-900">Manage Branches</span>
                        </div>
                        <span className="text-sm text-gray-500">{totalBranches} branches</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('service-charges')}
                        className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-red-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center">
                          <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-sm font-medium text-gray-900">Manage Service Charges</span>
                        </div>
                        <span className="text-sm text-gray-500">{totalServiceCharges} charges</span>
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/clients/${id}/service-requests`)}
                        className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-red-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center">
                          <Truck className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-sm font-medium text-gray-900">View Service Requests</span>
                        </div>
                        <span className="text-sm text-gray-500">View all</span>
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                        <span>Client account created</span>
                        <span className="ml-auto text-gray-400">
                          {new Date(client.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {branches.length > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                          <span>{branches.length} branch(es) added</span>
                        </div>
                      )}
                      {serviceCharges.length > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                          <span>{serviceCharges.length} service charge(s) configured</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'branches' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Client Branches</h3>
                  <button
                    onClick={handleAddBranch}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Branch
                  </button>
                </div>
                
                {branches.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No branches</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by adding your first branch.</p>
                    <div className="mt-6">
                      <button
                        onClick={handleAddBranch}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Branch
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {branches.map(branch => (
                      <div key={branch.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">{branch.name}</h4>
                            <p className="text-sm text-gray-500 flex items-start">
                              <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{branch.address}</span>
                            </p>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleEditBranch(branch)}
                              className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                              title="Edit branch"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBranch(branch.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1"
                              title="Delete branch"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'service-charges' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Service Charges</h3>
                  <button
                    onClick={handleAddServiceCharge}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service Charge
                  </button>
                </div>
                
                {serviceCharges.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No service charges</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by adding your first service charge.</p>
                    <div className="mt-6">
                      <button
                        onClick={handleAddServiceCharge}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Service Charge
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Service Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {serviceCharges.map((charge) => (
                          <tr key={charge.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{charge.service_type_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-mono">
                                ${Number(charge.price).toFixed(2)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(charge.created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handleEditServiceCharge(charge)}
                                  className="text-blue-600 hover:text-blue-900 transition-colors"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteServiceCharge(charge.id)}
                                  className="text-red-600 hover:text-red-900 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Branch Modal */}
      {isBranchModalOpen && (
        <BranchModal
          isOpen={isBranchModalOpen}
          onClose={() => setIsBranchModalOpen(false)}
          clientId={Number(id)}
          branch={selectedBranch}
          onSuccess={(branch) => {
            if (selectedBranch) {
              setBranches(branches.map(b => b.id === branch.id ? branch : b));
            } else {
              setBranches([...branches, branch]);
            }
            setIsBranchModalOpen(false);
          }}
        />
      )}

      {/* Service Charge Modal */}
      <ServiceChargeModal
        isOpen={isServiceChargeModalOpen}
        onClose={() => setIsServiceChargeModalOpen(false)}
        clientId={Number(id)}
        editingCharge={editingServiceCharge}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default ClientDetailsPage; 