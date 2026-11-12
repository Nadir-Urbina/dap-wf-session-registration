import { kv } from '@vercel/kv';
import { EmployeesData, CheckInsData, BBAttendanceData } from '@/types/employee';

const EMPLOYEES_KV_KEY = 'employees_data';
const CHECKINS_KV_KEY = 'checkins_data';
const BB_ATTENDANCE_KV_KEY = 'bb_friday_attendance';

// Initial employee data structure
const initialEmployeesData: EmployeesData = {
  employees: []
};

// Initial check-ins data structure
const initialCheckInsData: CheckInsData = {
  checkIns: []
};

// Employee CRUD operations
export async function readEmployeesData(): Promise<EmployeesData> {
  try {
    const data = await kv.get<EmployeesData>(EMPLOYEES_KV_KEY);

    if (!data) {
      await kv.set(EMPLOYEES_KV_KEY, initialEmployeesData);
      return initialEmployeesData;
    }

    return data;
  } catch (error) {
    console.error('Error reading employees data:', error);
    throw new Error('Failed to read employees data');
  }
}

export async function writeEmployeesData(data: EmployeesData): Promise<void> {
  try {
    await kv.set(EMPLOYEES_KV_KEY, data);
  } catch (error) {
    console.error('Error writing employees data:', error);
    throw new Error('Failed to write employees data');
  }
}

// Check-in CRUD operations
export async function readCheckInsData(): Promise<CheckInsData> {
  try {
    const data = await kv.get<CheckInsData>(CHECKINS_KV_KEY);

    if (!data) {
      await kv.set(CHECKINS_KV_KEY, initialCheckInsData);
      return initialCheckInsData;
    }

    return data;
  } catch (error) {
    console.error('Error reading check-ins data:', error);
    throw new Error('Failed to read check-ins data');
  }
}

export async function writeCheckInsData(data: CheckInsData): Promise<void> {
  try {
    await kv.set(CHECKINS_KV_KEY, data);
  } catch (error) {
    console.error('Error writing check-ins data:', error);
    throw new Error('Failed to write check-ins data');
  }
}

// Friday Brown & Brown session attendance
export async function readBBAttendanceData(): Promise<BBAttendanceData> {
  try {
    const data = await kv.get<BBAttendanceData>(BB_ATTENDANCE_KV_KEY);
    return data ?? { attendees: [] };
  } catch (error) {
    console.error('Error reading Brown & Brown attendance data:', error);
    throw new Error('Failed to read Brown & Brown attendance data');
  }
}

export async function writeBBAttendanceData(data: BBAttendanceData): Promise<void> {
  try {
    await kv.set(BB_ATTENDANCE_KV_KEY, data);
  } catch (error) {
    console.error('Error writing Brown & Brown attendance data:', error);
    throw new Error('Failed to write Brown & Brown attendance data');
  }
}
