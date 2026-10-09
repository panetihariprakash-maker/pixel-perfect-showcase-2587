import { createFileRoute } from '@tanstack/react-router';
import { AuthForm } from '@/components/AuthForm';
import { pageMeta } from '@/lib/metadata';
export const Route = createFileRoute('/auth')({ head: () => pageMeta('Sign In', 'Sign in securely to manage your Azure Ridge guest account and stay.'), component: () => <AuthForm /> });