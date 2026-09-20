import Link from 'next/link';
import AuthForm from '@/components/auth-form';

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50 px-6 py-12">
      <div>
        <AuthForm mode="signup" />
        <p className="mt-4 text-center text-sm text-stone-600">Already registered? <Link className="font-semibold text-rose-700" href="/login">Sign in</Link></p>
      </div>
    </main>
  );
}
