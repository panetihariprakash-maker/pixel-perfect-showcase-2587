import { createFileRoute } from '@tanstack/react-router';
import { AuthForm } from '@/components/AuthForm';
import { pageMeta } from '@/lib/metadata';
export const Route = createFileRoute('/sign-up')({ head: () => pageMeta('Create Account', 'Create your private Azure Ridge Sanctuary guest account.'), component: () => <AuthForm signup /> });