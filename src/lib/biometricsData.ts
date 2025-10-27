import { kv } from '@vercel/kv';
import { BiometricsData } from '@/types/biometrics';

const KV_KEY = 'biometrics_data';

// Generate time slots from 10:00 AM to 1:45 PM every 15 minutes
function generateBiometricSessions() {
  const sessions = [];
  const startHour = 10;
  const startMinute = 0;
  const endHour = 13; // 1 PM in 24-hour format
  const endMinute = 45;

  let currentHour = startHour;
  let currentMinute = startMinute;
  let sessionNumber = 1;

  while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
    const hour12 = currentHour > 12 ? currentHour - 12 : currentHour;
    const period = currentHour >= 12 ? 'PM' : 'AM';
    const timeString = `${hour12}:${currentMinute.toString().padStart(2, '0')} ${period}`;
    const idString = `${currentHour}${currentMinute.toString().padStart(2, '0')}`;

    sessions.push({
      id: `biometric-session-${idString}`,
      time: timeString,
      registrations: [],
      maxCapacity: 6
    });

    // Add 15 minutes
    currentMinute += 15;
    if (currentMinute >= 60) {
      currentMinute = 0;
      currentHour += 1;
    }

    sessionNumber++;
  }

  return sessions;
}

// Initial data structure
const initialData: BiometricsData = {
  eventDate: "November 8, 2025",
  eventTitle: "Biometric Exams",
  sessions: generateBiometricSessions()
};

export async function readBiometricsData(): Promise<BiometricsData> {
  try {
    const data = await kv.get<BiometricsData>(KV_KEY);

    // If no data exists, initialize with default data
    if (!data) {
      await kv.set(KV_KEY, initialData);
      return initialData;
    }

    return data;
  } catch (error) {
    console.error('Error reading biometrics data:', error);
    throw new Error('Failed to read biometrics data');
  }
}

export async function writeBiometricsData(data: BiometricsData): Promise<void> {
  try {
    await kv.set(KV_KEY, data);
  } catch (error) {
    console.error('Error writing biometrics data:', error);
    throw new Error('Failed to write biometrics data');
  }
}
