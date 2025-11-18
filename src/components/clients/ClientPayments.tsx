import React from 'react';
import { Client } from '../../types/client';

interface ClientPaymentsProps {
  formData: Client;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ClientPayments: React.FC<ClientPaymentsProps> = ({
  formData,
  isEditing,
  onChange
}) => {
  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Задаток
        </label>
        <input
          type="number"
          name="deposit"
          value={formData.deposit}
          onChange={onChange}
          disabled={!isEditing}
          className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Первый транш
        </label>
        <input
          type="number"
          name="firstPayment"
          value={formData.firstPayment}
          onChange={onChange}
          disabled={!isEditing}
          className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Второй транш
        </label>
        <input
          type="number"
          name="secondPayment"
          value={formData.secondPayment}
          onChange={onChange}
          disabled={!isEditing}
          className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Третий транш
        </label>
        <input
          type="number"
          name="thirdPayment"
          value={formData.thirdPayment}
          onChange={onChange}
          disabled={!isEditing}
          className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Четвертый транш
        </label>
        <input
          type="number"
          name="fourthPayment"
          value={formData.fourthPayment}
          onChange={onChange}
          disabled={!isEditing}
          className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50"
        />
      </div>
    </div>
  );
};