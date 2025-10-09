import { NextResponse } from 'next/server';
import { readSessionsData } from '@/lib/data';

export async function GET() {
  try {
    const data = await readSessionsData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
