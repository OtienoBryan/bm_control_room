import React, { useState, useEffect } from 'react';
import { X, Percent, ToggleLeft, ToggleRight } from 'lucide-react';
import processingFeeService, { ProcessingFee } from '../../services/processingFeeService';

interface ProcessingFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  editingFee?: ProcessingFee | null;
  onSuccess: () => void;
}

const ProcessingFeeModal: React.FC<ProcessingFeeModalProps> = ({
  isOpen,
  onClose,
  clientId,
  editingFee,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingFee) {
      setFormData({
        amount: editingFee.amount.toString(),
        is_active: editingFee.is_active
      });
    } else {
      setFormData({
        amount: '',
        is_active: true
      });
    }
    setError(null);
  }, [editingFee, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const feeData = {
        fee_type: 'Processing Fee',
        description: 'Client processing fee',
        amount: parseFloat(formData.amount),
        is_percentage: true,
        is_active: formData.is_active
      };

      if (editingFee) {
        await processingFeeService.updateProcessingFee(clientId, editingFee.id, feeData);
      } else {
        await processingFeeService.createProcessingFee(clientId, feeData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save processing fee');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingFee ? 'Edit Processing Fee' : 'Add Processing Fee'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}


          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              <Percent className="w-4 h-4 inline mr-2" />
              Processing Fee Percentage *
            </label>
            <div className="relative">
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 text-sm">%</span>
              </div>
            </div>
          </div>


          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                {formData.is_active ? (
                  <ToggleRight className="w-4 h-4 inline mr-1 text-green-600" />
                ) : (
                  <ToggleLeft className="w-4 h-4 inline mr-1 text-gray-400" />
                )}
                Active fee
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : (editingFee ? 'Update Fee' : 'Add Fee')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcessingFeeModal;

