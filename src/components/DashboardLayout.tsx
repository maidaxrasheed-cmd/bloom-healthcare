'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Logo } from './Logo';
import { Calendar, LayoutDashboard, Plug, Bell, Settings, LogOut, ChevronRight } from 'lucide-react';
import { getSession, getClinic, getAppointments, logout, tickReminders, type Clinic } from '@/lib/store';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.push('/login'); return; }

    getClinic(session.clinicId).then(async c => {
      if (!c) { router.push('/login'); return; }
      if (!c.onboardingComplete) { router.push('/onboarding'); return; }
      setClinic(c);

      // Run reminder "cron"
      void tickReminders();

      const refresh = async () => {
        const appts = await getAppointments(c.id);
        setNewCount(appts.filter(a => a.isNew).length);
      };
      refresh();
      const t = setInterval(() => { void tickReminders(); refresh(); }, 5000);
      return () => clearInterval(t);
    });
  }, [router, pathname]);

  if (!clinic) return <div className="min-h-screen flex items-center justify-center text-ink/50 text-sm">Loading…</div>;

  const items = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar, badge: newCount },
    { href: '/dashboard/channels', label: 'Channels', icon: Plug },
    { href: '/dashboard/reminders', label: 'Reminders', icon: Bell },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-cream">
      <aside className="w-64 bg-bone border-r border-sage-200/60 flex flex-col p-5 sticky top-0 h-screen">
        <div className="px-1 mb-10"><Logo size="md" /></div>

        <nav className="flex flex-col gap-0.5">
          {items.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg ft-base transition ${active ? 'bg-sage-700 text-cream' : 'text-ink/70 hover:bg-sage-100 hover:text-ink'}`}>
                <item.icon className="w-4 h-4" />
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${active ? 'bg-cream text-sage-700' : 'bg-accent text-cream'}`}>
                    {item.badge}
                  </span>
                ) : null}
                {active && <ChevronRight className="w-3.5 h-3.5" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <div className="bg-cream border border-sage-200 rounded-xl p-4 mb-3">
            <div className="ft-xs uppercase tracking-wider text-ink/50 font-mono mb-1">Trial</div>
            <div className="ft-base font-medium">{daysLeft(clinic.trialEndsAt)} days left</div>
            <div className="mt-2 h-1 bg-sage-100 rounded-full overflow-hidden">
              <div className="h-full bg-sage-500" style={{ width: `${Math.max(0, Math.min(100, (daysLeft(clinic.trialEndsAt) / 14) * 100))}%` }} />
            </div>
          </div>

          <div className="px-2 py-2">
            <div className="ft-xs text-ink/50 mb-0.5 truncate">{clinic.email}</div>
            <div className="text-sm font-medium truncate">{clinic.doctorName}</div>
          </div>
          <button onClick={() => { logout(); router.push('/'); }}
            className="w-full flex items-center gap-2 ft-xs text-ink/55 hover:text-ink transition px-3 py-2">
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function daysLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
