// The biometrics sign-up is run by two coordinators only, with its own password
// (BIOMETRICS_PWD). It stays locked if that variable is not set.
export const BIOMETRICS_PASSWORD_HEADER = 'x-biometrics-password';

export function hasBiometricsAccess(request: Request): boolean {
  const expected = process.env.BIOMETRICS_PWD;
  const password = request.headers.get(BIOMETRICS_PASSWORD_HEADER);
  return !!expected && password === expected;
}
