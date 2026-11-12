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
  // Set when the employee attended a Friday Brown & Brown session and got raffle tickets at this check-in
  fridayBBAttended?: boolean;
}

// Attendance at a Friday Brown & Brown benefits session (earns raffle tickets at Saturday check-in)
export interface BBAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  attendedAt: string;
}

export interface EmployeesData {
  employees: EmployeeRecord[];
}

export interface CheckInsData {
  checkIns: CheckIn[];
}

export interface BBAttendanceData {
  attendees: BBAttendance[];
}
