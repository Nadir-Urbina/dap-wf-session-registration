import { NextResponse } from 'next/server';
import { readEmployeesData, writeEmployeesData } from '@/lib/employeeData';

interface Params {
  params: Promise<{
    employeeId: string;
  }>;
}

// GET single employee
export async function GET(request: Request, { params }: Params) {
  try {
    const { employeeId } = await params;
    const data = await readEmployeesData();
    const employee = data.employees.find(emp => emp.id === employeeId);

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Failed to fetch employee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}

// PUT update employee
export async function PUT(request: Request, { params }: Params) {
  try {
    const { employeeId } = await params;
    const body = await request.json();
    const { firstName, middleName, lastName, employeeId: empId, hireDate, employmentType, phone, email, status } = body;

    const data = await readEmployeesData();
    const employeeIndex = data.employees.findIndex(emp => emp.id === employeeId);

    if (employeeIndex === -1) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Update employee
    const updatedEmployee = {
      ...data.employees[employeeIndex],
      firstName: firstName?.trim() || data.employees[employeeIndex].firstName,
      middleName: middleName !== undefined ? (middleName?.trim() || undefined) : data.employees[employeeIndex].middleName,
      lastName: lastName?.trim() || data.employees[employeeIndex].lastName,
      employeeId: empId !== undefined ? (empId?.trim() || undefined) : data.employees[employeeIndex].employeeId,
      hireDate: hireDate !== undefined ? (hireDate?.trim() || undefined) : data.employees[employeeIndex].hireDate,
      employmentType: employmentType !== undefined ? employmentType : data.employees[employeeIndex].employmentType,
      phone: phone?.trim() || data.employees[employeeIndex].phone,
      email: email !== undefined ? (email?.trim().toLowerCase() || undefined) : data.employees[employeeIndex].email,
      status: status || data.employees[employeeIndex].status,
      updatedAt: new Date().toISOString()
    };

    data.employees[employeeIndex] = updatedEmployee;
    await writeEmployeesData(data);

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error('Failed to update employee:', error);
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}

// DELETE employee
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { employeeId } = await params;
    const data = await readEmployeesData();
    const employeeIndex = data.employees.findIndex(emp => emp.id === employeeId);

    if (employeeIndex === -1) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    data.employees.splice(employeeIndex, 1);
    await writeEmployeesData(data);

    return NextResponse.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Failed to delete employee:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
