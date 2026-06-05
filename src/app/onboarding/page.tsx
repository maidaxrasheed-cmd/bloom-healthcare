'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { getSession, getClinic, updateClinic, type Service, type Channel, type Clinic, DEFAULT_TEMPLATES } from '@/lib/store';
import { Check, ArrowRight, ArrowLeft, Plus, Trash2, Instagram, MessageCircle, MessageSquare, Globe, Mail, Facebook, Copy } from 'lucide-react';

const STEPS = ['Hours', 'Services', 'Channels', 'Reminders'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [clinic, setClinic] = useState<Clinic | undefined>(undefined);
  const [workingDays, setWorkingDays] = useState<number[]>([1,2,3,4,5]);
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');
  const [services, setServices] = useState<Service[]>([
    { id: 's1', name: 'General Consultation', durationMin: 30 },
    { id: 's2', name: 'Follow-up', durationMin: 15 },
  ]);
  const [channels, setChannels] = useState<{ channel: Channel; connected: boolean; handle?: string }[]>([
    { channel: 'website', connected: true },
    { channel: 'whatsapp', connected: false },
    { channel: 'sms', connected: false },
    { channel: 'instagram', connected: false },
    { channel: 'facebook', connected: false },
    { channel: 'email', connected: false },
  ]);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.push('/login'); return; }
    getClinic(session.clinicId).then(c => {
      if (!c) { router.push('/login'); return; }
      setClinic(c);
      setWorkingDays(c.workingDays);
      setOpenTime(c.openTime);
      setCloseTime(c.closeTime);
      if (c.services && c.services.length) setServices(c.services);
      if (c.channels && c.channels.length) setChannels(c.channels);
      setTemplates(c.reminderTemplates);
    });
  }, [router]);

  if (!clinic) return null;

  const finish = async () => {
    await updateClinic(clinic.id, {
      workingDays, openTime, closeTime,
      services, channels,
      reminderTemplates: templates,
      onboardingComplete: true,
    });
    router.push('/dashboard');
  };

  const next = () => step < STEPS.length - 1 ? setStep(step + 1) : finish();
  const prev = () => step > 0 && setStep(step - 1);

  const bookingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/book/${clinic.bookingSlug}`
    : '';

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 md:px-12 py-6 border-b border-sage-200/50 flex items-center justify-between">
        <Logo />
        <div className="text-xs text-ink/50 font-mono">Step {step + 1} of {STEPS.length}</div>
      </header>
      {/* Step indicator */}
      <div className="px-6 md:px-12 py-6 border-b border-sage-200/50">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`flex items-center gap-2 ${i <= step ? 'text-sage-700' : 'text-ink/30'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono border ${i < step ? 'bg-sage-700 text-cream border-sage-700' : i === step ? 'border-sage-700' : 'border-ink/20'}`}>
                  {i < step ? <Check className="w-3 h-3" /> : (i+1)}
                </div>
                <span className="text-xs uppercase tracking-wider hidden md:inline">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-sage-700' : 'bg-sage-200'}`} />}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 px-6 md:px-12 py-12">
        <div className="max-w-2xl mx-auto">
          {step === 0 && (
            <div className="reveal">
              <p className="text-xs uppercase tracking-widest text-sage-700 font-mono mb-3">Step 01</p>
              <h2 className="font-display text-4xl mb-3">When are you <em className="italic font-light">open?</em></h2>
              <p className="text-ink/65 mb-10">We use this to show patients only available slots.</p>
              <label className="block text-xs uppercase tracking-wider text-ink/50 mb-3 font-mono">Working days</label>
              <div className="flex gap-2 mb-8">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => (
                  <button key={d} type="button" onClick={() => setWorkingDays(workingDays.includes(i) ? workingDays.filter(x => x !== i) : [...workingDays, i])}
                    className={`flex-1 py-3 rounded-lg text-sm border transition ${workingDays.includes(i) ? 'bg-sage-700 text-cream border-sage-700' : 'bg-bone border-sage-200 hover:border-sage-500'}`}>
                    {d}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink/50 mb-1.5 font-mono">Open at</label>
                  <input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)}
                    className="w-full bg-bone border border-sage-200 rounded-lg px-4 py-3 text-sm focus:border-sage-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink/50 mb-1.5 font-mono">Close at</label>
                  <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)}
                    className="w-full bg-bone border border-sage-200 rounded-lg px-4 py-3 text-sm focus:border-sage-500 focus:outline-none" />
                </div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="reveal">
              <p className="text-xs uppercase tracking-widest text-sage-700 font-mono mb-3">Step 02</p>
              <h2 className="font-display text-4xl mb-3">What do you <em className="italic font-light">offer?</em></h2>
              <p className="text-ink/65 mb-10">Patients pick one of these when booking.</p>
              <div className="space-y-3 mb-4">
                {services.map((s, i) => (
                  <div key={s.id} className="flex gap-3 items-center bg-bone border border-sage-200 rounded-lg p-3">
                    <input value={s.name} onChange={e => { const c = [...services]; c[i].name = e.target.value; setServices(c); }}
                      placeholder="Service name"
                      className="flex-1 bg-transparent text-sm focus:outline-none" />
                    <input type="number" value={s.durationMin} onChange={e => { const c = [...services]; c[i].durationMin = +e.target.value; setServices(c); }}
                      className="w-20 bg-cream border border-sage-200 rounded px-2 py-1 text-sm text-center focus:outline-none" />
                    <span className="text-xs text-ink/50 font-mono">min</span>
                    <button onClick={() => setServices(services.filter(x => x.id !== s.id))} className="text-ink/40 hover:text-red-600 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => setServices([...services, { id: Math.random().toString(36).slice(2), name: '', durationMin: 30 }])}
                className="inline-flex items-center gap-2 text-sm text-sage-700 hover:text-sage-800">
                <Plus className="w-4 h-4" /> Add service
              </button>
            </div>
          )}
          {step === 2 && (
            <div className="reveal">
              <p className="text-xs uppercase tracking-widest text-sage-700 font-mono mb-3">Step 03</p>
              <h2 className="font-display text-4xl mb-3">Connect your <em className="italic font-light">channels.</em></h2>
              <p className="text-ink/65 mb-10">Skip for now if you want — you can connect any of these later.</p>
              <div className="space-y-3 mb-8">
                {channels.map((ch, i) => (
                  <ChannelRow key={ch.channel} ch={ch} onToggle={() => {
                    const c = [...channels]; c[i].connected = !c[i].connected; setChannels(c);
                  }} onHandle={v => {
                    const c = [...channels]; c[i].handle = v; setChannels(c);
                  }} />
                ))}
              </div>
              <div className="bg-sage-700 text-cream rounded-2xl p-6">
                <p className="text-xs uppercase tracking-widest text-sage-300 font-mono mb-2">Your booking link</p>
                <div className="flex items-center gap-3 bg-sage-800 rounded-lg px-4 py-3">
                  <code className="flex-1 text-sm text-cream/90 font-mono truncate">{bookingUrl}</code>
                  <button onClick={() => { navigator.clipboard.writeText(bookingUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                    className="text-xs bg-cream text-ink px-3 py-1.5 rounded-full hover:bg-cream/90 transition flex items-center gap-1.5">
                    {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                <p className="text-xs text-cream/60 mt-3">Paste this on your website, in your Instagram bio, or anywhere patients find you.</p>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="reveal">
              <p className="text-xs uppercase tracking-widest text-sage-700 font-mono mb-3">Step 04</p>
              <h2 className="font-display text-4xl mb-3">Reminder <em className="italic font-light">messages.</em></h2>
              <p className="text-ink/65 mb-10">Use our defaults or customize. Tags like <code className="bg-bone px-1.5 py-0.5 rounded text-xs">{'{{patient}}'}</code> are replaced automatically.</p>
              <div className="space-y-5">
                {(['confirmation','midway','day_of'] as const).map((stage) => (
                  <div key={stage}>
                    <label className="block text-xs uppercase tracking-wider text-ink/50 mb-1.5 font-mono">
                      {stage === 'confirmation' ? 'On booking' : stage === 'midway' ? 'Midway reminder' : 'Day of'}
                    </label>
                    <textarea value={templates[stage]} onChange={e => setTemplates({ ...templates, [stage]: e.target.value })}
                      rows={3}
                      className="w-full bg-bone border border-sage-200 rounded-lg px-4 py-3 text-sm focus:border-sage-500 focus:outline-none font-mono leading-relaxed" />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mt-12">
            <button onClick={prev} disabled={step === 0}
              className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={next}
              className="btn-lift bg-sage-700 text-cream rounded-full px-6 py-3 text-sm font-medium inline-flex items-center gap-2">
              {step === STEPS.length - 1 ? 'Finish & enter dashboard' : 'Continue'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function ChannelRow({ ch, onToggle, onHandle }: { ch: { channel: Channel; connected: boolean; handle?: string }; onToggle: () => void; onHandle: (v: string) => void }) {
  const Icon = ch.channel === 'instagram' ? Instagram : ch.channel === 'sms' ? MessageSquare : ch.channel === 'whatsapp' ? MessageCircle : ch.channel === 'facebook' ? Facebook : ch.channel === 'email' ? Mail : Globe;
  const label = ch.channel === 'website' ? 'Your website' : ch.channel.charAt(0).toUpperCase() + ch.channel.slice(1);
  return (
    <div className="bg-bone border border-sage-200 rounded-lg p-4">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ch.connected ? 'bg-sage-700 text-cream' : 'bg-cream text-ink/40 border border-sage-200'}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">{label}</div>
          {ch.connected && (ch.channel !== 'website') && (
            <input value={ch.handle ?? ''} onChange={e => onHandle(e.target.value)}
              placeholder={ch.channel === 'email' ? 'bookings@yourclinic.com' : ch.channel === 'whatsapp' ? '+92 300 0000000' : '@yourhandle'}
              className="mt-1.5 w-full bg-cream border border-sage-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-sage-500" />
          )}
          {ch.connected && ch.channel === 'website' && (
            <div className="text-xs text-ink/55 mt-0.5">Always on — your booking link works out of the box</div>
          )}
          {!ch.connected && <div className="text-xs text-ink/50">Coming soon — record demo available</div>}
        </div>
        <button onClick={onToggle}
          className={`relative w-11 h-6 rounded-full transition ${ch.connected ? 'bg-sage-700' : 'bg-sage-200'}`}>
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-cream transition ${ch.connected ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>
    </div>
  );
}
