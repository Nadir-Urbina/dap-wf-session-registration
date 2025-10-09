import { NextRequest, NextResponse } from 'next/server';
import { readSessionsData, writeSessionsData } from '@/lib/data';
import { Employee } from '@/types';

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { sessionId } = await context.params;
    const employee: Omit<Employee, 'id'> = await request.json();

    const data = await readSessionsData();
    const session = data.sessions.find(s => s.id === sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.employees.length >= session.maxCapacity) {
      return NextResponse.json(
        { error: 'Session is at full capacity' },
        { status: 400 }
      );
    }

    const newEmployee: Employee = {
      ...employee,
      id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    session.employees.push(newEmployee);
    await writeSessionsData(data);

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add employee' },
      { status: 500 }
    );
  }
}
