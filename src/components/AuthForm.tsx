import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Eye, EyeOff, Mountain, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui-kit';
import { emailValid, signupErrors } from '@/lib/auth-validation';
import { useAuth } from '@/lib/auth';

export function AuthForm({ signup = false }: { signup?: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [f, setF] = useState({ name: '', email: '', mobile: '', password: '', confirm: '' });
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  useEffect(() => { if (user) navigate({ to: '/dashboard', replace: true }); }, [user, navigate]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage('');
    const next = forgot ? (emailValid(f.email) ? {} : { email: 'Enter a valid email address.' }) : signup ? signupErrors(f) : { ...(!emailValid(f.email) ? { email: 'Enter a valid email address.' } : {}), ...(!f.password ? { password: 'Enter your password.' } : {}) };
    setErrors(next); if (Object.keys(next).length) return;
    setBusy(true);
    try {
      if (forgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(f.email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setMessage('If an account exists, a password reset link has been sent. Check your email.');
      } else if (signup) {
        const { data, error } = await supabase.auth.signUp({ email: f.email.trim(), password: f.password, options: { emailRedirectTo: `${window.location.origin}/auth`, data: { full_name: f.name.trim(), mobile: f.mobile.replace(/[\s()-]/g, '') } } });
        if (error) throw error;
        if (data.session) await navigate({ to: '/dashboard', replace: true });
        else setMessage('Check your email to confirm your account before signing in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
        if (error) throw error;
        await navigate({ to: '/dashboard', replace: true });
      }
    } catch (error) { setErrors({ form: error instanceof Error ? error.message : 'Unable to continue. Please try again.' }); }
    finally { setBusy(false); }
  };
  const google = async () => {
    setErrors({}); setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: `${window.location.origin}/auth` });
      if (result.error) { setErrors({ form: 'Google sign-in is currently unavailable. Please use email sign-in or contact the resort.' }); return; }
      if (result.redirected) return;
      const { data } = await supabase.auth.getUser();
      if (data.user) await navigate({ to: '/dashboard', replace: true });
      else setErrors({ form: 'Google sign-in did not complete. Please try again.' });
    } catch { setErrors({ form: 'Google sign-in is unavailable. Please use email sign-in.' }); }
    finally { setBusy(false); }
  };
  const field = (key: keyof typeof f, label: string, type = 'text') => (
    <Field key={key} htmlFor={`auth-${key}`} label={label} error={errors[key]}>
      <div className="relative">
        <input id={`auth-${key}`} className={`field ${type === 'password' ? 'pr-12' : ''}`} type={type === 'password' && visible[key] ? 'text' : type} value={f[key]} onChange={e => setF({ ...f, [key]: e.target.value })} aria-invalid={!!errors[key]} autoComplete={key === 'password' ? signup ? 'new-password' : 'current-password' : key === 'confirm' ? 'new-password' : key === 'mobile' ? 'tel' : key} placeholder={key === 'mobile' ? '+91 98765 43210' : undefined} />
        {type === 'password' && <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-0.5" aria-label={`${visible[key] ? 'Hide' : 'Show'} ${label.toLowerCase()}`} onClick={() => setVisible({ ...visible, [key]: !visible[key] })}>{visible[key] ? <EyeOff /> : <Eye />}</Button>}
      </div>
    </Field>
  );
  return (
    <section className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      <div className="mb-8 text-center"><Mountain className="mx-auto mb-4 h-8 w-8 text-primary" /><p className="eyebrow">The Azure Ridge Sanctuary</p><h1 className="mt-3 text-4xl font-semibold">{forgot ? 'Reset your password' : signup ? 'Begin your next escape' : 'Welcome back'}</h1><p className="mt-3 text-sm text-muted-foreground">{forgot ? 'A fresh start for your guest account.' : signup ? 'Create your private guest account.' : 'Your sanctuary is waiting.'}</p></div>
      <form noValidate onSubmit={submit} className="space-y-5 rounded-lg border bg-card p-6 shadow-card sm:p-8">
        {signup && !forgot && field('name', 'Full Name')}
        {field('email', 'Email Address', 'email')}
        {signup && !forgot && field('mobile', 'Mobile Number with country code', 'tel')}
        {!forgot && field('password', 'Password', 'password')}
        {signup && !forgot && field('confirm', 'Confirm Password', 'password')}
        {!signup && !forgot && <Button type="button" variant="link" className="h-auto px-0" onClick={() => { setForgot(true); setErrors({}); }}>Forgot Password?</Button>}
        {errors.form && <p role="alert" className="text-sm text-destructive">{errors.form}</p>}
        {message && <p role="status" className="text-sm text-success">{message}</p>}
        <Button type="submit" disabled={busy} className="h-11 w-full rounded-full">{busy ? 'Please wait…' : forgot ? 'Send reset link' : signup ? 'Create Account' : 'Sign In'}<ArrowRight /></Button>
        {!forgot && <><div className="flex items-center gap-4 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />OR<span className="h-px flex-1 bg-border" /></div><Button type="button" variant="outline" className="h-11 w-full rounded-full" onClick={google} disabled={busy}><span className="font-bold" aria-hidden="true">G</span>Continue with Google</Button></>}
        <p className="text-center text-sm text-muted-foreground">{forgot ? <Button type="button" variant="link" onClick={() => { setForgot(false); setErrors({}); setMessage(''); }}>Back to Sign In</Button> : signup ? <>Already have an account? <Link to="/auth" className="font-semibold text-primary">Sign In</Link></> : <>New to the Sanctuary? <Link to="/sign-up" className="font-semibold text-primary">Create Account</Link></>}</p>
      </form>
      <div className="mt-6 flex justify-center gap-5 text-xs text-muted-foreground"><Link to="/">Back to Home</Link><Link to="/policies">Policies & FAQs</Link></div>
    </section>
  );
}