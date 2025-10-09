export interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  primaryLanguage: 'English' | 'Spanish';
}

export interface Session {
  id: string;
  time: string;
  employees: Employee[];
  maxCapacity: number;
}

export interface SessionsData {
  eventDate: string;
  eventTitle: string;
  sessions: Session[];
}
