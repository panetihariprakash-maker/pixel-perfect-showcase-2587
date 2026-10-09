import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';
export interface GuestAuth { user: User | null; loading: boolean }
export const GuestAuthContext = createContext<GuestAuth>({ user: null, loading: true });
export const useAuth = () => useContext(GuestAuthContext);