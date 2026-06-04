'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { createClinic, getClinicByEmail, login } from '@/lib/store';
import { ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', doctorName: '', email: '', phone: '',
    specialty: 'General Practice', password: '',
  });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setLoading(true);

    if (!form.name || !form.doctorName || !form.email || !form.password) {
      setErr('Please fill all required fields'); setLoading(false); return;
    }
    if (form.password.length < 6) {
      setErr('Password must be at least 6 characters'); setLoading(false); return;
    }

    try {
      const existing = await getClinicByEmail(form.email);
      if (existing) {
        setErr('An account with this email already exists'); setLoading(false); return;
      }
      const clinic = await createClinic(form);
      login(clinic.id);
      router.push('/onboarding');
    } catch (e: any) {
      setErr('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex">
      {/* Left — form */}
      <div className="flex-1 flex flex-col px-6 md:px-12 lg:px-20 py-8">
        <Link href="/"><Logo /></Link>
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="w-full max-w-md">
            <p className="text-xs uppercase tracking-widest text-sage-700 font-mono mb-3">Start your trial</p>
            <h1 className="font-display text-4xl md:text-5xl leading-tight mb-3">Bring your <em className="italic font-light text-sage-700">clinic</em> to Bloom.</h1>
            <p className="text-ink/65 mb-10">14 days free. No card. Cancel anytime.</p>
            <form onSubmit={submit} className="space-y-4">
              <Field label="Clinic name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Aurora Family Clinic" />
              <Field label="Your name (the doctor)" value={form.doctorName} onChange={v => setForm({ ...form, doctorName: v })} placeholder="Dr. Sarah Khan" />
              <Field label="Email" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="you@clinic.com" />
              <Field label="Phone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="+92 300 0000000" />
              <div>
                <label className="block text-xs uppercase tracking-wider text-ink/50 mb-1.5 font-mono">Specialty</label>
                <select value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })}
                  className="w-full bg-bone border border-sage-200 rounded-lg px-4 py-3 text-sm focus:border-sage-500 focus:outline-none transition">
                  {['General Practice','Dentistry','Dermatology','Pediatrics','Gynecology','Cardiology','ENT','Orthopedics','Psychiatry','Other'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <Field label="Password" type="password" value={form.password} onChange={v => setForm({ ...form, password: v })} placeholder="At least 6 characters" />
              {err && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
              <button type="submit" disabled={loading}
                className="btn-lift w-full bg-sage-700 text-cream rounded-full py-3.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? 'Creating account…' : <><span>Create account</span> <ArrowRight className="w-4 h-4" /></>}
              </button>
              <p className="text-xs text-center text-ink/55 mt-4">
                Already have one? <Link href="/login" className="text-sage-700 underline underline-offset-4">Log in</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
      {/* Right — visual */}
      <div className="hidden lg:flex flex-1 bg-sage-700 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.4), transparent 50%)' }} />
        <div className="relative max-w-md text-cream">
          <blockquote className="font-display text-3xl leading-snug italic font-light">
            "We went from 15 no-shows a week to 3. The reminders just… work."
          </blockquote>
          <div className="mt-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cream/20 flex items-center justify-center text-cream font-medium">A</div>
            <div>
              <p className="font-medium">Dr. Ayesha N.</p>
              <p className="text-sm text-cream/60">Karachi Dermatology</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, type='text', value, onChange, placeholder }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-ink/50 mb-1.5 font-mono">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-bone border border-sage-200 rounded-lg px-4 py-3 text-sm focus:border-sage-500 focus:outline-none transition" />
    </div>
  );
}
