import { NextResponse } from 'next/server';
import { readBiometricsData, writeBiometricsData } from '@/lib/biometricsData';
import { BiometricRegistration } from '@/types/biometrics';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { password, ...registration }: { password?: string } & Omit<BiometricRegistration, 'id'> = body;

    // Validate password
    if (!password || password !== process.env.INTERNAL_PWD) {
      return NextResponse.json(
        { error: 'Invalid or missing password' },
        { status: 401 }
      );
    }

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
