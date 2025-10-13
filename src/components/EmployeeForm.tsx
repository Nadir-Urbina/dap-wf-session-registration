'use client';

import { useState, useEffect } from 'react';
import { Employee, Session } from '@/types';

interface EmployeeFormProps {
  employee: Employee | null;
  session: Session | null;
  onSubmit: (employeeData: Omit<Employee, 'id'>) => void;
  onCancel: () => void;
}

export default function EmployeeForm({
  employee,
  session,
  onSubmit,
  onCancel,
}: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    primaryLanguage: 'English' as 'English' | 'Spanish',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showLanguageWarning, setShowLanguageWarning] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        fullName: employee.fullName,
        email: employee.email,
        phone: employee.phone,
        primaryLanguage: employee.primaryLanguage,
      });
    }
  }, [employee]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    } else {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleLanguageChange = (language: 'English' | 'Spanish') => {
    setFormData({ ...formData, primaryLanguage: language });

    // Show warning if Spanish is selected in English-only session
    if (language === 'Spanish' && session && !session.spanishOnly) {
      setShowLanguageWarning(true);
    } else {
      setShowLanguageWarning(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const numbers = formData.phone.replace(/\D/g, '');
      if (numbers.length !== 10) {
        newErrors.phone = 'Phone number must be 10 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
          <h2 className="text-xl font-bold text-gray-800">
            {employee ? 'Edit Employee' : 'Add Employee'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name *
            </label>
            <input
              type="text"
              id="fullName"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FFD600] focus:border-[#FFD600] ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="John Doe"
            />
            {errors.fullName && (
              <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FFD600] focus:border-[#FFD600] ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="john.doe@example.com"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FFD600] focus:border-[#FFD600] ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="(555) 123-4567"
              maxLength={14}
            />
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Primary Language */}
          <div>
            <label
              htmlFor="primaryLanguage"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Primary Language *
            </label>
            <select
              id="primaryLanguage"
              value={formData.primaryLanguage}
              onChange={(e) =>
                handleLanguageChange(e.target.value as 'English' | 'Spanish')
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD600] focus:border-[#FFD600]"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
            </select>

            {/* Warning for Spanish selection in English-only sessions */}
            {showLanguageWarning && (
              <div className="mt-2 p-3 bg-orange-50 border border-orange-300 rounded-lg">
                <p className="text-sm text-orange-800 font-medium">
                  ⚠️ Translation is not available for this session
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Only the last 2 sessions (12:45 PM & 1:15 PM) will have Spanish translation available.
                </p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-black text-[#FFD600] rounded-lg hover:bg-gray-900 active:bg-gray-800 font-medium"
            >
              {employee ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
