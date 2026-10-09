import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Integration checks run only in the secured sandbox, never in the browser.
const url = process.env.SUPABASE_URL;
const admin = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const ready = !!url && !!admin && !!publicKey;
const accounts: { id: string; token: string }[] = [];
const reference = `AR-QA-${crypto.randomUUID()}`;
async function request(path: string, key: string, token: string, method = 'GET', body?: unknown) {
  return fetch(`${url}${path}`, { method, headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: body === undefined ? undefined : JSON.stringify(body) });
}
describe.skipIf(!ready)('Private guest data and payment integrity', () => {
  beforeAll(async () => {
    if (!admin || !publicKey) return;
    for (let i = 0; i < 2; i++) {
      const email = `azure-qa-${crypto.randomUUID()}@example.com`;
      const password = `Mountain8-${crypto.randomUUID()}`;
      const created = await request('/auth/v1/admin/users', admin, admin, 'POST', { email, password, email_confirm: true, user_metadata: { full_name: 'Privacy Test Guest', mobile: '+919876543210' } });
      expect(created.ok).toBe(true);
      const profile = await created.json();
      const signedIn = await request('/auth/v1/token?grant_type=password', publicKey, publicKey, 'POST', { email, password });
      expect(signedIn.ok).toBe(true);
      const session = await signedIn.json();
      accounts.push({ id: profile.id, token: session.access_token });
    }
  }, 30000);
  afterAll(async () => {
    if (!admin) return;
    for (const account of accounts) await request(`/auth/v1/admin/users/${account.id}`, admin, admin, 'DELETE');
  });
  it('creates the private full name and mobile profile at signup', async () => {
    const owner = accounts[0]; if (!owner || !publicKey) throw new Error('Test account unavailable');
    const res = await request(`/rest/v1/profiles?id=eq.${owner.id}&select=full_name,mobile`, publicKey, owner.token);
    expect(await res.json()).toEqual([{ full_name: 'Privacy Test Guest', mobile: '+919876543210' }]);
  });
  it('prevents a guest from reading another guest profile', async () => {
    const [owner, other] = accounts; if (!owner || !other || !publicKey) throw new Error('Test accounts unavailable');
    const res = await request(`/rest/v1/profiles?id=eq.${owner.id}&select=id`, publicKey, other.token);
    expect(await res.json()).toEqual([]);
  });
  it('keeps another guest’s booking and payment information private', async () => {
    const [owner, other] = accounts; if (!owner || !other || !publicKey) throw new Error('Test accounts unavailable');
    const details = { id: reference, guestId: owner.id, payment: 'Payment Ready/Test', status: 'Pending' };
    const insert = await request('/rest/v1/guest_bookings', publicKey, owner.token, 'POST', { id: reference, user_id: owner.id, details });
    expect(insert.ok).toBe(true);
    const readOwn = await request(`/rest/v1/guest_bookings?id=eq.${reference}`, publicKey, owner.token);
    expect((await readOwn.json()).length).toBe(1);
    const readOther = await request(`/rest/v1/guest_bookings?id=eq.${reference}`, publicKey, other.token);
    expect(await readOther.json()).toEqual([]);
  });
  it('does not allow a guest to assign staff roles', async () => {
    const owner = accounts[0]; if (!owner || !publicKey) throw new Error('Test account unavailable');
    const res = await request('/rest/v1/user_roles', publicKey, owner.token, 'POST', { user_id: owner.id, role: 'operations' });
    expect(res.ok).toBe(false);
  });
  it('rejects a guest marking a test booking as paid', async () => {
    const owner = accounts[0]; if (!owner || !publicKey) throw new Error('Test account unavailable');
    const res = await request(`/rest/v1/guest_bookings?id=eq.${reference}`, publicKey, owner.token, 'PATCH', { details: { id: reference, guestId: owner.id, payment: 'Paid', status: 'Pending' } });
    expect(res.ok).toBe(false);
  });
});