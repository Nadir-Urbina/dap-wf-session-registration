import { promises as fs } from 'fs';
import path from 'path';
import { SessionsData } from '@/types';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'sessions.json');

export async function readSessionsData(): Promise<SessionsData> {
  try {
    const fileContents = await fs.readFile(dataFilePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error reading sessions data:', error);
    throw new Error('Failed to read sessions data');
  }
}

export async function writeSessionsData(data: SessionsData): Promise<void> {
  try {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing sessions data:', error);
    throw new Error('Failed to write sessions data');
  }
}
