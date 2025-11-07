import { kv } from '@vercel/kv';
import { EmployeesData, CheckInsData } from '@/types/employee';

const EMPLOYEES_KV_KEY = 'employees_data';
const CHECKINS_KV_KEY = 'checkins_data';

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
