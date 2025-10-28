'use client';

import { useState } from 'react';
import { Session, Employee } from '@/types';
import PasswordPrompt from './PasswordPrompt';

interface SessionCardProps {
  session: Session;
  onAddEmployee: () => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employeeId: string) => void;
}

export default function SessionCard({
  session,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
}: SessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showRevealPasswordPrompt, setShowRevealPasswordPrompt] = useState(false);

  const isFull = session.employees.length >= session.maxCapacity;

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
  const hasSpanishSpeakers = session.employees.some(
    (emp) => emp.primaryLanguage === 'Spanish'
  );

  const getCapacityColor = () => {
    const percentage = (session.employees.length / session.maxCapacity) * 100;
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    return 'text-green-600';
  };

  const generateEmailLink = () => {
    const emails = session.employees.map(emp => emp.email).join(',');
    const subject = encodeURIComponent('Employee Benefits Session - Starting Soon');
    const body = encodeURIComponent(
      `Hello,\n\nYour Employee Benefits information session is starting soon!\n\n` +
      `Session Time: ${session.time}\n` +
      `Date: November 8, 2025\n\n` +
      `Please arrive a few minutes early. We look forward to seeing you!\n\n` +
      `Best regards,\nEvent Team`
    );
    return `mailto:${emails}?subject=${subject}&body=${body}`;
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

  const copyPhoneNumbers = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Get all phone numbers formatted nicely
    const phoneNumbers = session.employees.map(emp => emp.phone).join(', ');

    try {
      await navigator.clipboard.writeText(phoneNumbers);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (error) {
      console.error('Failed to copy phone numbers:', error);
      alert('Failed to copy phone numbers');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Language Banner */}
      {session.spanishOnly ? (
        <div className="bg-[#FFD600] text-black px-4 py-2 text-center font-semibold text-sm">
          🌐 Spanish Only - Solo español (Translation Available)
        </div>
      ) : (
        <div className="bg-gray-100 text-gray-700 px-4 py-2 text-center font-medium text-sm">
          English Only - Spanish translation available in sessions 12:45 PM & 1:15 PM
        </div>
      )}

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
                {session.employees.length}/{session.maxCapacity} registered
              </span>
              {hasSpanishSpeakers && !session.spanishOnly && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
                  ⚠️ No translator
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddEmployee();
              }}
              disabled={isFull}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                isFull
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-[#FFD600] hover:bg-gray-900 active:bg-gray-800'
              }`}
            >
              {isFull ? 'Full' : '+ Add'}
            </button>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Employee List */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {session.employees.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No employees registered yet
            </div>
          ) : (
            <>
              {/* Notification Buttons */}
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex gap-3">
                <button
                  onClick={handleRevealToggle}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm flex items-center gap-2"
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
                  className="flex-1 px-4 py-2 bg-black text-[#FFD600] rounded-lg hover:bg-gray-900 active:bg-gray-800 font-medium text-sm text-center flex items-center justify-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Send Email
                </a>
                <button
                  onClick={copyPhoneNumbers}
                  className="flex-1 px-4 py-2 bg-[#FFD600] text-black rounded-lg hover:bg-[#FFD600]/90 active:bg-[#FFD600]/80 font-medium text-sm text-center flex items-center justify-center gap-2 relative"
                >
                  {showCopiedMessage ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                        />
                      </svg>
                      Copy Phones
                    </>
                  )}
                </button>
              </div>

              {/* Employee List */}
              <div className="divide-y divide-gray-100">
                {session.employees.map((employee) => (
                <div
                  key={employee.id}
                  className="p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {employee.fullName}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {isRevealed ? employee.email : maskEmail(employee.email)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {isRevealed ? employee.phone : maskPhone(employee.phone)}
                      </p>
                      <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {employee.primaryLanguage}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => onEditEmployee(employee)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 active:bg-gray-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteEmployee(employee.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 active:bg-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </>
          )}
        </div>
      )}

      <PasswordPrompt
        isOpen={showRevealPasswordPrompt}
        onConfirm={handleRevealPasswordConfirm}
        onClose={() => setShowRevealPasswordPrompt(false)}
        title="Admin Password Required"
        message="Please enter the admin password to reveal sensitive information:"
      />
    </div>
  );
}
