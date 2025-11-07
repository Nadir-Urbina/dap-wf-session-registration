'use client';

import { useState, useEffect, useCallback } from 'react';
import { EmployeeRecord, CheckIn } from '@/types/employee';
import debounce from 'lodash.debounce';
import Link from 'next/link';

interface SessionInfo {
  benefitsSession?: string;
  biometricsSession?: string;
}

export default function CheckInPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EmployeeRecord[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [foodTickets, setFoodTickets] = useState('0');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);

  useEffect(() => {
    fetchRecentCheckIns();
  }, []);

  const fetchRecentCheckIns = async () => {
    try {
      const response = await fetch('/api/checkins');
      if (response.ok) {
        const checkIns = await response.json();
        // Sort by check-in time (most recent first) and take top 10
        const sorted = checkIns.sort((a: CheckIn, b: CheckIn) =>
          new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
        );
        setRecentCheckIns(sorted.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to fetch recent check-ins:', error);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      try {
        const response = await fetch(`/api/employees/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const results = await response.json();
          setSearchResults(results);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Helper function to check if names match based on first and last name components
  const namesMatch = (registeredName: string, employeeFirstName: string, employeeLastName: string): boolean => {
    if (!registeredName) {
      console.log('      namesMatch: registeredName is empty');
      return false;
    }

    const registered = registeredName.toLowerCase().trim();
    const firstName = employeeFirstName.toLowerCase().trim();
    const lastName = employeeLastName.toLowerCase().trim();

    const hasFirstName = registered.includes(firstName);
    const hasLastName = registered.includes(lastName);

    console.log(`      namesMatch: "${registered}" vs "${firstName}" + "${lastName}"`);
    console.log(`      Has first name: ${hasFirstName}, Has last name: ${hasLastName}`);

    // Match if both first name and last name are present in the registered name
    // This handles cases like "Nadir Brooks" matching "Nadir Urbina Brooks"
    return hasFirstName && hasLastName;
  };

  const fetchEmployeeSessions = async (employeeEmail: string, employeeFirstName: string, employeeLastName: string) => {
    setLoadingSessions(true);
    setSessionInfo(null);

    console.log('=== Searching for sessions ===');
    console.log('Employee Email:', employeeEmail);
    console.log('Employee First Name:', employeeFirstName);
    console.log('Employee Last Name:', employeeLastName);

    try {
      // Fetch both benefits and biometrics sessions
      const [benefitsResponse, biometricsResponse] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/biometrics')
      ]);

      const info: SessionInfo = {};

      // Check benefits sessions
      if (benefitsResponse.ok) {
        const benefitsData = await benefitsResponse.json();
        console.log('Benefits sessions count:', benefitsData.sessions?.length || 0);
        for (const session of benefitsData.sessions) {
          const found = session.employees.find((emp: { email: string; fullName: string }) => {
            const emailMatch = emp.email?.toLowerCase() === employeeEmail?.toLowerCase();
            const nameMatch = namesMatch(emp.fullName, employeeFirstName, employeeLastName);
            if (emailMatch || nameMatch) {
              console.log('✓ Found in Benefits:', emp.fullName, 'Time:', session.time);
            }
            return emailMatch || nameMatch;
          });
          if (found) {
            info.benefitsSession = session.time;
            break;
          }
        }
      }

      // Check biometrics sessions
      if (biometricsResponse.ok) {
        const biometricsData = await biometricsResponse.json();
        console.log('Biometrics sessions count:', biometricsData.sessions?.length || 0);

        for (const session of biometricsData.sessions) {
          console.log('Checking biometrics session:', session.time);
          console.log('Session has registrations:', session.registrations?.length || 0);

          if (session.registrations) {
            // Log all registrations in this session
            session.registrations.forEach((reg: { firstName: string; lastName: string; email: string }) => {
              console.log('  - Registration:', `${reg.firstName} ${reg.lastName}`, '/', reg.email);
            });
          }

          const found = session.registrations?.find((reg: { firstName: string; lastName: string; email: string }) => {
            const emailMatch = reg.email?.toLowerCase() === employeeEmail?.toLowerCase();
            const fullName = `${reg.firstName} ${reg.lastName}`;
            const nameMatch = namesMatch(fullName, employeeFirstName, employeeLastName);

            console.log('  Checking:', fullName);
            console.log('    Email match:', emailMatch, `(${reg.email} vs ${employeeEmail})`);
            console.log('    Name match:', nameMatch);

            if (emailMatch || nameMatch) {
              console.log('✓ Found in Biometrics:', fullName, 'Time:', session.time);
            }

            return emailMatch || nameMatch;
          });

          if (found) {
            info.biometricsSession = session.time;
            break;
          }
        }
      }

      console.log('=== Final result ===');
      console.log('Benefits Session:', info.benefitsSession || 'Not found');
      console.log('Biometrics Session:', info.biometricsSession || 'Not found');

      setSessionInfo(info);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleSelectEmployee = (employee: EmployeeRecord) => {
    setSelectedEmployee(employee);
    setSearchQuery(`${employee.firstName} ${employee.lastName}`);
    setSearchResults([]);
    setError('');
    setSuccess('');

    // Fetch their scheduled sessions
    fetchEmployeeSessions(employee.email || '', employee.firstName, employee.lastName);
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      setError('Please select an employee');
      return;
    }

    const ticketsNum = parseInt(foodTickets);
    if (isNaN(ticketsNum) || ticketsNum < 0) {
      setError('Please enter a valid number of food tickets');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
          foodTickets: ticketsNum,
          notes: notes.trim() || undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Successfully checked in ${selectedEmployee.firstName} ${selectedEmployee.lastName}`);
        // Reset form
        setSelectedEmployee(null);
        setSearchQuery('');
        setFoodTickets('0');
        setNotes('');
        // Refresh recent check-ins
        fetchRecentCheckIns();
      } else if (response.status === 409) {
        setError(`${selectedEmployee.firstName} ${selectedEmployee.lastName} has already checked in`);
      } else {
        setError(data.error || 'Failed to check in employee');
      }
    } catch {
      setError('Failed to check in employee');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Check-In</h1>
          <p className="text-gray-600">Check in employees as they arrive at the wellness fair</p>
        </div>

        <div className="mb-6">
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Check-in Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Check In Employee</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {success}
              </div>
            )}

            <form onSubmit={handleCheckIn}>
              <div className="space-y-4">
                {/* Employee Search */}
                <div className="relative">
                  <label htmlFor="employee-search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search Employee *
                  </label>
                  <input
                    id="employee-search"
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Type employee name..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searching && (
                    <div className="absolute right-3 top-9 text-gray-400">
                      Searching...
                    </div>
                  )}

                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((employee) => (
                        <button
                          key={employee.id}
                          type="button"
                          onClick={() => handleSelectEmployee(employee)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          <div className="font-medium text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </div>
                          {employee.email && (
                            <div className="text-sm text-gray-500">{employee.email}</div>
                          )}
                          {employee.phone && (
                            <div className="text-sm text-gray-500">{employee.phone}</div>
                          )}
                          <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                            employee.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {employee.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Employee Info */}
                {selectedEmployee && (
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="font-medium text-gray-900 mb-2">
                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                      </div>
                      {selectedEmployee.email && (
                        <div className="text-sm text-gray-600">{selectedEmployee.email}</div>
                      )}
                      {selectedEmployee.phone && (
                        <div className="text-sm text-gray-600">{selectedEmployee.phone}</div>
                      )}
                    </div>

                    {/* Scheduled Sessions */}
                    <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                      <h3 className="font-semibold text-green-900 mb-2">Scheduled Sessions</h3>
                      {loadingSessions ? (
                        <div className="text-sm text-gray-600">Loading sessions...</div>
                      ) : sessionInfo && (sessionInfo.benefitsSession || sessionInfo.biometricsSession) ? (
                        <div className="space-y-2">
                          {sessionInfo.benefitsSession && (
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-0.5">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <div className="font-semibold text-green-900">Benefits Session</div>
                                <div className="text-sm text-green-700">Time: {sessionInfo.benefitsSession}</div>
                              </div>
                            </div>
                          )}
                          {sessionInfo.biometricsSession && (
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-0.5">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <div className="font-semibold text-green-900">Biometrics Session</div>
                                <div className="text-sm text-green-700">Time: {sessionInfo.biometricsSession}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>No sessions scheduled</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Food Tickets */}
                <div>
                  <label htmlFor="food-tickets" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Food Tickets *
                  </label>
                  <input
                    id="food-tickets"
                    type="number"
                    min="0"
                    value={foodTickets}
                    onChange={(e) => setFoodTickets(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Equals the number of family members attending
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any additional notes..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!selectedEmployee || loading}
                  className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Checking In...' : 'Check In Employee'}
                </button>
              </div>
            </form>
          </div>

          {/* Recent Check-ins */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Check-Ins</h2>

            {recentCheckIns.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No check-ins yet</p>
            ) : (
              <div className="space-y-3">
                {recentCheckIns.map((checkIn) => (
                  <div key={checkIn.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">{checkIn.employeeName}</div>
                      <div className="text-xs text-gray-500">{formatDateTime(checkIn.checkInTime)}</div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{checkIn.foodTickets}</span>
                        <span>food ticket{checkIn.foodTickets !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    {checkIn.notes && (
                      <div className="mt-2 text-sm text-gray-600 italic">
                        Note: {checkIn.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Check-Ins</div>
            <div className="text-2xl font-bold text-gray-900">{recentCheckIns.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Food Tickets</div>
            <div className="text-2xl font-bold text-blue-600">
              {recentCheckIns.reduce((sum, checkIn) => sum + checkIn.foodTickets, 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Latest Check-In</div>
            <div className="text-lg font-bold text-gray-900">
              {recentCheckIns.length > 0
                ? formatDateTime(recentCheckIns[0].checkInTime)
                : '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
