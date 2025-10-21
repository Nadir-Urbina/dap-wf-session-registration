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
    const body = await request.json();
    const { password, ...updatedEmployee } = body as Omit<Employee, 'id'> & { password?: string };

    // Verify password
    const internalPassword = process.env.INTERNAL_PWD;
    if (!password || password !== internalPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

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
  } catch {
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

    // Verify password from request header
    const password = request.headers.get('x-admin-password');
    const internalPassword = process.env.INTERNAL_PWD;
    if (!password || password !== internalPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

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
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
