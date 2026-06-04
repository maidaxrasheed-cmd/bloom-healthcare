'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { getClinicByEmail, verifyPassword, login } from '@/lib/store';
import { ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const clinic = await getClinicByEmail(email);
      if (!clinic || !verifyPassword(clinic, password)) {
        setErr('Wrong email or password');
        setLoading(false);
        return;
      }
      login(clinic.id);
      router.push(clinic.onboardingComplete ? '/dashboard' : '/onboarding');
    } catch (e) {
      setErr('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const useDemo = async () => {
    setLoading(true);
    const clinic = await getClinicByEmail('demo@bloom.com');
    if (clinic) {
      login(clinic.id);
      router.push('/dashboard');
    } else {
      setErr('Demo account not found.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-block mb-12"><Logo /></Link>
        <p className="text-xs uppercase tracking-widest text-sage-700 font-mono mb-3">Welcome back</p>
        <h1 className="font-display text-4xl mb-8">Log in.</h1>
        <button onClick={useDemo} disabled={loading}
          className="btn-lift w-full bg-bone border border-sage-200 rounded-lg py-3 text-sm mb-6 hover:border-sage-500 transition disabled:opacity-50">
          Use demo account — <span className="text-sage-700 font-medium">demo@bloom.com</span>
        </button>
        <div className="flex items-center gap-3 mb-6 text-xs text-ink/40">
          <div className="flex-1 h-px bg-sage-200" /> or use yours <div className="flex-1 h-px bg-sage-200" />
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink/50 mb-1.5 font-mono">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-bone border border-sage-200 rounded-lg px-4 py-3 text-sm focus:border-sage-500 focus:outline-none transition" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink/50 mb-1.5 font-mono">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-bone border border-sage-200 rounded-lg px-4 py-3 text-sm focus:border-sage-500 focus:outline-none transition" />
          </div>
          {err && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
          <button type="submit" disabled={loading}
            className="btn-lift w-full bg-sage-700 text-cream rounded-full py-3.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? 'Logging in…' : <><span>Log in</span> <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
        <p className="text-xs text-center text-ink/55 mt-6">
          No account? <Link href="/signup" className="text-sage-700 underline underline-offset-4">Start a trial</Link>
        </p>
      </div>
    </main>
  );
}
