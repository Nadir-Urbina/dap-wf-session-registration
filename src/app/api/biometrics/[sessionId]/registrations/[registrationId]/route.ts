import { NextResponse } from 'next/server';
import { readBiometricsData, writeBiometricsData } from '@/lib/biometricsData';
import { BiometricRegistration } from '@/types/biometrics';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ sessionId: string; registrationId: string }> }
) {
  try {
    const { sessionId, registrationId } = await params;
    const body: Omit<BiometricRegistration, 'id'> & { password: string } = await request.json();

    // Verify password
    if (!body.password || body.password !== process.env.INTERNAL_PWD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
    const registrationIndex = session.registrations.findIndex(r => r.id === registrationId);

    if (registrationIndex === -1) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Update registration (excluding password from the saved data)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...registrationData } = body;
    session.registrations[registrationIndex] = {
      ...registrationData,
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

    // Verify password
    const password = request.headers.get('x-admin-password');
    if (!password || password !== process.env.INTERNAL_PWD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
