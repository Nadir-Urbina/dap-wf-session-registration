'use client';

import { useEffect, useState } from 'react';
import { SessionsData, Employee } from '@/types';
import SessionCard from '@/components/SessionCard';
import EmployeeForm from '@/components/EmployeeForm';
import PasswordPrompt from '@/components/PasswordPrompt';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function Home() {
  const [data, setData] = useState<SessionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordAction, setPasswordAction] = useState<'edit' | 'delete' | null>(null);
  const [pendingDeleteData, setPendingDeleteData] = useState<{ sessionId: string; employeeId: string } | null>(null);
  const [pendingEditData, setPendingEditData] = useState<Omit<Employee, 'id'> | null>(null);
  const [showDownloadPasswordPrompt, setShowDownloadPasswordPrompt] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      const sessionsData = await response.json();
      setData(sessionsData);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = (sessionId: string) => {
    setSelectedSession(sessionId);
    setEditingEmployee(null);
    setShowForm(true);
  };

  const handleEditEmployee = (sessionId: string, employee: Employee) => {
    setSelectedSession(sessionId);
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleDeleteEmployee = (sessionId: string, employeeId: string) => {
    if (!confirm('Are you sure you want to remove this employee from the session?')) {
      return;
    }

    // Show password prompt
    setPendingDeleteData({ sessionId, employeeId });
    setPasswordAction('delete');
    setShowPasswordPrompt(true);
  };

  const executeDelete = async (password: string) => {
    if (!pendingDeleteData) return;

    try {
      const response = await fetch(
        `/api/sessions/${pendingDeleteData.sessionId}/employees/${pendingDeleteData.employeeId}`,
        {
          method: 'DELETE',
          headers: {
            'x-admin-password': password,
          },
        }
      );

      if (response.ok) {
        await fetchSessions();
        setShowPasswordPrompt(false);
        setPendingDeleteData(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Invalid password or failed to delete employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee');
    }
  };

  const handleFormSubmit = async (employeeData: Omit<Employee, 'id'>) => {
    if (!selectedSession) return;

    // If editing, show password prompt
    if (editingEmployee) {
      setPendingEditData(employeeData);
      setPasswordAction('edit');
      setShowPasswordPrompt(true);
      return;
    }

    // For new employees, no password required
    try {
      const response = await fetch(
        `/api/sessions/${selectedSession}/employees`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employeeData),
        }
      );

      if (response.ok) {
        await fetchSessions();
        setShowForm(false);
        setEditingEmployee(null);
        setSelectedSession(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save employee');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Failed to save employee');
    }
  };

  const executeEdit = async (password: string) => {
    if (!pendingEditData || !selectedSession || !editingEmployee) return;

    try {
      const response = await fetch(
        `/api/sessions/${selectedSession}/employees/${editingEmployee.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...pendingEditData, password }),
        }
      );

      if (response.ok) {
        await fetchSessions();
        setShowForm(false);
        setEditingEmployee(null);
        setSelectedSession(null);
        setShowPasswordPrompt(false);
        setPendingEditData(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Invalid password or failed to update employee');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Failed to update employee');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEmployee(null);
    setSelectedSession(null);
  };

  const handlePasswordConfirm = (password: string) => {
    if (passwordAction === 'delete') {
      executeDelete(password);
    } else if (passwordAction === 'edit') {
      executeEdit(password);
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordPrompt(false);
    setPasswordAction(null);
    setPendingDeleteData(null);
    setPendingEditData(null);
  };

  const handleDownloadClick = () => {
    setShowDownloadPasswordPrompt(true);
  };

  const handleDownloadConfirm = async (password: string) => {
    try {
      const response = await fetch('/api/validate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const result = await response.json();

      if (!result.valid) {
        throw new Error('Invalid password');
      }

      // Password is valid, proceed with download
      if (!data) return;

      // Prepare data for Excel
      const excelData: Array<{
        'Session Time': string;
        'Full Name': string;
        'Email': string;
        'Phone': string;
        'Primary Language': string;
        'Spanish Only Session': string;
      }> = [];

      data.sessions.forEach((session) => {
        session.employees.forEach((employee) => {
          excelData.push({
            'Session Time': session.time,
            'Full Name': employee.fullName,
            'Email': employee.email,
            'Phone': employee.phone,
            'Primary Language': employee.primaryLanguage,
            'Spanish Only Session': session.spanishOnly ? 'Yes' : 'No'
          });
        });
      });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Benefits');

      // Set column widths
      worksheet['!cols'] = [
        { wch: 12 }, // Session Time
        { wch: 20 }, // Full Name
        { wch: 30 }, // Email
        { wch: 15 }, // Phone
        { wch: 18 }, // Primary Language
        { wch: 20 }  // Spanish Only Session
      ];

      // Generate filename with date
      const filename = `Employee_Benefits_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      setShowDownloadPasswordPrompt(false);
    } catch (error) {
      console.error('Error downloading data:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Failed to load sessions</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-[#FFD600] p-4 sticky top-0 z-10 shadow-md">
        <div className="text-2xl font-semibold text-center mb-2 tracking-wide">DUVAL ASPHALT</div>
        <h1 className="text-xl font-bold text-center">{data.eventTitle}</h1>
        <p className="text-sm text-center mt-1 text-[#FFD600]/80">{data.eventDate}</p>
        <div className="flex justify-center gap-3 mt-3">
          <Link
            href="/biometrics"
            className="px-4 py-2 bg-[#FFD600] text-black rounded font-semibold hover:bg-[#FFD600]/90 transition-colors"
          >
            Biometric Exams Registration
          </Link>
          <button
            onClick={handleDownloadClick}
            className="px-4 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download Excel
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20 max-w-4xl mx-auto">
        <div className="space-y-4">
          {data.sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onAddEmployee={() => handleAddEmployee(session.id)}
              onEditEmployee={(employee) => handleEditEmployee(session.id, employee)}
              onDeleteEmployee={(employeeId) => handleDeleteEmployee(session.id, employeeId)}
            />
          ))}
        </div>
      </main>

      {/* Employee Form Modal */}
      {showForm && selectedSession && (
        <EmployeeForm
          employee={editingEmployee}
          session={data?.sessions.find(s => s.id === selectedSession) || null}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}

      {/* Password Prompt Modal */}
      <PasswordPrompt
        isOpen={showPasswordPrompt}
        onConfirm={handlePasswordConfirm}
        onClose={handlePasswordCancel}
        title="Admin Password Required"
        message={`Please enter the admin password to ${passwordAction === 'delete' ? 'remove' : 'edit'} this employee:`}
      />

      {/* Download Password Prompt */}
      <PasswordPrompt
        isOpen={showDownloadPasswordPrompt}
        onConfirm={handleDownloadConfirm}
        onClose={() => setShowDownloadPasswordPrompt(false)}
        title="Admin Password Required"
        message="Please enter the admin password to download the data:"
      />
    </div>
  );
}
