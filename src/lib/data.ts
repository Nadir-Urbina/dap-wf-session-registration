import { kv } from '@vercel/kv';
import { SessionsData } from '@/types';

const KV_KEY = 'sessions_data';

// Initial data structure
const initialData: SessionsData = {
  eventDate: "",
  eventTitle: "Employee Benefits",
  sessions: [
    {
      id: "session-1000",
      time: "10:00 AM",
      employees: [],
      maxCapacity: 10
    },
    {
      id: "session-1030",
      time: "10:30 AM",
      employees: [],
      maxCapacity: 10
    },
    {
      id: "session-1100",
      time: "11:00 AM",
      employees: [],
      maxCapacity: 10
    },
    {
      id: "session-1130",
      time: "11:30 AM",
      employees: [],
      maxCapacity: 10
    },
    {
      id: "session-1200",
      time: "12:00 PM",
      employees: [],
      maxCapacity: 10
    },
    {
      id: "session-1230",
      time: "12:30 PM",
      employees: [],
      maxCapacity: 10
    },
    {
      id: "session-100",
      time: "1:00 PM",
      employees: [],
      maxCapacity: 15,
      spanishOnly: true
    },
    {
      id: "session-130",
      time: "1:30 PM",
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
