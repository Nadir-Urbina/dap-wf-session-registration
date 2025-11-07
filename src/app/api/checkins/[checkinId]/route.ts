import { NextResponse } from 'next/server';
import { readCheckInsData, writeCheckInsData } from '@/lib/employeeData';

interface Params {
  params: Promise<{
    checkinId: string;
  }>;
}

// GET single check-in
export async function GET(request: Request, { params }: Params) {
  try {
    const { checkinId } = await params;
    const data = await readCheckInsData();
    const checkIn = data.checkIns.find(c => c.id === checkinId);

    if (!checkIn) {
      return NextResponse.json(
        { error: 'Check-in not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(checkIn);
  } catch (error) {
    console.error('Failed to fetch check-in:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-in' },
      { status: 500 }
    );
  }
}

// DELETE check-in (in case of error)
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { checkinId } = await params;
    const data = await readCheckInsData();
    const checkInIndex = data.checkIns.findIndex(c => c.id === checkinId);

    if (checkInIndex === -1) {
      return NextResponse.json(
        { error: 'Check-in not found' },
        { status: 404 }
      );
    }

    data.checkIns.splice(checkInIndex, 1);
    await writeCheckInsData(data);

    return NextResponse.json({ message: 'Check-in deleted successfully' });
  } catch (error) {
    console.error('Failed to delete check-in:', error);
    return NextResponse.json(
      { error: 'Failed to delete check-in' },
      { status: 500 }
    );
  }
}
