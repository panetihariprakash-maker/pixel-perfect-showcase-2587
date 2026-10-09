export const emailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
export const phoneValid = (value: string) => /^\+[1-9]\d{7,14}$/.test(value.replace(/[\s()-]/g, ''));
export const passwordValid = (value: string) => value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);
export function signupErrors(f: { name: string; email: string; mobile: string; password: string; confirm: string }) {
  const errors: Record<string, string> = {};
  if (f.name.trim().length < 2) errors.name = 'Enter your full name.';
  if (!emailValid(f.email)) errors.email = 'Enter a valid email address.';
  if (!phoneValid(f.mobile)) errors.mobile = 'Include a country code, for example +91, and a valid mobile number.';
  if (!passwordValid(f.password)) errors.password = 'Use at least 8 characters with uppercase, lowercase and a number.';
  if (f.confirm !== f.password || !f.confirm) errors.confirm = 'Passwords must match.';
  return errors;
}