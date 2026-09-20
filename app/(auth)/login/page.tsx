import Link from 'next/link';
import AuthForm from '@/components/auth-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50 px-6 py-12">
      <div>
        <AuthForm mode="login" />
        <p className="mt-4 text-center text-sm text-stone-600">New here? <Link className="font-semibold text-rose-700" href="/signup">Create an account</Link></p>
      </div>
    </main>
  );
}
