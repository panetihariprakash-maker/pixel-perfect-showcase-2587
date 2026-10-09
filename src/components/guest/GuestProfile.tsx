import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
export function GuestProfile() {
  const { user } = useAuth();
  const { data, isPending, error } = useQuery({ queryKey: ['guest-profile', user?.id], enabled: !!user, queryFn: async () => { if (!user) return null; const { data, error } = await supabase.from('profiles').select('full_name,mobile,language').eq('id', user.id).single(); if (error) throw error; return data; } });
  if (isPending) return <p className="mt-3 text-sm">Loading your profile…</p>;
  if (error) return <p role="alert" className="mt-3 text-sm text-destructive">Unable to load your profile. Please refresh.</p>;
  return <dl className="mt-4 space-y-4 text-sm">{[['Full name', data?.full_name || 'Not provided'], ['Email', user?.email], ['Mobile number', data?.mobile || 'Not provided'], ['Preferred language', data?.language || 'English']].map(([label,value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="break-words font-medium">{value}</dd></div>)}</dl>;
}