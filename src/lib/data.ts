import { kv } from '@vercel/kv';
import { SessionsData } from '@/types';

const KV_KEY = 'sessions_data';

// Initial data structure
const initialData: SessionsData = {
  eventDate: "November 8, 2025",
  eventTitle: "Employee Benefits",
  sessions: [
    {
      id: "session-1015",
      time: "10:15 AM",
      employees: [],
      maxCapacity: 10
    },
    {
      id: "session-1045",
      time: "10:45 AM",
      employees: [],
      maxCapacity: 10
    },
    {
      id: "session-1115",
      time: "11:15 AM",
      employees: [],
      maxCapacity: 10
    },
    {
      id: "session-1145",
      time: "11:45 AM",
      employees: [],
      maxCapacity: 10
    },
    {
      id: "session-1215",
      time: "12:15 PM",
      employees: [],
      maxCapacity: 10
    },
    {
      id: "session-1245",
      time: "12:45 PM",
      employees: [],
      maxCapacity: 15,
      spanishOnly: true
    },
    {
      id: "session-115",
      time: "1:15 PM",
      employees: [],
      maxCapacity: 15,
      spanishOnly: true
    }
  ]
};

export async function readSessionsData(): Promise<SessionsData> {
  try {
    const data = await kv.get<SessionsData>(KV_KEY);

    // If no data exists, initialize with default data
    if (!data) {
      await kv.set(KV_KEY, initialData);
      return initialData;
    }

    return data;
  } catch (error) {
    console.error('Error reading sessions data:', error);
    throw new Error('Failed to read sessions data');
  }
}

export async function writeSessionsData(data: SessionsData): Promise<void> {
  try {
    await kv.set(KV_KEY, data);
  } catch (error) {
    console.error('Error writing sessions data:', error);
    throw new Error('Failed to write sessions data');
  }
}
