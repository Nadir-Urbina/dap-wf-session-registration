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
  const [isRevealed, setIsRevealed] = useState(false);
  const [showRevealPasswordPrompt, setShowRevealPasswordPrompt] = useState(false);

  const availableSpots = session.maxCapacity - session.registrations.length;
  const isFull = availableSpots === 0;

  const maskEmail = (email: string) => {
    const [username, domain] = email.split('@');
    return `${username.slice(0, 2)}${'*'.repeat(username.length - 2)}@${domain}`;
  };

  const maskPhone = (phone: string) => {
    // For format (XXX) XXX-XXXX, mask to (***) ***-XXXX
    return phone.replace(/\d/g, (match, offset, string) => {
      // Keep only the last 4 digits
      const lastFourStart = string.length - 4;
      return offset >= lastFourStart ? match : '*';
    });
  };

  const maskDOB = () => {
    return '**/**/****';
  };

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

  const handleRevealToggle = () => {
    if (isRevealed) {
      setIsRevealed(false);
    } else {
      setShowRevealPasswordPrompt(true);
    }
  };

  const handleRevealPasswordConfirm = async (password: string) => {
    try {
      const response = await fetch('/api/validate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (data.valid) {
        setIsRevealed(true);
        setShowRevealPasswordPrompt(false);
      } else {
        throw new Error('Invalid password');
      }
    } catch (error) {
      console.error('Error validating password:', error);
      throw new Error('Invalid password');
    }
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
              <div className="flex gap-2 mb-4 items-center">
                <button
                  onClick={handleRevealToggle}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium flex items-center gap-2"
                  title={isRevealed ? 'Hide sensitive information' : 'Reveal sensitive information'}
                >
                  {isRevealed ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      Hide
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                      Reveal
                    </>
                  )}
                </button>
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
                    <p className="text-sm text-gray-600">
                      {isRevealed ? registration.email : maskEmail(registration.email)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {isRevealed ? registration.phone : maskPhone(registration.phone)}
                    </p>
                    <p className="text-sm text-gray-500">
                      DOB: {isRevealed ? registration.dateOfBirth : maskDOB()}
                    </p>
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

      <PasswordPrompt
        isOpen={showRevealPasswordPrompt}
        onConfirm={handleRevealPasswordConfirm}
        onClose={() => setShowRevealPasswordPrompt(false)}
        title="Admin Password Required"
        message="Please enter the admin password to reveal sensitive information:"
      />
    </>
  );
}
