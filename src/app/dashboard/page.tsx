'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getSession, getClinic, getAppointments, getRemindersForClinic, type Appointment, type Clinic } from '@/lib/store';
import { Calendar, TrendingUp, Bell, Users, ArrowUpRight, Instagram, MessageCircle, Globe, Mail, Facebook, PencilLine } from 'lucide-react';

const channelIcons: any = {
  instagram: Instagram, whatsapp: MessageCircle, facebook: Facebook,
  website: Globe, email: Mail, manual: PencilLine,
};

export default function DashboardHome() {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [reminderCount, setReminderCount] = useState({ sent: 0, pending: 0 });

  useEffect(() => {
    const session = getSession();
    if (!session) return;
    getClinic(session.clinicId).then(async c => {
      if (!c) return;
      setClinic(c);
      const a = await getAppointments(c.id);
      setAppts(a);
      const rems = await getRemindersForClinic(c.id);
      setReminderCount({
        sent: rems.filter(r => r.status === 'sent').length,
        pending: rems.filter(r => r.status === 'pending').length,
      });
    });
  }, []);

  if (!clinic) return <DashboardLayout><div /></DashboardLayout>;

  const now = new Date();
  const todayAppts = appts.filter(a => sameDay(new Date(a.scheduledFor), now));
  const upcomingAppts = appts.filter(a => new Date(a.scheduledFor) > now).slice(0, 5);
  const newCount = appts.filter(a => a.isNew).length;

  return (
    <DashboardLayout>
      <div className="p-8 md:p-12 max-w-6xl mx-auto w-full">
        <div className="mb-10">
          <p className="ft-xs uppercase tracking-widest text-sage-700 font-mono mb-2">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="font-display ft-3xl leading-tight">
            Good {greeting()}, <em className="italic font-light text-sage-700">{clinic.doctorName.split(' ')[0]}.</em>
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <Stat label="Today" value={todayAppts.length} sub="appointments" icon={Calendar} />
          <Stat label="New bookings" value={newCount} sub="since last visit" icon={Bell} accent />
          <Stat label="Reminders sent" value={reminderCount.sent} sub={`${reminderCount.pending} queued`} icon={TrendingUp} />
          <Stat label="Total patients" value={new Set(appts.map(a => a.patientPhone)).size} sub="unique" icon={Users} />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-bone border border-sage-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display ft-xl">Upcoming appointments</h2>
              <Link href="/dashboard/appointments" className="ft-sm text-sage-700 hover:text-sage-800 inline-flex items-center gap-1">
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {upcomingAppts.length === 0 ? (
              <EmptyAppointments />
            ) : (
              <div className="space-y-2">
                {upcomingAppts.map(a => {
                  const Icon = channelIcons[a.channel];
                  return (
                    <div key={a.id} className="flex items-center gap-4 bg-cream border border-sage-200 rounded-lg p-4">
                      <div className="w-11 h-11 rounded-full bg-sage-700 text-cream flex items-center justify-center font-medium ft-sm flex-shrink-0">
                        {a.patientName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="ft-base font-medium truncate">{a.patientName}</span>
                          {a.isNew && <span className="ft-xs uppercase tracking-wider bg-accent text-cream px-1.5 py-0.5 rounded font-mono">new</span>}
                        </div>
                        <div className="ft-sm text-ink/60 mt-0.5">{a.service} · {formatWhen(a.scheduledFor)}</div>
                      </div>
                      {Icon && <Icon className="w-4 h-4 text-ink/50 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="bg-sage-700 text-cream rounded-2xl p-6">
              <h3 className="font-display ft-xl mb-2">Share your link</h3>
              <p className="ft-sm text-cream/70 mb-4">Patients can book themselves — anywhere you can paste a URL.</p>
              <Link href="/dashboard/channels" className="ft-sm underline underline-offset-4 hover:text-cream">
                View booking link →
              </Link>
            </div>
            <div className="bg-bone border border-sage-200 rounded-2xl p-6">
              <h3 className="font-display ft-lg mb-3">Channel mix</h3>
              <ChannelBreakdown appts={appts} />
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Stat({ label, value, sub, icon: Icon, accent }: { label: string; value: number; sub: string; icon: any; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ${accent ? 'bg-sage-700 text-cream' : 'bg-bone border border-sage-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <span className={`ft-xs uppercase tracking-wider font-mono ${accent ? 'text-cream/60' : 'text-ink/50'}`}>{label}</span>
        <Icon className={`w-4 h-4 ${accent ? 'text-cream/60' : 'text-sage-700'}`} />
      </div>
      <div className="font-display ft-stat mb-1 leading-none">{value}</div>
      <div className={`ft-sm ${accent ? 'text-cream/70' : 'text-ink/55'}`}>{sub}</div>
    </div>
  );
}

function ChannelBreakdown({ appts }: { appts: Appointment[] }) {
  const counts: Record<string, number> = {};
  for (const a of appts) counts[a.channel] = (counts[a.channel] || 0) + 1;
  const max = Math.max(1, ...Object.values(counts));
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <p className="ft-sm text-ink/55">No bookings yet.</p>;
  return (
    <div className="space-y-3">
      {entries.map(([ch, n]) => {
        const Icon = channelIcons[ch];
        return (
          <div key={ch}>
            <div className="flex items-center gap-2 ft-sm mb-1">
              {Icon && <Icon className="w-3.5 h-3.5 text-sage-700" />}
              <span className="flex-1 capitalize">{ch}</span>
              <span className="font-mono text-ink/60">{n}</span>
            </div>
            <div className="h-1.5 bg-sage-100 rounded-full overflow-hidden">
              <div className="h-full bg-sage-500" style={{ width: `${(n / max) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyAppointments() {
  return (
    <div className="text-center py-10">
      <Calendar className="w-10 h-10 text-sage-300 mx-auto mb-3" />
      <p className="ft-base text-ink/60 mb-1">No upcoming appointments yet.</p>
      <Link href="/dashboard/appointments" className="ft-sm text-sage-700 underline underline-offset-4">Create one manually →</Link>
    </div>
  );
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((d.getTime() - now.getTime()) / (86400000));
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (sameDay(d, now)) return `Today · ${time}`;
  if (days === 0 || days === 1) return `Tomorrow · ${time}`;
  if (days < 7) return `${d.toLocaleDateString('en-US', { weekday: 'short' })} · ${time}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${time}`;
}
