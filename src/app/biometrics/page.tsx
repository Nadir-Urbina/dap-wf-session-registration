'use client';

import { useState, useEffect } from 'react';
import { BiometricsData } from '@/types/biometrics';
import BiometricSessionCard from '@/components/BiometricSessionCard';
import Link from 'next/link';

export default function BiometricsPage() {
  const [data, setData] = useState<BiometricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <div className="flex justify-center mt-3">
          <Link
            href="/"
            className="px-4 py-2 bg-[#FFD600] text-black rounded font-semibold hover:bg-[#FFD600]/90 transition-colors"
          >
            ← Back to Benefits Registration
          </Link>
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
    </div>
  );
}
