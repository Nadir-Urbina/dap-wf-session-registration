import { NextResponse } from 'next/server';
import { readBBAttendanceData, writeBBAttendanceData } from '@/lib/employeeData';

interface Params {
  params: Promise<{
    attendanceId: string;
  }>;
}

// DELETE an attendance record (in case someone was marked by mistake)
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { attendanceId } = await params;
    const data = await readBBAttendanceData();
    const index = data.attendees.findIndex(a => a.id === attendanceId);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    data.attendees.splice(index, 1);
    await writeBBAttendanceData(data);

    return NextResponse.json({ message: 'Attendance record removed' });
  } catch (error) {
    console.error('Failed to remove Brown & Brown attendance:', error);
    return NextResponse.json(
      { error: 'Failed to remove Brown & Brown attendance' },
      { status: 500 }
    );
  }
}
