'use client';

import { useState, useEffect } from 'react';
import { BiometricRegistration } from '@/types/biometrics';
import PasswordPrompt from './PasswordPrompt';

interface BiometricRegistrationFormProps {
  sessionId: string;
  registration?: BiometricRegistration | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BiometricRegistrationForm({
  sessionId,
  registration,
  onClose,
  onSuccess
}: BiometricRegistrationFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dateOfBirth: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingData, setPendingData] = useState<Omit<BiometricRegistration, 'id'> | null>(null);

  useEffect(() => {
    if (registration) {
      setFormData({
        firstName: registration.firstName,
        lastName: registration.lastName,
        phone: registration.phone,
        email: registration.email,
        dateOfBirth: registration.dateOfBirth
      });
    }
  }, [registration]);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const formatDateOfBirth = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let formattedValue = value;
    if (name === 'phone') {
      formattedValue = formatPhoneNumber(value);
    } else if (name === 'dateOfBirth') {
      formattedValue = formatDateOfBirth(value);
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    const phoneNumbers = formData.phone.replace(/\D/g, '');
    if (!phoneNumbers) {
      newErrors.phone = 'Phone number is required';
    } else if (phoneNumbers.length !== 10) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    const dobNumbers = formData.dateOfBirth.replace(/\D/g, '');
    if (!dobNumbers) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else if (dobNumbers.length !== 8) {
      newErrors.dateOfBirth = 'Date must be in MM/DD/YYYY format';
    } else {
      const month = parseInt(dobNumbers.slice(0, 2));
      const day = parseInt(dobNumbers.slice(2, 4));
      const year = parseInt(dobNumbers.slice(4, 8));

      if (month < 1 || month > 12) {
        newErrors.dateOfBirth = 'Invalid month';
      } else if (day < 1 || day > 31) {
        newErrors.dateOfBirth = 'Invalid day';
      } else if (year < 1900 || year > new Date().getFullYear()) {
        newErrors.dateOfBirth = 'Invalid year';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const registrationData: Omit<BiometricRegistration, 'id'> = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone,
      email: formData.email.trim(),
      dateOfBirth: formData.dateOfBirth
    };

    // Always show password prompt (for both new and edit)
    setPendingData(registrationData);
    setShowPasswordPrompt(true);
  };

  const handlePasswordConfirm = async (password: string) => {
    if (!pendingData) return;

    setIsSubmitting(true);

    try {
      let response;

      if (registration) {
        // Update existing registration
        response = await fetch(
          `/api/biometrics/${sessionId}/registrations/${registration.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ...pendingData, password })
          }
        );
      } else {
        // Create new registration
        response = await fetch(
          `/api/biometrics/${sessionId}/registrations`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ...pendingData, password })
          }
        );
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${registration ? 'update' : 'create'} registration`);
      }

      setShowPasswordPrompt(false);
      setPendingData(null);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(`Error ${registration ? 'updating' : 'creating'} registration:`, error);
      setErrors({ submit: error instanceof Error ? error.message : `Failed to ${registration ? 'update' : 'create'} registration` });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-black">
            {registration ? 'Edit Registration' : 'Register for Biometric Exam'}
          </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              disabled={isSubmitting}
            />
            {errors.firstName && (
              <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              disabled={isSubmitting}
            />
            {errors.lastName && (
              <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(555) 555-5555"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth (MM/DD/YYYY) *
            </label>
            <input
              type="text"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              placeholder="MM/DD/YYYY"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              disabled={isSubmitting}
            />
            {errors.dateOfBirth && (
              <p className="text-red-600 text-sm mt-1">{errors.dateOfBirth}</p>
            )}
          </div>

          {errors.submit && (
            <p className="text-red-600 text-sm">{errors.submit}</p>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-black text-[#FFD600] rounded-md hover:bg-gray-900 disabled:opacity-50"
            >
              {isSubmitting ? (registration ? 'Updating...' : 'Registering...') : (registration ? 'Update' : 'Register')}
            </button>
          </div>
        </form>
        </div>
      </div>

      <PasswordPrompt
        isOpen={showPasswordPrompt}
        onConfirm={handlePasswordConfirm}
        onClose={() => {
          setShowPasswordPrompt(false);
          setPendingData(null);
        }}
        title="Admin Password Required"
        message={`Please enter the admin password to ${registration ? 'update' : 'create'} this registration:`}
      />
    </>
  );
}
