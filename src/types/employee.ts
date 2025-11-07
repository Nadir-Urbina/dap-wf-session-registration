export interface EmployeeRecord {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  employeeId?: string;
  hireDate?: string;
  employmentType?: 'Hourly' | 'Salary' | 'Contract' | 'Part-Time' | '';
  phone: string;
  email?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CheckIn {
  id: string;
  employeeId: string;
  employeeName: string;
  checkInTime: string;
  foodTickets: number;
  notes?: string;
}

export interface EmployeesData {
  employees: EmployeeRecord[];
}

export interface CheckInsData {
  checkIns: CheckIn[];
}
