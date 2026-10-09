import { describe, expect, it } from 'vitest';
import { signupErrors, phoneValid, passwordValid } from '@/lib/auth-validation';
describe('Guest signup validation', () => {
  it('rejects missing required profile fields', () => { const errors = signupErrors({name:'', email:'', mobile:'', password:'', confirm:''}); expect(Object.keys(errors).sort()).toEqual(['confirm','email','mobile','name','password']); });
  it('requires a country code for mobile numbers', () => { expect(phoneValid('9876543210')).toBe(false); expect(phoneValid('+91 98765 43210')).toBe(true); });
  it('rejects weak passwords', () => { expect(passwordValid('weak')).toBe(false); expect(passwordValid('Mountain8')).toBe(true); });
  it('rejects mismatching passwords', () => { expect(signupErrors({name:'Guest Name',email:'guest@example.com',mobile:'+919876543210',password:'Mountain8',confirm:'Mountain9'}).confirm).toBeDefined(); });
  it('rejects invalid email addresses', () => { expect(signupErrors({name:'Guest Name',email:'not-an-email',mobile:'+919876543210',password:'Mountain8',confirm:'Mountain8'}).email).toBeDefined(); });
});