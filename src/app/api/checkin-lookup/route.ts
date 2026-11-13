import { NextResponse } from 'next/server';
import { readEmployeesData } from '@/lib/employeeData';
import { readSessionsData } from '@/lib/data';
import { readBiometricsData } from '@/lib/biometricsData';
import { signUpMatchesEmployee } from '@/lib/registrationMatch';

// GET the Brown & Brown session and biometrics appointment times for one employee,
// so check-in staff can remind them. Returns only the times: the biometrics
// sign-up list itself stays behind the biometrics password.
export async function GET(request: Request) {
  try {
    const employeeId = new URL(request.url).searchParams.get('employeeId');
    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId is required' }, { status: 400 });
    }

    const [employeesData, sessionsData, biometricsData] = await Promise.all([
      readEmployeesData(),
      readSessionsData(),
      readBiometricsData()
    ]);

    const employee = employeesData.employees.find(e => e.id === employeeId);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const benefitsSession = sessionsData.sessions.find(session =>
      session.employees.some(signUp =>
        signUpMatchesEmployee(
          { name: signUp.fullName, email: signUp.email, phone: signUp.phone },
          employee
        )
      )
    );

    const biometricsSession = biometricsData.sessions.find(session =>
      session.registrations?.some(signUp =>
        signUpMatchesEmployee(
          { name: `${signUp.firstName} ${signUp.lastName}`, email: signUp.email, phone: signUp.phone },
          employee
        )
      )
    );

    return NextResponse.json({
      benefitsSession: benefitsSession
        ? { time: benefitsSession.time, spanishOnly: !!benefitsSession.spanishOnly }
        : null,
      biometricsSession: biometricsSession ? { time: biometricsSession.time } : null
    });
  } catch (error) {
    console.error('Failed to look up check-in sessions:', error);
    return NextResponse.json({ error: 'Failed to look up sessions' }, { status: 500 });
  }
}
