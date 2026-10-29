'use client';

import { useState, useEffect } from 'react';
import { BiometricsData } from '@/types/biometrics';
import BiometricSessionCard from '@/components/BiometricSessionCard';
import { BIOMETRICS_PASSWORD_HEADER } from '@/lib/biometricsAuth';
import Link from 'next/link';
import * as XLSX from 'xlsx';

// Kept for the browser tab only, so a reload doesn't ask again
const STORAGE_KEY = 'biometrics-password';

export default function BiometricsPage() {
  const [data, setData] = useState<BiometricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const fetchData = async (pwd = password) => {
    if (!pwd) return;
    try {
      const response = await fetch('/api/biometrics', {
        headers: { [BIOMETRICS_PASSWORD_HEADER]: pwd }
      });
      if (response.status === 401) {
        try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
        setPassword(null);
        setData(null);
        setPasswordError('Incorrect password');
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      try { sessionStorage.setItem(STORAGE_KEY, pwd); } catch {}
      setPassword(pwd);
      setPasswordError(null);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setPasswordError('Could not load the sign-up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let saved: string | null = null;
    try { saved = sessionStorage.getItem(STORAGE_KEY); } catch {}
    if (saved) {
      fetchData(saved);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchData(passwordInput);
    setPasswordInput('');
  };

  const handleDownload = () => {
    try {
      if (!data) return;

      // Prepare data for Excel
      const excelData: Array<{
        'Session Time': string;
        'First Name': string;
        'Last Name': string;
        'Email': string;
        'Phone': string;
        'Date of Birth': string;
      }> = [];

      data.sessions.forEach((session) => {
        session.registrations.forEach((registration) => {
          excelData.push({
            'Session Time': session.time,
            'First Name': registration.firstName,
            'Last Name': registration.lastName,
            'Email': registration.email,
            'Phone': registration.phone,
            'Date of Birth': registration.dateOfBirth
          });
        });
      });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Biometric Registrations');

      // Set column widths
      worksheet['!cols'] = [
        { wch: 12 }, // Session Time
        { wch: 15 }, // First Name
        { wch: 15 }, // Last Name
        { wch: 30 }, // Email
        { wch: 15 }, // Phone
        { wch: 12 }  // Date of Birth
      ];

      // Generate filename with date
      const filename = `Biometric_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error downloading data:', error);
      alert('Failed to download data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!password) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleUnlock} className="bg-white rounded-lg shadow-md p-6 w-full max-w-sm">
          <div className="text-xl font-semibold text-center mb-1 tracking-wide">DUVAL ASPHALT</div>
          <h1 className="text-lg font-bold text-center text-gray-800 mb-4">Biometric Exams</h1>
          <p className="text-gray-600 text-sm mb-4">
            This sign-up is managed by the wellness coordinators. Enter the biometrics password to continue.
          </p>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 text-black"
            placeholder="Enter password"
            autoFocus
            required
          />
          {passwordError && <p className="text-red-600 text-sm mb-2">{passwordError}</p>}
          <button
            type="submit"
            className="w-full mt-2 px-4 py-2 bg-black text-[#FFD600] rounded-md font-semibold hover:bg-gray-900"
          >
            Unlock
          </button>
        </form>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Error: {error || 'Failed to load data'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-[#FFD600] p-4 sticky top-0 z-10 shadow-md">
        <div className="text-2xl font-semibold text-center mb-2 tracking-wide">DUVAL ASPHALT</div>
        <h1 className="text-xl font-bold text-center">{data.eventTitle}</h1>
        {data.eventDate && (
          <p className="text-sm text-center mt-1 text-[#FFD600]/80">{data.eventDate}</p>
        )}
        <div className="flex justify-center gap-3 mt-3">
          <Link
            href="/?admin"
            className="px-4 py-2 bg-[#FFD600] text-black rounded font-semibold hover:bg-[#FFD600]/90 transition-colors"
          >
            ← Back to Benefits Registration
          </Link>
          <button
            onClick={handleDownload}
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
            <BiometricSessionCard
              key={session.id}
              session={session}
              password={password}
              onUpdate={() => fetchData()}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
