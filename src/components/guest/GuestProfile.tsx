import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { phoneValid } from '@/lib/auth-validation';

export function GuestProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['guest-profile', user?.id];
  const { data, isPending, error } = useQuery({ queryKey: key, enabled: !!user, queryFn: async () => { if (!user) return null; const { data, error } = await supabase.from('profiles').select('full_name,mobile,language').eq('id', user.id).single(); if (error) throw error; return data; } });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) { setName(data.full_name); setMobile(data.mobile); } }, [data]);
  if (isPending) return <p className="mt-3 text-sm">Loading your profile…</p>;
  if (error) return <p role="alert" className="mt-3 text-sm text-destructive">Unable to load your profile. Please refresh.</p>;
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg('');
    if (name.trim().length < 2) return setMsg('Enter your full name.');
    const phone = mobile.replace(/[\s()-]/g, '');
    if (phone && !phoneValid(phone)) return setMsg('Include a country code, for example +91, and a valid mobile number.');
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from('profiles').update({ full_name: name.trim(), mobile: phone }).eq('id', user.id);
    setBusy(false);
    if (error) return setMsg('Unable to save your profile. Please try again.');
    await qc.invalidateQueries({ queryKey: key });
    setEditing(false);
  };
  if (editing) return (
    <form onSubmit={save} className="mt-4 space-y-4 text-sm">
      <label className="block">Full name<input className="field mt-2" value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></label>
      <label className="block">Mobile number<input className="field mt-2" value={mobile} onChange={e => setMobile(e.target.value)} autoComplete="tel" placeholder="+91 98765 43210" /></label>
      {msg && <p role="alert" className="text-destructive">{msg}</p>}
      <div className="flex gap-2"><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button><Button type="button" variant="outline" onClick={() => { setEditing(false); setMsg(''); setName(data?.full_name ?? ''); setMobile(data?.mobile ?? ''); }}>Cancel</Button></div>
    </form>
  );
  return <div><dl className="mt-4 space-y-4 text-sm">{[['Full name', data?.full_name || 'Not provided'], ['Email', user?.email], ['Mobile number', data?.mobile || 'Not provided'], ['Preferred language', data?.language || 'English']].map(([label,value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="break-words font-medium">{value}</dd></div>)}</dl><Button variant="outline" className="mt-4" onClick={() => setEditing(true)}>Edit name & phone</Button></div>;
}
