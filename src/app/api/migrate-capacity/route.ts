import { NextResponse } from 'next/server';
import { readSessionsData, writeSessionsData } from '@/lib/data';

export async function POST(request: Request) {
  try {
    // Verify password
    const { password } = await request.json();

    if (!password || password !== process.env.INTERNAL_PWD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Read current data
    const data = await readSessionsData();

    // Update the capacity for Spanish-only sessions
    data.sessions.forEach((session) => {
      if (session.spanishOnly) {
        session.maxCapacity = 15;
      }
    });

    // Write updated data back
    await writeSessionsData(data);

    return NextResponse.json({
      success: true,
      message: 'Spanish-only sessions capacity updated to 15',
      updatedSessions: data.sessions.filter(s => s.spanishOnly).map(s => ({
        id: s.id,
        time: s.time,
        maxCapacity: s.maxCapacity,
        currentRegistrations: s.employees.length
      }))
    });
  } catch (error) {
    console.error('Error migrating capacity:', error);
    return NextResponse.json(
      { error: 'Failed to migrate capacity' },
      { status: 500 }
    );
  }
}
