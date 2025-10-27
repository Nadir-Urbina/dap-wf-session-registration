'use client';

import { useState } from 'react';
import { BiometricSession, BiometricRegistration } from '@/types/biometrics';
import BiometricRegistrationForm from './BiometricRegistrationForm';
import PasswordPrompt from './PasswordPrompt';

interface BiometricSessionCardProps {
  session: BiometricSession;
  onUpdate: () => void;
}

export default function BiometricSessionCard({ session, onUpdate }: BiometricSessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<BiometricRegistration | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<string | null>(null);

  const availableSpots = session.maxCapacity - session.registrations.length;
  const isFull = availableSpots === 0;

  const getCapacityColor = () => {
    const percentage = (session.registrations.length / session.maxCapacity) * 100;
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 66) return 'text-orange-500';
    return 'text-green-600';
  };

  const handleEditClick = (registration: BiometricRegistration) => {
    setEditingRegistration(registration);
    setShowForm(true);
  };

  const handleRemoveClick = (registrationId: string) => {
    setRegistrationToDelete(registrationId);
    setShowPasswordPrompt(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRegistration(null);
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!registrationToDelete) return;

    try {
      const response = await fetch(
        `/api/biometrics/${session.id}/registrations/${registrationToDelete}`,
        {
          method: 'DELETE',
          headers: {
            'x-admin-password': password
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove registration');
      }

      setShowPasswordPrompt(false);
      setRegistrationToDelete(null);
      onUpdate();
    } catch (error) {
      console.error('Error removing registration:', error);
      throw error;
    }
  };

  const generateEmailLink = () => {
    const emails = session.registrations.map(r => r.email).join(',');
    return `mailto:${emails}`;
  };

  const copyPhoneNumbers = () => {
    const phones = session.registrations.map(r => r.phone).join('\n');
    navigator.clipboard.writeText(phones);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Session Header */}
        <div
          className="p-4 cursor-pointer active:bg-gray-50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-800">{session.time}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`font-semibold ${getCapacityColor()}`}>
                  {session.registrations.length}/{session.maxCapacity} registered
                </span>
              </div>
            </div>
            <span className="text-gray-400 text-xl">
              {isExpanded ? '▼' : '▶'}
            </span>
          </div>
        </div>

        {isExpanded && (
          <div className="p-4 pt-0 space-y-3">
            {session.registrations.length > 0 && (
              <div className="flex gap-2 mb-4">
                <a
                  href={generateEmailLink()}
                  className="px-3 py-1 bg-black text-[#FFD600] rounded hover:bg-gray-900 text-sm font-medium"
                >
                  Email All
                </a>
                <button
                  onClick={copyPhoneNumbers}
                  className="px-3 py-1 bg-black text-[#FFD600] rounded hover:bg-gray-900 text-sm font-medium"
                >
                  Copy Phone Numbers
                </button>
              </div>
            )}

            {session.registrations.map((registration) => (
              <div
                key={registration.id}
                className="bg-gray-50 p-3 rounded border border-gray-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {registration.firstName} {registration.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{registration.email}</p>
                    <p className="text-sm text-gray-600">{registration.phone}</p>
                    <p className="text-sm text-gray-500">DOB: {registration.dateOfBirth}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(registration)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemoveClick(registration.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {session.registrations.length === 0 && (
              <p className="text-gray-500 text-center py-4">No registrations yet</p>
            )}

            <button
              onClick={() => setShowForm(true)}
              disabled={isFull}
              className={`w-full py-2 rounded font-medium ${
                isFull
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-[#FFD600] hover:bg-gray-900'
              }`}
            >
              {isFull ? 'Session Full' : 'Add Registration'}
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <BiometricRegistrationForm
          sessionId={session.id}
          registration={editingRegistration}
          onClose={handleFormClose}
          onSuccess={() => {
            onUpdate();
            handleFormClose();
          }}
        />
      )}

      <PasswordPrompt
        isOpen={showPasswordPrompt}
        onConfirm={handlePasswordSubmit}
        onClose={() => {
          setShowPasswordPrompt(false);
          setRegistrationToDelete(null);
        }}
        title="Admin Password Required"
        message="Please enter the admin password to remove this registration:"
      />
    </>
  );
}
