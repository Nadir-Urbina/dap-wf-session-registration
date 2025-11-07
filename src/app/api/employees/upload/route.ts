import { NextResponse } from 'next/server';
import { readEmployeesData, writeEmployeesData } from '@/lib/employeeData';
import { EmployeeRecord } from '@/types/employee';
import * as XLSX from 'xlsx';

// POST upload CSV/XLSX file
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read file as buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse file based on type
    let parsedData: unknown[][];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      // Parse CSV
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      parsedData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as unknown[][];
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Parse XLSX
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      parsedData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as unknown[][];
    } else {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload CSV or XLSX file.' },
        { status: 400 }
      );
    }

    if (parsedData.length < 2) {
      return NextResponse.json(
        { error: 'File must contain header row and at least one data row' },
        { status: 400 }
      );
    }

    // Get headers from first row
    const headers = parsedData[0].map((h: unknown) =>
      String(h).toLowerCase().trim()
    );

    // Find column indices
    const firstNameIdx = headers.findIndex((h: string) =>
      h.includes('first') && h.includes('name')
    );
    const middleNameIdx = headers.findIndex((h: string) =>
      h.includes('middle') && h.includes('name')
    );
    const lastNameIdx = headers.findIndex((h: string) =>
      h.includes('last') && h.includes('name')
    );
    const employeeIdIdx = headers.findIndex((h: string) =>
      h.includes('employee') && h.includes('id')
    );
    const hireDateIdx = headers.findIndex((h: string) =>
      h.includes('hire') && h.includes('date')
    );
    const employmentTypeIdx = headers.findIndex((h: string) =>
      h.includes('employment') && h.includes('type')
    );
    const phoneIdx = headers.findIndex((h: string) =>
      h.includes('phone')
    );
    const emailIdx = headers.findIndex((h: string) =>
      h.includes('email')
    );
    const statusIdx = headers.findIndex((h: string) =>
      h.includes('status')
    );

    if (firstNameIdx === -1 || lastNameIdx === -1) {
      return NextResponse.json(
        { error: 'File must contain columns: First Name and Last Name' },
        { status: 400 }
      );
    }

    // Parse rows into employees
    const data = await readEmployeesData();
    const now = new Date().toISOString();
    const newEmployees: EmployeeRecord[] = [];
    const errors: string[] = [];

    for (let i = 1; i < parsedData.length; i++) {
      const row = parsedData[i];

      if (!row || row.length === 0) continue;

      const firstName = row[firstNameIdx] ? String(row[firstNameIdx]).trim() : '';
      const middleName = middleNameIdx !== -1 && row[middleNameIdx] ? String(row[middleNameIdx]).trim() : '';
      const lastName = row[lastNameIdx] ? String(row[lastNameIdx]).trim() : '';
      const employeeId = employeeIdIdx !== -1 && row[employeeIdIdx] ? String(row[employeeIdIdx]).trim() : '';
      const hireDate = hireDateIdx !== -1 && row[hireDateIdx] ? String(row[hireDateIdx]).trim() : '';
      const employmentType = employmentTypeIdx !== -1 && row[employmentTypeIdx] ? String(row[employmentTypeIdx]).trim() : '';
      const phone = phoneIdx !== -1 && row[phoneIdx] ? String(row[phoneIdx]).trim() : '';
      const email = emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim().toLowerCase() : '';
      const statusValue = statusIdx !== -1 && row[statusIdx] ?
        String(row[statusIdx]).trim().toLowerCase() : 'active';

      if (!firstName || !lastName) {
        errors.push(`Row ${i + 1}: Missing required fields (First Name and Last Name)`);
        continue;
      }

      // Check for duplicate email (only if email is provided)
      if (email) {
        const isDuplicate = data.employees.some(emp => emp.email === email) ||
                           newEmployees.some(emp => emp.email === email);

        if (isDuplicate) {
          errors.push(`Row ${i + 1}: Duplicate email ${email}`);
          continue;
        }
      }

      // Validate and normalize employment type
      let normalizedEmploymentType: 'Hourly' | 'Salary' | 'Contract' | 'Part-Time' | '' | undefined = undefined;
      if (employmentType) {
        const empTypeLower = employmentType.toLowerCase();
        if (empTypeLower === 'hourly') normalizedEmploymentType = 'Hourly';
        else if (empTypeLower === 'salary') normalizedEmploymentType = 'Salary';
        else if (empTypeLower === 'contract') normalizedEmploymentType = 'Contract';
        else if (empTypeLower.includes('part')) normalizedEmploymentType = 'Part-Time';
      }

      const newEmployee: EmployeeRecord = {
        id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        firstName,
        middleName: middleName || undefined,
        lastName,
        employeeId: employeeId || undefined,
        hireDate: hireDate || undefined,
        employmentType: normalizedEmploymentType,
        phone,
        email: email || undefined,
        status: statusValue === 'inactive' ? 'inactive' : 'active',
        createdAt: now,
        updatedAt: now
      };

      newEmployees.push(newEmployee);
    }

    // Add all valid employees
    data.employees.push(...newEmployees);
    await writeEmployeesData(data);

    return NextResponse.json({
      message: `Successfully imported ${newEmployees.length} employees`,
      imported: newEmployees.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Failed to upload file:', error);
    return NextResponse.json(
      { error: 'Failed to process file upload' },
      { status: 500 }
    );
  }
}
