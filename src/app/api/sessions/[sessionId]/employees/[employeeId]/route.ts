import { NextRequest, NextResponse } from 'next/server';
import { readSessionsData, writeSessionsData } from '@/lib/data';
import { Employee } from '@/types';

type RouteContext = {
  params: Promise<{ sessionId: string; employeeId: string }>;
};

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { sessionId, employeeId } = await context.params;
    const updatedEmployee: Omit<Employee, 'id'> = await request.json();

    const data = await readSessionsData();
    const session = data.sessions.find(s => s.id === sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const employeeIndex = session.employees.findIndex(e => e.id === employeeId);

    if (employeeIndex === -1) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    session.employees[employeeIndex] = {
      ...updatedEmployee,
      id: employeeId,
    };

    await writeSessionsData(data);

    return NextResponse.json(session.employees[employeeIndex]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { sessionId, employeeId } = await context.params;

    const data = await readSessionsData();
    const session = data.sessions.find(s => s.id === sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const employeeIndex = session.employees.findIndex(e => e.id === employeeId);

    if (employeeIndex === -1) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    session.employees.splice(employeeIndex, 1);
    await writeSessionsData(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
