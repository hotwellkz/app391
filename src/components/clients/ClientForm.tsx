import React, { useState } from 'react';
import { NewClient } from '../../types/client';
import { RotateCcw } from 'lucide-react';
import { serverTimestamp } from 'firebase/firestore';
import { Toast } from '../ui/Toast';

interface ClientFormProps {
  client: NewClient;
  onChange: (updates: Partial<NewClient>) => void;
  yearOptions?: number[];
  isEditMode?: boolean;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onChange,
  yearOptions = [new Date().getFullYear()],
  isEditMode = false
}) => {
  const inputClassName = "mt-1 block w-full px-4 py-3 text-lg rounded-xl border-0 bg-gray-50 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-emerald-600 transition-all duration-200";
  const labelClassName = "block text-sm font-medium text-gray-700 mb-1";
  const selectClassName = "mt-1 block w-full px-4 py-3 text-lg rounded-xl border-0 bg-gray-50 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 transition-all duration-200";

  // Функция для форматирования числа с пробелами
  const formatNumber = (value: number | undefined): string => {
    if (value === undefined) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Функция для преобразования отформатированного числа обратно в число
  const parseFormattedNumber = (value: string): number => {
    return parseInt(value.replace(/\s/g, '')) || 0;
  };

  const handleNumberChange = (field: keyof NewClient) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\s/g, ''); // Удаляем пробелы
    const numericValue = rawValue.replace(/[^\d]/g, ''); // Оставляем только цифры
    const number = parseInt(numericValue) || 0;
    onChange({ [field]: number });
  };

  const [showToast, setShowToast] = useState(false);

  const handleResetDays = () => {
    onChange({ createdAt: serverTimestamp() });
    setShowToast(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Номер клиента */}
        <div>
          <label htmlFor="clientNumber" className={labelClassName}>
            Номер клиента
          </label>
          <input
            type="text"
            id="clientNumber"
            value={client.clientNumber}
            onChange={(e) => onChange({ clientNumber: e.target.value })}
            className={inputClassName}
            placeholder="Номер клиента"
            disabled={!isEditMode}
          />
        </div>

        {/* Фамилия */}
        <div>
          <label htmlFor="lastName" className={labelClassName}>
            Фамилия
          </label>
          <input
            type="text"
            id="lastName"
            value={client.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            className={inputClassName}
            placeholder="Фамилия"
          />
        </div>

        {/* Имя */}
        <div>
          <label htmlFor="firstName" className={labelClassName}>
            Имя *
          </label>
          <input
            type="text"
            id="firstName"
            value={client.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            className={inputClassName}
            placeholder="Имя *"
            required
          />
        </div>

        {/* Отчество */}
        <div>
          <label htmlFor="middleName" className={labelClassName}>
            Отчество
          </label>
          <input
            type="text"
            id="middleName"
            value={client.middleName}
            onChange={(e) => onChange({ middleName: e.target.value })}
            className={inputClassName}
            placeholder="Отчество"
          />
        </div>

        {/* ИИН */}
        <div>
          <label htmlFor="iin" className={labelClassName}>
            ИИН
          </label>
          <input
            type="text"
            id="iin"
            value={client.iin}
            onChange={(e) => onChange({ iin: e.target.value })}
            className={inputClassName}
            placeholder="ИИН"
          />
        </div>

        {/* Телефон */}
        <div>
          <label htmlFor="phone" className={labelClassName}>
            Телефон
          </label>
          <input
            type="tel"
            id="phone"
            value={client.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            className={inputClassName}
            placeholder="Телефон"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className={labelClassName}>
            Email
          </label>
          <input
            type="text"
            id="email"
            value={client.email}
            onChange={(e) => onChange({ email: e.target.value })}
            className={inputClassName}
            placeholder="Email"
          />
        </div>

        {/* Адрес строительства */}
        <div>
          <label htmlFor="constructionAddress" className={labelClassName}>
            Адрес строительства
          </label>
          <input
            type="text"
            id="constructionAddress"
            value={client.constructionAddress}
            onChange={(e) => onChange({ constructionAddress: e.target.value })}
            className={inputClassName}
            placeholder="Адрес строительства"
          />
        </div>

        {/* Адрес прописки */}
        <div>
          <label htmlFor="livingAddress" className={labelClassName}>
            Адрес прописки
          </label>
          <input
            type="text"
            id="livingAddress"
            value={client.livingAddress}
            onChange={(e) => onChange({ livingAddress: e.target.value })}
            className={inputClassName}
            placeholder="Адрес прописки"
          />
        </div>

        {/* Название объекта */}
        <div>
          <label htmlFor="objectName" className={labelClassName}>
            Название объекта *
          </label>
          <input
            type="text"
            id="objectName"
            value={client.objectName}
            onChange={(e) => onChange({ objectName: e.target.value })}
            className={inputClassName}
            placeholder="Название объекта *"
            required
            maxLength={10}
          />
        </div>

        {/* Количество дней строительства */}
        <div>
          <label htmlFor="constructionDays" className={labelClassName}>
            Количество дней строительства
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              id="constructionDays"
              value={formatNumber(client.constructionDays)}
              onChange={handleNumberChange('constructionDays')}
              className={inputClassName}
              placeholder="Количество дней строительства"
            />
            {isEditMode && (
              <button
                type="button"
                onClick={handleResetDays}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Сбросить пройденные дни"
              >
                <RotateCcw className="w-5 h-5 text-gray-500 hover:text-emerald-500" />
              </button>
            )}
          </div>
        </div>

        {/* Общая сумма строительства */}
        <div>
          <label htmlFor="totalAmount" className={labelClassName}>
            Общая сумма строительства
          </label>
          <input
            type="text"
            id="totalAmount"
            value={formatNumber(client.totalAmount)}
            onChange={handleNumberChange('totalAmount')}
            className={inputClassName}
            placeholder="Общая сумма строительства"
          />
        </div>

        {/* Статус */}
        <div>
          <label htmlFor="status" className={labelClassName}>
            Статус *
          </label>
          <select
            id="status"
            value={client.status}
            onChange={(e) => onChange({ status: e.target.value as 'building' | 'deposit' | 'built' })}
            className={selectClassName}
            required
          >
            <option value="" disabled>Выберите статус *</option>
            <option value="deposit">Задаток</option>
            <option value="building">Строится</option>
            <option value="built">Построен</option>
          </select>
        </div>
      </div>

      {/* Секция платежей */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Платежи</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Задаток */}
          <div>
            <label htmlFor="deposit" className={labelClassName}>
              Задаток
            </label>
            <input
              type="text"
              id="deposit"
              value={formatNumber(client.deposit)}
              onChange={handleNumberChange('deposit')}
              className={inputClassName}
              placeholder="Задаток"
            />
          </div>

          {/* Первый транш */}
          <div>
            <label htmlFor="firstPayment" className={labelClassName}>
              Первый транш
            </label>
            <input
              type="text"
              id="firstPayment"
              value={formatNumber(client.firstPayment)}
              onChange={handleNumberChange('firstPayment')}
              className={inputClassName}
              placeholder="Первый транш"
            />
          </div>

          {/* Второй транш */}
          <div>
            <label htmlFor="secondPayment" className={labelClassName}>
              Второй транш
            </label>
            <input
              type="text"
              id="secondPayment"
              value={formatNumber(client.secondPayment)}
              onChange={handleNumberChange('secondPayment')}
              className={inputClassName}
              placeholder="Второй транш"
            />
          </div>

          {/* Третий транш */}
          <div>
            <label htmlFor="thirdPayment" className={labelClassName}>
              Третий транш
            </label>
            <input
              type="text"
              id="thirdPayment"
              value={formatNumber(client.thirdPayment)}
              onChange={handleNumberChange('thirdPayment')}
              className={inputClassName}
              placeholder="Третий транш"
            />
          </div>

          {/* Четвертый транш */}
          <div>
            <label htmlFor="fourthPayment" className={labelClassName}>
              Четвертый транш
            </label>
            <input
              type="text"
              id="fourthPayment"
              value={formatNumber(client.fourthPayment)}
              onChange={handleNumberChange('fourthPayment')}
              className={inputClassName}
              placeholder="Четвертый транш"
            />
          </div>
        </div>
      </div>
      {showToast && (
        <Toast
          message="Пройденное количество дней с момента создания клиента сброшено"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};