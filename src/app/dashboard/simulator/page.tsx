'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getSession, getClinic, createAppointment, type Clinic, type Channel } from '@/lib/store';
import { Instagram, MessageCircle, Mail, Facebook, Globe, Sparkles, Check } from 'lucide-react';

const samplePatients = [
  { name: 'Hassan Ahmed', phone: '+92 321 4567890', email: 'hassan@example.com' },
  { name: 'Mariam Iqbal', phone: '+92 333 9876543', email: 'mariam@example.com' },
  { name: 'Ali Raza', phone: '+92 312 1112233', email: 'ali@example.com' },
  { name: 'Zainab Sheikh', phone: '+92 345 4445566', email: 'zainab@example.com' },
  { name: 'Omar Farooq', phone: '+92 322 7778899', email: 'omar@example.com' },
];

export default function SimulatorPage() {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [flash, setFlash] = useState('');

  useEffect(() => {
    const session = getSession(); if (!session) return;
    const c = getClinic(session.clinicId); if (!c) return;
    setClinic(c);
  }, []);

  if (!clinic) return <DashboardLayout><div /></DashboardLayout>;

  const simulate = (channel: Channel) => {
    const p = samplePatients[Math.floor(Math.random() * samplePatients.length)];
    const svc = clinic.services[Math.floor(Math.random() * clinic.services.length)];
    if (!svc) { setFlash('Add services first in Settings'); return; }
    const d = new Date();
    d.setDate(d.getDate() + 1 + Math.floor(Math.random() * 7));
    d.setHours(10 + Math.floor(Math.random() * 7), Math.random() > 0.5 ? 30 : 0, 0, 0);
    createAppointment({
      clinicId: clinic.id,
      patientName: p.name,
      patientPhone: p.phone,
      patientEmail: p.email,
      service: svc.name,
      scheduledFor: d.toISOString(),
      durationMin: svc.durationMin,
      channel,
      notes: `Simulated booking via ${channel}`,
    });
    setFlash(`${p.name} just booked via ${channel}!`);
    setTimeout(() => setFlash(''), 2500);
  };

  const channels: { channel: Channel; icon: any; name: string; copy: string }[] = [
    { channel: 'website', icon: Globe, name: 'Website widget', copy: 'Patient filled the form on your site.' },
    { channel: 'whatsapp', icon: MessageCircle, name: 'WhatsApp', copy: 'Patient sent a WhatsApp message.' },
    { channel: 'instagram', icon: Instagram, name: 'Instagram DM', copy: 'Patient slid into your DMs.' },
    { channel: 'facebook', icon: Facebook, name: 'Facebook Messenger', copy: 'Patient messaged your FB page.' },
    { channel: 'email', icon: Mail, name: 'Email', copy: 'Patient emailed to book.' },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 md:p-12 max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-200 text-amber-800 rounded-full px-3 py-1 text-xs mb-4">
          <Sparkles className="w-3 h-3" /> Demo tool · hide for production
        </div>
        <h1 className="font-display text-4xl md:text-5xl mb-3">Live demo simulator</h1>
        <p className="text-ink/65 mb-10">Click any channel to simulate a real patient booking arriving in your dashboard. Use this in clinic demos.</p>

        {flash && (
          <div className="bg-sage-700 text-cream rounded-2xl p-4 mb-6 flex items-center gap-2 reveal">
            <Check className="w-4 h-4" /> {flash}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {channels.map(c => (
            <button key={c.channel} onClick={() => simulate(c.channel)}
              className="bg-bone border border-sage-200 rounded-2xl p-6 text-left hover:border-sage-500 hover:bg-sage-50 transition group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-sage-700 text-cream flex items-center justify-center">
                  <c.icon className="w-4 h-4" />
                </div>
                <h3 className="font-display ft-lg">{c.name}</h3>
              </div>
              <p className="ft-base text-ink/65">{c.copy}</p>
              <p className="ft-xs text-sage-700 mt-3 group-hover:underline">Simulate booking →</p>
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
