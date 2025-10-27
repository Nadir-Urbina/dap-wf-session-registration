export interface BiometricRegistration {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth: string; // Format: MM/DD/YYYY
}

export interface BiometricSession {
  id: string;
  time: string;
  registrations: BiometricRegistration[];
  maxCapacity: number;
}

export interface BiometricsData {
  eventDate: string;
  eventTitle: string;
  sessions: BiometricSession[];
}
