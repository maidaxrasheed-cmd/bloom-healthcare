'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getSession, getClinic, getRemindersForClinic, getAppointment, type Reminder, type Clinic } from '@/lib/store';
import { Check, Clock, Bell, Mail, MessageCircle, Instagram, Globe, Facebook, PencilLine } from 'lucide-react';

const channelIcons: any = {
  instagram: Instagram, whatsapp: MessageCircle, facebook: Facebook,
  website: Globe, email: Mail, manual: PencilLine,
};

export default function RemindersPage() {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [tab, setTab] = useState<'all' | 'sent' | 'pending'>('all');

  useEffect(() => {
    const session = getSession(); if (!session) return;
    const c = getClinic(session.clinicId); if (!c) return;
    setClinic(c);
    setReminders(getRemindersForClinic(c.id));
  }, []);

  if (!clinic) return <DashboardLayout><div /></DashboardLayout>;

  const filtered = reminders.filter(r => tab === 'all' || r.status === tab);
  const sent = reminders.filter(r => r.status === 'sent').length;
  const pending = reminders.filter(r => r.status === 'pending').length;

  return (
    <DashboardLayout>
      <div className="p-8 md:p-12 max-w-5xl mx-auto w-full">
        <p className="ft-xs uppercase tracking-widest text-sage-700 font-mono mb-2">Reminders</p>
        <h1 className="font-display text-4xl md:text-5xl mb-3">The patient whisper.</h1>
        <p className="text-ink/65 mb-10">Three reminders are queued for every appointment — automatically.</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card label="Sent" value={sent} icon={Check} />
          <Card label="Queued" value={pending} icon={Clock} />
          <Card label="Per appointment" value={3} icon={Bell} />
        </div>

        <div className="flex gap-2 mb-5">
          {(['all','pending','sent'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs uppercase tracking-wider font-mono rounded-full transition ${tab === t ? 'bg-sage-700 text-cream' : 'bg-bone border border-sage-200 text-ink/65'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="bg-bone border border-sage-200 rounded-2xl divide-y divide-sage-200/50">
          {filtered.length === 0 ? (
            <div className="p-12 text-center ft-base text-ink/55">No reminders here yet.</div>
          ) : filtered.map(r => {
            const appt = getAppointment(r.appointmentId);
            const Icon = channelIcons[r.channel];
            return (
              <div key={r.id} className="p-5 flex items-start gap-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${r.status === 'sent' ? 'bg-sage-700 text-cream' : 'bg-amber-100 text-amber-700'}`}>
                  {r.status === 'sent' ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="ft-xs uppercase tracking-wider font-mono text-ink/55">
                      {r.stage === 'confirmation' ? 'Confirmation' : r.stage === 'midway' ? 'Midway nudge' : 'Day-of'}
                    </span>
                    <span className="text-ink/30">·</span>
                    <span className="ft-xs text-ink/65">for <strong className="text-ink/85">{appt?.patientName}</strong></span>
                    <span className="text-ink/30">·</span>
                    <span className="inline-flex items-center gap-1 ft-xs text-ink/55">
                      <Icon className="w-3 h-3" /> via {r.channel}
                    </span>
                  </div>
                  <p className="ft-base text-ink/80 leading-relaxed">{r.message}</p>
                  <div className="ft-xs text-ink/50 mt-1.5 font-mono">
                    {r.status === 'sent'
                      ? `sent ${new Date(r.sentAt!).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                      : `scheduled ${new Date(r.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

function Card({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="bg-bone border border-sage-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="ft-xs uppercase tracking-wider font-mono text-ink/50">{label}</span>
        <Icon className="w-4 h-4 text-sage-700" />
      </div>
      <div className="font-display text-4xl">{value}</div>
    </div>
  );
}
