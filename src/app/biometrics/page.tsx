'use client';

import { useState, useEffect } from 'react';
import { BiometricsData } from '@/types/biometrics';
import BiometricSessionCard from '@/components/BiometricSessionCard';
import PasswordPrompt from '@/components/PasswordPrompt';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function BiometricsPage() {
  const [data, setData] = useState<BiometricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDownloadPasswordPrompt, setShowDownloadPasswordPrompt] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/biometrics');
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        <p className="text-sm text-center mt-1 text-[#FFD600]/80">{data.eventDate}</p>
        <div className="flex justify-center gap-3 mt-3">
          <Link
            href="/"
            className="px-4 py-2 bg-[#FFD600] text-black rounded font-semibold hover:bg-[#FFD600]/90 transition-colors"
          >
            ← Back to Benefits Registration
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
            <BiometricSessionCard
              key={session.id}
              session={session}
              onUpdate={fetchData}
            />
          ))}
        </div>
      </main>

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
