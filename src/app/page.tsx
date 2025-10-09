'use client';

import { useEffect, useState } from 'react';
import { SessionsData, Employee } from '@/types';
import SessionCard from '@/components/SessionCard';
import EmployeeForm from '@/components/EmployeeForm';

export default function Home() {
  const [data, setData] = useState<SessionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showForm, setShowForm] = useState(false);

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

  const handleDeleteEmployee = async (sessionId: string, employeeId: string) => {
    if (!confirm('Are you sure you want to remove this employee from the session?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/sessions/${sessionId}/employees/${employeeId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        await fetchSessions();
      } else {
        alert('Failed to delete employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee');
    }
  };

  const handleFormSubmit = async (employeeData: Omit<Employee, 'id'>) => {
    if (!selectedSession) return;

    try {
      let response;

      if (editingEmployee) {
        // Update existing employee
        response = await fetch(
          `/api/sessions/${selectedSession}/employees/${editingEmployee.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData),
          }
        );
      } else {
        // Add new employee
        response = await fetch(
          `/api/sessions/${selectedSession}/employees`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData),
          }
        );
      }

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

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEmployee(null);
    setSelectedSession(null);
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
      {showForm && (
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
}
