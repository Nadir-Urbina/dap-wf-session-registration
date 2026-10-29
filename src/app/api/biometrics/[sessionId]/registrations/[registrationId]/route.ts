import { NextResponse } from 'next/server';
import { readBiometricsData, writeBiometricsData } from '@/lib/biometricsData';
import { BiometricRegistration } from '@/types/biometrics';
import { hasBiometricsAccess } from '@/lib/biometricsAuth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ sessionId: string; registrationId: string }> }
) {
  try {
    const { sessionId, registrationId } = await params;
    if (!hasBiometricsAccess(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: Omit<BiometricRegistration, 'id'> = await request.json();

    const data = await readBiometricsData();
    const sessionIndex = data.sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const session = data.sessions[sessionIndex];
    const registrationIndex = session.registrations.findIndex(r => r.id === registrationId);

    if (registrationIndex === -1) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    session.registrations[registrationIndex] = {
      ...body,
      id: registrationId
    };

    await writeBiometricsData(data);

    return NextResponse.json(session.registrations[registrationIndex]);
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      { error: 'Failed to update registration' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sessionId: string; registrationId: string }> }
) {
  try {
    const { sessionId, registrationId } = await params;

    if (!hasBiometricsAccess(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const registrationIndex = session.registrations.findIndex(r => r.id === registrationId);

    if (registrationIndex === -1) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    session.registrations.splice(registrationIndex, 1);
    await writeBiometricsData(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json(
      { error: 'Failed to delete registration' },
      { status: 500 }
    );
  }
}
