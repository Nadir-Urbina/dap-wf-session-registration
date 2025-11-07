import { NextResponse } from 'next/server';
import { readCheckInsData, writeCheckInsData } from '@/lib/employeeData';
import { CheckIn } from '@/types/employee';

// GET all check-ins
export async function GET() {
  try {
    const data = await readCheckInsData();
    return NextResponse.json(data.checkIns);
  } catch (error) {
    console.error('Failed to fetch check-ins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    );
  }
}

// POST create new check-in
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, employeeName, foodTickets, notes } = body;

    if (!employeeId || !employeeName) {
      return NextResponse.json(
        { error: 'Employee ID and name are required' },
        { status: 400 }
      );
    }

    if (foodTickets === undefined || foodTickets < 0) {
      return NextResponse.json(
        { error: 'Food tickets must be a non-negative number' },
        { status: 400 }
      );
    }

    const data = await readCheckInsData();

    // Check if employee already checked in
    const existingCheckIn = data.checkIns.find(
      checkIn => checkIn.employeeId === employeeId
    );

    if (existingCheckIn) {
      return NextResponse.json(
        { error: 'Employee has already checked in', checkIn: existingCheckIn },
        { status: 409 }
      );
    }

    // Create new check-in
    const newCheckIn: CheckIn = {
      id: `checkin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      employeeId,
      employeeName,
      checkInTime: new Date().toISOString(),
      foodTickets: Number(foodTickets),
      notes: notes?.trim() || undefined
    };

    data.checkIns.push(newCheckIn);
    await writeCheckInsData(data);

    return NextResponse.json(newCheckIn, { status: 201 });
  } catch (error) {
    console.error('Failed to create check-in:', error);
    return NextResponse.json(
      { error: 'Failed to create check-in' },
      { status: 500 }
    );
  }
}
