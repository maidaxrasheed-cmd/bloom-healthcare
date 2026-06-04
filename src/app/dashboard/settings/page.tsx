'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getSession, getClinic, updateClinic, type Clinic, type Service } from '@/lib/store';
import { Check, Plus, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    const session = getSession(); if (!session) return;
    const c = getClinic(session.clinicId); if (!c) return;
    setClinic(c);
  }, []);

  if (!clinic) return <DashboardLayout><div /></DashboardLayout>;

  const save = (patch: Partial<Clinic>, msg = 'Saved') => {
    const updated = updateClinic(clinic.id, patch);
    if (updated) { setClinic(updated); setSaved(msg); setTimeout(() => setSaved(''), 1500); }
  };

  return (
    <DashboardLayout>
      <div className="p-8 md:p-12 max-w-3xl mx-auto w-full">
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="ft-xs uppercase tracking-widest text-sage-700 font-mono mb-2">Settings</p>
            <h1 className="font-display text-4xl md:text-5xl">Your clinic.</h1>
          </div>
          {saved && (
            <div className="inline-flex items-center gap-1.5 ft-xs text-sage-700 bg-sage-100 px-3 py-1.5 rounded-full">
              <Check className="w-3 h-3" /> {saved}
            </div>
          )}
        </div>

        {/* Clinic info */}
        <Section title="Clinic information">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Clinic name" value={clinic.name} onChange={v => save({ name: v })} />
            <Field label="Doctor name" value={clinic.doctorName} onChange={v => save({ doctorName: v })} />
            <Field label="Email" value={clinic.email} onChange={v => save({ email: v })} />
            <Field label="Phone" value={clinic.phone} onChange={v => save({ phone: v })} />
            <Field label="Specialty" value={clinic.specialty} onChange={v => save({ specialty: v })} />
          </div>
        </Section>

        {/* Hours */}
        <Section title="Working hours">
          <div className="mb-4">
            <label className="block text-xs uppercase tracking-wider text-ink/50 mb-2 font-mono">Days</label>
            <div className="flex gap-2 flex-wrap">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => (
                <button key={d} onClick={() => {
                  const wd = clinic.workingDays.includes(i) ? clinic.workingDays.filter(x => x !== i) : [...clinic.workingDays, i];
                  save({ workingDays: wd });
                }} className={`px-4 py-2 rounded-lg text-xs border transition ${clinic.workingDays.includes(i) ? 'bg-sage-700 text-cream border-sage-700' : 'bg-cream border-sage-200'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Open at" type="time" value={clinic.openTime} onChange={v => save({ openTime: v })} />
            <Field label="Close at" type="time" value={clinic.closeTime} onChange={v => save({ closeTime: v })} />
          </div>
        </Section>

        {/* Services */}
        <Section title="Services">
          <div className="space-y-2 mb-3">
            {clinic.services.map((s, i) => (
              <ServiceRow key={s.id} service={s}
                onChange={(name, dur) => {
                  const svc = [...clinic.services]; svc[i] = { ...svc[i], name, durationMin: dur };
                  save({ services: svc });
                }}
                onDelete={() => save({ services: clinic.services.filter(x => x.id !== s.id) })}
              />
            ))}
          </div>
          <button onClick={() => save({ services: [...clinic.services, { id: Math.random().toString(36).slice(2), name: 'New service', durationMin: 30 }] })}
            className="inline-flex items-center gap-2 ft-base text-sage-700 hover:text-sage-800">
            <Plus className="w-4 h-4" /> Add service
          </button>
        </Section>

        {/* Reminder templates */}
        <Section title="Reminder messages">
          <p className="ft-base text-ink/60 mb-4">
            Variables: <code className="bg-bone px-1 py-0.5 rounded ft-xs">{'{{patient}}'}</code>,&nbsp;
            <code className="bg-bone px-1 py-0.5 rounded ft-xs">{'{{clinic}}'}</code>,&nbsp;
            <code className="bg-bone px-1 py-0.5 rounded ft-xs">{'{{doctor}}'}</code>,&nbsp;
            <code className="bg-bone px-1 py-0.5 rounded ft-xs">{'{{service}}'}</code>,&nbsp;
            <code className="bg-bone px-1 py-0.5 rounded ft-xs">{'{{date}}'}</code>,&nbsp;
            <code className="bg-bone px-1 py-0.5 rounded ft-xs">{'{{time}}'}</code>
          </p>
          <div className="space-y-4">
            {(['confirmation','midway','day_of'] as const).map(stage => (
              <div key={stage}>
                <label className="block text-xs uppercase tracking-wider text-ink/50 mb-1.5 font-mono">
                  {stage === 'confirmation' ? 'On booking' : stage === 'midway' ? 'Midway' : 'Day of'}
                </label>
                <textarea value={clinic.reminderTemplates[stage]}
                  onChange={e => save({ reminderTemplates: { ...clinic.reminderTemplates, [stage]: e.target.value } })}
                  rows={2}
                  className="w-full bg-bone border border-sage-200 rounded-lg px-4 py-3 ft-base font-mono focus:outline-none focus:border-sage-500" />
              </div>
            ))}
          </div>
        </Section>
      </div>
    </DashboardLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display ft-xl mb-5">{title}</h2>
      <div className="bg-bone border border-sage-200 rounded-2xl p-6">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-ink/50 mb-1.5 font-mono">{label}</label>
      <input type={type} defaultValue={value} onBlur={e => e.target.value !== value && onChange(e.target.value)}
        className="w-full bg-cream border border-sage-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-sage-500" />
    </div>
  );
}

function ServiceRow({ service, onChange, onDelete }: { service: Service; onChange: (n: string, d: number) => void; onDelete: () => void }) {
  const [name, setName] = useState(service.name);
  const [dur, setDur] = useState(service.durationMin);
  const commit = () => { if (name !== service.name || dur !== service.durationMin) onChange(name, dur); };
  return (
    <div className="flex gap-3 items-center bg-cream border border-sage-200 rounded-lg p-3">
      <input value={name} onChange={e => setName(e.target.value)} onBlur={commit}
        className="flex-1 bg-transparent text-sm focus:outline-none" />
      <input type="number" value={dur} onChange={e => setDur(+e.target.value)} onBlur={commit}
        className="w-20 bg-bone border border-sage-200 rounded px-2 py-1 ft-base text-center focus:outline-none" />
      <span className="ft-xs text-ink/50 font-mono">min</span>
      <button onClick={onDelete} className="text-ink/40 hover:text-red-600">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
