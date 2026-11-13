import { EmployeeRecord } from '@/types/employee';

// Matches a session sign-up back to a roster employee. Sign-ups are typed in by hand
// (by employees or the recruiter), so emails are often missing and names vary
// (accents, extra surnames, middle names). A sign-up matches when any of these agree:
//   - email (case-insensitive)
//   - phone (last 10 digits)
//   - first name, plus any part of the last name, appear among the sign-up's name words

interface SignUp {
  name: string;
  email?: string;
  phone?: string;
}

const nameWords = (value: string | undefined): string[] =>
  (value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);

const phoneDigits = (value: string | undefined): string =>
  (value || '').replace(/\D/g, '').slice(-10);

export function signUpMatchesEmployee(signUp: SignUp, employee: EmployeeRecord): boolean {
  const employeeEmail = employee.email?.trim().toLowerCase();
  if (employeeEmail && signUp.email?.trim().toLowerCase() === employeeEmail) {
    return true;
  }

  const signUpPhone = phoneDigits(signUp.phone);
  if (signUpPhone.length === 10 && signUpPhone === phoneDigits(employee.phone)) {
    return true;
  }

  const signUpWords = nameWords(signUp.name);
  const [firstName] = nameWords(employee.firstName);
  const lastNames = nameWords(employee.lastName);
  return (
    !!firstName &&
    lastNames.length > 0 &&
    signUpWords.includes(firstName) &&
    lastNames.some(word => signUpWords.includes(word))
  );
}
