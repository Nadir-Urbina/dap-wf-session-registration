import { NextResponse } from 'next/server';
import { readBiometricsData } from '@/lib/biometricsData';
import { hasBiometricsAccess } from '@/lib/biometricsAuth';

export async function GET(request: Request) {
  try {
    if (!hasBiometricsAccess(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
