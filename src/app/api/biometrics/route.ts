import { NextResponse } from 'next/server';
import { readBiometricsData } from '@/lib/biometricsData';

export async function GET() {
  try {
    const data = await readBiometricsData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching biometrics data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch biometrics data' },
      { status: 500 }
    );
  }
}
