import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required', valid: false },
        { status: 400 }
      );
    }

    const isValid = password === process.env.INTERNAL_PWD;

    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error('Error validating password:', error);
    return NextResponse.json(
      { error: 'Failed to validate password', valid: false },
      { status: 500 }
    );
  }
}
