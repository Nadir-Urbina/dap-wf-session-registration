import { NextResponse } from 'next/server';
import { readBBAttendanceData, writeBBAttendanceData } from '@/lib/employeeData';
import { BBAttendance } from '@/types/employee';

// GET all Friday Brown & Brown attendees
export async function GET() {
  try {
    const data = await readBBAttendanceData();
    return NextResponse.json(data.attendees);
  } catch (error) {
    console.error('Failed to fetch Brown & Brown attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Brown & Brown attendance' },
      { status: 500 }
    );
  }
}

// POST mark an employee as having attended a Friday Brown & Brown session
export async function POST(request: Request) {
  try {
    const { employeeId, employeeName } = await request.json();

    if (!employeeId || !employeeName) {
      return NextResponse.json(
        { error: 'Employee ID and name are required' },
        { status: 400 }
      );
    }

    const data = await readBBAttendanceData();
    const existing = data.attendees.find(a => a.employeeId === employeeId);

    if (existing) {
      return NextResponse.json(
        { error: 'Employee is already marked as attended', attendance: existing },
        { status: 409 }
      );
    }

    const attendance: BBAttendance = {
      id: `bb-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      employeeId,
      employeeName,
      attendedAt: new Date().toISOString()
    };

    data.attendees.push(attendance);
    await writeBBAttendanceData(data);

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error('Failed to record Brown & Brown attendance:', error);
    return NextResponse.json(
      { error: 'Failed to record Brown & Brown attendance' },
      { status: 500 }
    );
  }
}
