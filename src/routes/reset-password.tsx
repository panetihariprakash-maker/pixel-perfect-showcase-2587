import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { passwordValid } from '@/lib/auth-validation';
import { pageMeta } from '@/lib/metadata';
export const Route = createFileRoute('/reset-password')({ head: () => pageMeta('Reset Password', 'Securely reset your Azure Ridge guest account password.'), component: ResetPassword });
function ResetPassword() {
  const [recovery, setRecovery] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setRecovery(new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery'); supabase.auth.getSession().then(({ data }) => { if (data.session) setRecovery(true); }); }, []);
  return <section className="mx-auto max-w-lg px-4 py-16"><p className="eyebrow">Guest account</p><h1 className="mt-2 text-4xl">Set a new password</h1>{!recovery ? <p className="mt-6">Open the password reset link from your email. <Link to="/auth" className="text-primary underline">Request a new link</Link></p> : done ? <div className="mt-6"><p role="status">Your password has been updated.</p><Link to="/dashboard" className="btn btn-primary mt-4">Dashboard</Link></div> : <form className="mt-6 space-y-4" onSubmit={async e => { e.preventDefault(); if (!passwordValid(password)) { setMessage('Use at least 8 characters with uppercase, lowercase and a number.'); return; } if (password !== confirm) { setMessage('Passwords must match.'); return; } setBusy(true); const { error } = await supabase.auth.updateUser({ password }); setBusy(false); if (error) setMessage(error.message); else setDone(true); }}><label className="block text-sm">New password<input type="password" autoComplete="new-password" className="field mt-2" value={password} onChange={e => setPassword(e.target.value)} /></label><label className="block text-sm">Confirm password<input type="password" autoComplete="new-password" className="field mt-2" value={confirm} onChange={e => setConfirm(e.target.value)} /></label>{message && <p role="alert" className="text-sm text-destructive">{message}</p>}<Button disabled={busy} type="submit">{busy ? 'Updating…' : 'Update Password'}</Button></form>}</section>;
}