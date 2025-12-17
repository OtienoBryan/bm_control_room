import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XIcon, 
  Building2Icon, 
  PackageIcon, 
  MapPinIcon, 
  CalendarIcon, 
  ClockIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  LoaderIcon
} from 'lucide-react';
import { requestService } from '../../services/requestService';
import { ServiceType, serviceTypeService } from '../../services/serviceTypeService';
import { useAuth } from '../../contexts/AuthContext';
import { Branch, getAllBranches } from '../../services/branchService';
import { ServiceCharge } from '../../services/serviceChargeService';
import serviceChargeService from '../../services/serviceChargeService';

interface RequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface RequestFormData {
  branchId: string;
  serviceTypeId: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  clientName?: string;
  manualCharge?: string;
}

interface CreateRequestPayload {
  userId: number;
  userName: string;
  serviceTypeId: number;
  pickupLocation: string;
  deliveryLocation: string;
  pickupDate: string;
  priority: string;
  status: number;
  myStatus: number;
  branchId: number;
  price: number;
  clientName?: string;
}

const RequestFormModal: React.FC<RequestFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<RequestFormData>({
    branchId: '',
    serviceTypeId: '',
    pickupLocation: '',
    dropoffLocation: '',
    pickupDate: '',
    pickupTime: '',
    clientName: '',
    manualCharge: ''
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [serviceCharges, setServiceCharges] = useState<ServiceCharge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedServiceCharge, setSelectedServiceCharge] = useState<ServiceCharge | null>(null);
  const [isAdhoc, setIsAdhoc] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [branchesData, serviceTypesData] = await Promise.all([
          getAllBranches(),
          serviceTypeService.getServiceTypes()
        ]);
        setBranches(branchesData);
        setServiceTypes(serviceTypesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchServiceCharges = async () => {
      if (!formData.branchId || formData.branchId === 'adhoc') {
        setServiceCharges([]);
        setSelectedServiceCharge(null);
        setIsAdhoc(formData.branchId === 'adhoc');
        return;
      }

      try {
        const selectedBranch = branches.find(b => b.id.toString() === formData.branchId);
        if (!selectedBranch?.client_id) {
          setError('Selected branch has no associated client');
          return;
        }

        const charges = await serviceChargeService.getServiceCharges(selectedBranch.client_id);
        setServiceCharges(charges);
        setSelectedServiceCharge(null);
        setFormData(prev => ({ ...prev, serviceTypeId: '' }));
        setIsAdhoc(false);
      } catch (error) {
        console.error('Error fetching service charges:', error);
        setError('Failed to load service charges');
      }
    };

    fetchServiceCharges();
  }, [formData.branchId, branches]);

  useEffect(() => {
    if (formData.serviceTypeId) {
      const charge = serviceCharges.find(sc => sc.service_type_id.toString() === formData.serviceTypeId);
      setSelectedServiceCharge(charge || null);
    }
  }, [formData.serviceTypeId, serviceCharges]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!user?.id || !user?.username) {
        throw new Error('User information is required');
      }

      let branchId: number;
      let price: number;

      if (isAdhoc) {
        if (!formData.clientName || !formData.manualCharge || !formData.serviceTypeId) {
          throw new Error('Client name, service type, and manual charge are required for Adhoc requests');
        }
        branchId = 0; // Special ID for Adhoc requests
        price = parseFloat(formData.manualCharge);
      } else {
        const selectedBranch = branches.find(b => b.id.toString() === formData.branchId);
        if (!selectedBranch?.client_id) {
          throw new Error('Selected branch has no associated client');
        }

        if (!selectedServiceCharge) {
          throw new Error('No service charge found for selected service type');
        }

        branchId = parseInt(formData.branchId);
        price = selectedServiceCharge.price;
      }

      console.log('Branch ID and type:', { branchId, type: typeof branchId, isAdhoc });

      const requestData: CreateRequestPayload = {
        userId: user.id,
        userName: user.username,
        serviceTypeId: parseInt(formData.serviceTypeId), // Use selected service type for both regular and Adhoc
        pickupLocation: formData.pickupLocation,
        deliveryLocation: formData.dropoffLocation,
        pickupDate: `${formData.pickupDate}T${formData.pickupTime}`,
        priority: 'medium',
        status: 0,
        myStatus: 0,
        branchId: branchId,
        price: price,
        clientName: isAdhoc ? formData.clientName : undefined
      };

      console.log('Submitting request data:', {
        isAdhoc,
        formData,
        requestData,
        user: { id: user.id, username: user.username }
      });

      await requestService.createRequest(requestData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      branchId: '',
      serviceTypeId: '',
      pickupLocation: '',
      dropoffLocation: '',
      pickupDate: '',
      pickupTime: '',
      clientName: '',
      manualCharge: ''
    });
    setSelectedServiceCharge(null);
    setIsAdhoc(false);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                                 {/* Header */}
                 <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-5 py-3">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                       <div className="p-1.5 bg-white bg-opacity-20 rounded-lg">
                         <PackageIcon className="h-5 w-5 text-white" />
                       </div>
                       <div>
                         <Dialog.Title className="text-base font-semibold text-white">
                           Create New Service Request
                         </Dialog.Title>
                         <p className="text-blue-100 text-xs">
                           Fill in the details below to create your request
                         </p>
                       </div>
                     </div>
                    <button
                      onClick={handleClose}
                      className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-5 py-4">
                                     {isLoading ? (
                     <div className="flex items-center justify-center py-8">
                       <LoaderIcon className="h-8 w-8 text-blue-600 animate-spin" />
                       <span className="ml-2 text-sm text-gray-600">Loading form data...</span>
                     </div>
                   ) : (
                    <>
                      {error && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center">
                            <AlertCircleIcon className="h-4 w-4 text-red-600 mr-2" />
                            <span className="text-sm text-red-800 font-medium">{error}</span>
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className="space-y-3">
                                                 {/* Branch Selection */}
                         <div className="bg-gray-50 p-3 rounded-lg">
                           <label className="flex items-center text-xs font-semibold text-gray-700 mb-1.5">
                             <Building2Icon className="h-4 w-4 mr-1.5 text-blue-600" />
                             Select Branch
                           </label>
                          <select
                            value={formData.branchId}
                            onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            required
                          >
                            <option value="">Choose a branch</option>
                            <option value="adhoc">Adhoc Request</option>
                            {branches.map((branch) => (
                              <option key={branch.id} value={branch.id}>
                                {branch.name}
                              </option>
                            ))}
                          </select>
                        </div>

                                                 {/* Service Type Selection */}
                         <div className="bg-gray-50 p-3 rounded-lg">
                           <label className="flex items-center text-xs font-semibold text-gray-700 mb-1.5">
                             <PackageIcon className="h-4 w-4 mr-1.5 text-blue-600" />
                             Service Type & Pricing
                           </label>
                          <select
                            value={formData.serviceTypeId}
                            onChange={(e) => setFormData({ ...formData, serviceTypeId: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            required
                            disabled={!formData.branchId}
                          >
                            <option value="">
                              {formData.branchId ? 'Choose a service type' : 'Select a branch first'}
                            </option>
                            {isAdhoc ? (
                              serviceTypes.map((serviceType) => (
                                <option key={serviceType.id} value={serviceType.id}>
                                  {serviceType.name}
                                </option>
                              ))
                            ) : (
                              serviceCharges.map((charge) => (
                                <option key={charge.service_type_id} value={charge.service_type_id}>
                                  {charge.service_type_name} - {charge.price}
                                </option>
                              ))
                            )}
                          </select>
                          
                                                     {!isAdhoc && selectedServiceCharge && (
                             <div className="mt-1.5 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                               <div className="flex items-center justify-between">
                                 <span className="text-xs text-blue-800">
                                   Service: <span className="font-semibold">{selectedServiceCharge.service_type_name}</span>
                                 </span>
                                 <span className="text-base font-bold text-blue-700">
                                   {selectedServiceCharge.price}
                                 </span>
                               </div>
                             </div>
                           )}
                           
                           {isAdhoc && formData.serviceTypeId && (
                             <div className="mt-1.5 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                               <div className="flex items-center justify-between">
                                 <span className="text-xs text-blue-800">
                                   Service: <span className="font-semibold">
                                     {serviceTypes.find(st => st.id.toString() === formData.serviceTypeId)?.name}
                                   </span>
                                 </span>
                                 <span className="text-base font-bold text-blue-700">
                                   Manual Charge: {formData.manualCharge}
                                 </span>
                               </div>
                             </div>
                           )}
                        </div>

                        {/* Adhoc Fields */}
                        {isAdhoc && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <label className="flex items-center text-xs font-semibold text-gray-700 mb-1.5">
                                <Building2Icon className="h-4 w-4 mr-1.5 text-blue-600" />
                                Client Name
                              </label>
                              <input
                                type="text"
                                value={formData.clientName || ''}
                                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Enter client name"
                                required={isAdhoc}
                              />
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                              <label className="flex items-center text-xs font-semibold text-gray-700 mb-1.5">
                                <PackageIcon className="h-4 w-4 mr-1.5 text-blue-600" />
                                Manual Charge
                              </label>
                              <input
                                type="number"
                                value={formData.manualCharge || ''}
                                onChange={(e) => setFormData({ ...formData, manualCharge: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Enter charge amount"
                                min="0"
                                step="0.01"
                                required={isAdhoc}
                              />
                            </div>
                          </div>
                        )}

                        {/* Location Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                     <div className="bg-gray-50 p-3 rounded-lg">
                             <label className="flex items-center text-xs font-semibold text-gray-700 mb-1.5">
                               <MapPinIcon className="h-4 w-4 mr-1.5 text-blue-600" />
                               Pickup Location
                             </label>
                                                         <input
                               type="text"
                               value={formData.pickupLocation}
                               onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                               className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                               placeholder="Enter pickup address"
                               required
                             />
                          </div>

                                                     <div className="bg-gray-50 p-3 rounded-lg">
                             <label className="flex items-center text-xs font-semibold text-gray-700 mb-1.5">
                               <MapPinIcon className="h-4 w-4 mr-1.5 text-blue-600" />
                               Delivery Location
                             </label>
                                                         <input
                               type="text"
                               value={formData.dropoffLocation}
                               onChange={(e) => setFormData({ ...formData, dropoffLocation: e.target.value })}
                               className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                               placeholder="Enter delivery address"
                               required
                             />
                          </div>
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                     <div className="bg-gray-50 p-3 rounded-lg">
                             <label className="flex items-center text-xs font-semibold text-gray-700 mb-1.5">
                               <CalendarIcon className="h-4 w-4 mr-1.5 text-blue-600" />
                               Pickup Date
                             </label>
                                                         <input
                               type="date"
                               value={formData.pickupDate}
                               onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                               className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                               min={getMinDate()}
                               required
                             />
                          </div>

                                                     <div className="bg-gray-50 p-3 rounded-lg">
                             <label className="flex items-center text-xs font-semibold text-gray-700 mb-1.5">
                               <ClockIcon className="h-4 w-4 mr-1.5 text-blue-600" />
                               Pickup Time
                             </label>
                                                         <input
                               type="time"
                               value={formData.pickupTime}
                               onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                               className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                               required
                             />
                          </div>
                        </div>

                        {/* Summary */}
                        {((selectedServiceCharge && !isAdhoc) || (isAdhoc && formData.clientName && formData.manualCharge && formData.serviceTypeId)) && formData.pickupDate && formData.pickupTime && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-blue-900 mb-1.5 flex items-center">
                              <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                              Request Summary
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div>
                                <span className="text-blue-700 font-medium">Service:</span>
                                <p className="text-blue-900">
                                  {isAdhoc 
                                    ? serviceTypes.find(st => st.id.toString() === formData.serviceTypeId)?.name
                                    : selectedServiceCharge?.service_type_name
                                  }
                                </p>
                              </div>
                              {isAdhoc && (
                                <div>
                                  <span className="text-blue-700 font-medium">Client:</span>
                                  <p className="text-blue-900">{formData.clientName}</p>
                                </div>
                              )}
                              <div>
                                <span className="text-blue-700 font-medium">Price:</span>
                                <p className="text-blue-900 font-semibold">
                                  {isAdhoc ? formData.manualCharge : selectedServiceCharge?.price}
                                </p>
                              </div>
                              <div>
                                <span className="text-blue-700 font-medium">Date:</span>
                                <p className="text-blue-900">{new Date(formData.pickupDate).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <span className="text-blue-700 font-medium">Time:</span>
                                <p className="text-blue-900">{formData.pickupTime}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting || !formData.branchId || !formData.serviceTypeId || (isAdhoc && (!formData.clientName || !formData.manualCharge))}
                            className="flex-1 px-4 py-2 text-sm text-white bg-red-900 hover:bg-red-700 disabled:bg-gray-400 rounded-lg transition-colors font-medium flex items-center justify-center"
                          >
                            {isSubmitting ? (
                              <>
                                <LoaderIcon className="h-4 w-4 mr-1.5 animate-spin" />
                                Creating Request...
                              </>
                            ) : (
                              <>
                                <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                                Create Request
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default RequestFormModal; 