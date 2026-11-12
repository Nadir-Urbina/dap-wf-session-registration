'use client';

import { useState, useEffect, useCallback } from 'react';
import { EmployeeRecord, BBAttendance } from '@/types/employee';
import debounce from 'lodash.debounce';
import Link from 'next/link';

export default function BBCheckInPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EmployeeRecord[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attendees, setAttendees] = useState<BBAttendance[]>([]);

  const fetchAttendees = async () => {
    try {
      const response = await fetch('/api/bb-attendance');
      if (response.ok) {
        const list: BBAttendance[] = await response.json();
        list.sort((a, b) => new Date(b.attendedAt).getTime() - new Date(a.attendedAt).getTime());
        setAttendees(list);
      }
    } catch (err) {
      console.error('Failed to fetch attendees:', err);
    }
  };

  useEffect(() => {
    fetchAttendees();
  }, []);

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
        setSearchResults(response.ok ? await response.json() : []);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSelectedEmployee(null);
    debouncedSearch(e.target.value);
  };

  const handleSelectEmployee = (employee: EmployeeRecord) => {
    setSelectedEmployee(employee);
    setSearchQuery(`${employee.firstName} ${employee.lastName}`);
    setSearchResults([]);
    setError('');
    setSuccess('');
  };

  const handleMarkAttended = async () => {
    if (!selectedEmployee) return;
    const name = `${selectedEmployee.firstName} ${selectedEmployee.lastName}`;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/bb-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selectedEmployee.id, employeeName: name }),
      });
      const data = await response.json();

      if (response.ok) {
        setSuccess(`${name} is marked as attended`);
        setSelectedEmployee(null);
        setSearchQuery('');
        fetchAttendees();
      } else if (response.status === 409) {
        setError(`${name} is already marked as attended`);
      } else {
        setError(data.error || 'Failed to mark attendance');
      }
    } catch {
      setError('Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (attendance: BBAttendance) => {
    if (!confirm(`Remove ${attendance.employeeName} from the Friday attendance list?`)) return;

    try {
      const response = await fetch(`/api/bb-attendance/${attendance.id}`, { method: 'DELETE' });
      if (response.ok) {
        setSuccess(`${attendance.employeeName} was removed from the list`);
        setError('');
        fetchAttendees();
      } else {
        setError('Failed to remove attendance record');
      }
    } catch {
      setError('Failed to remove attendance record');
    }
  };

  const formatTime = (isoString: string) =>
    new Date(isoString).toLocaleString('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

  const alreadyMarked = selectedEmployee
    ? attendees.some(a => a.employeeId === selectedEmployee.id)
    : false;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Friday Brown &amp; Brown Session Check-In</h1>
          <p className="text-gray-600">
            Mark employees who attend a Brown &amp; Brown benefits session on Friday. They will be flagged at
            Saturday&apos;s wellness fair check-in to receive their raffle tickets right away.
          </p>
        </div>

        <div className="mb-6">
          <Link
            href="/?admin"
            className="inline-block px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mark attendance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Mark Attendance</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{success}</div>
            )}

            <div className="space-y-4">
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
                  autoComplete="off"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searching && <div className="absolute right-3 top-9 text-gray-400">Searching...</div>}

                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((employee) => {
                      const marked = attendees.some(a => a.employeeId === employee.id);
                      return (
                        <button
                          key={employee.id}
                          type="button"
                          onClick={() => handleSelectEmployee(employee)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          <div className="font-medium text-gray-900">
                            {employee.firstName} {employee.lastName}
                            {marked && (
                              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                                Already marked
                              </span>
                            )}
                          </div>
                          {employee.email && <div className="text-sm text-gray-500">{employee.email}</div>}
                          {employee.phone && <div className="text-sm text-gray-500">{employee.phone}</div>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedEmployee && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="font-medium text-gray-900">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </div>
                  {selectedEmployee.email && <div className="text-sm text-gray-600">{selectedEmployee.email}</div>}
                  {selectedEmployee.phone && <div className="text-sm text-gray-600">{selectedEmployee.phone}</div>}
                  {alreadyMarked && (
                    <div className="mt-2 text-sm font-semibold text-green-700">Already marked as attended</div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleMarkAttended}
                disabled={!selectedEmployee || alreadyMarked || saving}
                className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {saving ? 'Saving...' : 'Mark as Attended'}
              </button>
            </div>
          </div>

          {/* Attendee list */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-baseline mb-4">
              <h2 className="text-xl font-bold text-gray-900">Attended</h2>
              <div className="text-2xl font-bold text-blue-600">{attendees.length}</div>
            </div>

            {attendees.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No one marked yet</p>
            ) : (
              <div className="space-y-2 max-h-[32rem] overflow-y-auto">
                {attendees.map((attendance) => (
                  <div
                    key={attendance.id}
                    className="flex justify-between items-center p-3 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{attendance.employeeName}</div>
                      <div className="text-xs text-gray-500">{formatTime(attendance.attendedAt)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(attendance)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
