import { NextResponse } from 'next/server';
import { readBiometricsData, writeBiometricsData } from '@/lib/biometricsData';
import { BiometricRegistration } from '@/types/biometrics';
import { hasBiometricsAccess } from '@/lib/biometricsAuth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    if (!hasBiometricsAccess(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const body = await request.json();
    const registration: Omit<BiometricRegistration, 'id'> = body;

    const data = await readBiometricsData();
    const sessionIndex = data.sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const session = data.sessions[sessionIndex];

    // Check if session is full
    if (session.registrations.length >= session.maxCapacity) {
      return NextResponse.json(
        { error: 'Session is full' },
        { status: 400 }
      );
    }

    // Create new registration with ID
    const newRegistration: BiometricRegistration = {
      ...registration,
      id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    session.registrations.push(newRegistration);
    await writeBiometricsData(data);

    return NextResponse.json(newRegistration, { status: 201 });
  } catch (error) {
    console.error('Error adding registration:', error);
    return NextResponse.json(
      { error: 'Failed to add registration' },
      { status: 500 }
    );
  }
}
