import { NextResponse } from 'next/server';
import { readEmployeesData, writeEmployeesData } from '@/lib/employeeData';
import { EmployeeRecord } from '@/types/employee';

// GET all employees
export async function GET() {
  try {
    const data = await readEmployeesData();
    return NextResponse.json(data.employees);
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST create new employee
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, middleName, lastName, employeeId, hireDate, employmentType, phone, email, status } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    const data = await readEmployeesData();

    // Generate unique ID
    const newId = `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newEmployee: EmployeeRecord = {
      id: newId,
      firstName: firstName.trim(),
      middleName: middleName?.trim() || undefined,
      lastName: lastName.trim(),
      employeeId: employeeId?.trim() || undefined,
      hireDate: hireDate?.trim() || undefined,
      employmentType: employmentType || undefined,
      phone: phone?.trim() || '',
      email: email?.trim().toLowerCase() || undefined,
      status: status || 'active',
      createdAt: now,
      updatedAt: now
    };

    data.employees.push(newEmployee);
    await writeEmployeesData(data);

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error) {
    console.error('Failed to create employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
