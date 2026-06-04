'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getClinicBySlug, createAppointment, type Clinic, type Service } from '@/lib/store';
import { ArrowRight, Calendar, Clock, Check, ChevronLeft, Sparkles } from 'lucide-react';

export default function BookingWidgetPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState(0); // 0=service, 1=date, 2=time, 3=details, 4=done
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [details, setDetails] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    const c = getClinicBySlug(slug);
    if (c) setClinic(c); else setNotFound(true);
  }, [slug]);

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <h1 className="font-display text-3xl mb-2">This booking page isn't active.</h1>
        <p className="text-ink/60">The link may be wrong, or the clinic hasn't set up Bloom yet.</p>
      </div>
    </div>
  );
  if (!clinic) return <div className="min-h-screen flex items-center justify-center text-ink/50 text-sm">Loading…</div>;

  // Generate next 14 days, working days only
  const days: Date[] = [];
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i = 0; i < 14 && days.length < 10; i++) {
    const d = new Date(today); d.setDate(d.getDate() + i);
    if (clinic.workingDays.includes(d.getDay())) days.push(d);
  }

  // Generate time slots for selected date
  const slots: string[] = [];
  if (date && service) {
    const [oh, om] = clinic.openTime.split(':').map(Number);
    const [ch, cm] = clinic.closeTime.split(':').map(Number);
    const start = oh * 60 + om;
    const end = ch * 60 + cm - service.durationMin;
    for (let m = start; m <= end; m += 30) {
      const hh = Math.floor(m / 60), mm = m % 60;
      slots.push(`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`);
    }
  }

  const submit = () => {
    if (!service || !date || !time || !details.name || !details.phone) return;
    const [hh, mm] = time.split(':').map(Number);
    const when = new Date(date); when.setHours(hh, mm, 0, 0);
    createAppointment({
      clinicId: clinic.id,
      patientName: details.name,
      patientPhone: details.phone,
      patientEmail: details.email,
      service: service.name,
      scheduledFor: when.toISOString(),
      durationMin: service.durationMin,
      channel: 'website',
      notes: '',
    });
    setStep(4);
  };

  return (
    <main className="min-h-screen bg-cream py-8 px-4 md:py-16">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-sage-700 text-cream rounded-2xl mb-4">
            <Calendar className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl mb-2">{clinic.name}</h1>
          <p className="text-ink/60 text-sm">Book your appointment with Dr. {clinic.doctorName.replace(/^Dr\.?\s*/i, '')}</p>
        </div>

        {/* Progress */}
        {step < 4 && (
          <div className="flex gap-1.5 mb-8">
            {[0,1,2,3].map(i => (
              <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-sage-700' : 'bg-sage-200'}`} />
            ))}
          </div>
        )}

        <div className="bg-bone border border-sage-200 rounded-3xl p-6 md:p-10">
          {step === 0 && (
            <div className="reveal">
              <p className="text-xs uppercase tracking-widest text-sage-700 font-mono mb-2">Step 1 of 4</p>
              <h2 className="font-display text-2xl md:text-3xl mb-6">What do you need today?</h2>
              <div className="space-y-2">
                {clinic.services.map(s => (
                  <button key={s.id} onClick={() => { setService(s); setStep(1); }}
                    className="w-full bg-cream border border-sage-200 rounded-xl p-4 text-left hover:border-sage-500 hover:bg-sage-50 transition group flex items-center justify-between">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-ink/55 mt-0.5 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {s.durationMin} minutes
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-ink/30 group-hover:text-sage-700 group-hover:translate-x-1 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="reveal">
              <BackBtn onClick={() => setStep(0)} />
              <p className="text-xs uppercase tracking-widest text-sage-700 font-mono mb-2">Step 2 of 4</p>
              <h2 className="font-display text-2xl md:text-3xl mb-6">Pick a day.</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {days.map((d, i) => (
                  <button key={i} onClick={() => { setDate(d); setStep(2); }}
                    className="bg-cream border border-sage-200 rounded-xl p-3 text-center hover:border-sage-500 hover:bg-sage-50 transition">
                    <div className="text-[10px] uppercase tracking-wider text-ink/50 font-mono">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className="font-display text-2xl mt-0.5">{d.getDate()}</div>
                    <div className="text-xs text-ink/55">{d.toLocaleDateString('en-US', { month: 'short' })}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="reveal">
              <BackBtn onClick={() => setStep(1)} />
              <p className="text-xs uppercase tracking-widest text-sage-700 font-mono mb-2">Step 3 of 4</p>
              <h2 className="font-display text-2xl md:text-3xl mb-1">Pick a time.</h2>
              <p className="text-sm text-ink/60 mb-6">{date && date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map(s => (
                  <button key={s} onClick={() => { setTime(s); setStep(3); }}
                    className="bg-cream border border-sage-200 rounded-lg py-2 text-sm hover:border-sage-500 hover:bg-sage-50 transition">
                    {format12h(s)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="reveal">
              <BackBtn onClick={() => setStep(2)} />
              <p className="text-xs uppercase tracking-widest text-sage-700 font-mono mb-2">Step 4 of 4</p>
              <h2 className="font-display text-2xl md:text-3xl mb-6">Your details.</h2>
              <div className="space-y-3 mb-6">
                <PatientField label="Your name" value={details.name} onChange={v => setDetails({ ...details, name: v })} />
                <PatientField label="Phone" value={details.phone} onChange={v => setDetails({ ...details, phone: v })} placeholder="+92 300 0000000" />
                <PatientField label="Email (optional)" type="email" value={details.email} onChange={v => setDetails({ ...details, email: v })} />
              </div>

              <div className="bg-sage-100/60 border border-sage-200 rounded-xl p-4 mb-6 text-sm">
                <div className="text-xs uppercase tracking-wider text-ink/55 mb-2 font-mono">Confirm your booking</div>
                <div className="font-medium">{service?.name} with Dr. {clinic.doctorName.replace(/^Dr\.?\s*/i, '')}</div>
                <div className="text-ink/70 mt-1">
                  {date?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {time && format12h(time)}
                </div>
              </div>

              <button onClick={submit} disabled={!details.name || !details.phone}
                className="btn-lift w-full bg-sage-700 text-cream rounded-full py-3.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                Confirm booking <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="reveal text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-sage-700 text-cream rounded-2xl mb-6">
                <Check className="w-7 h-7" />
              </div>
              <h2 className="font-display text-3xl mb-3">You're booked.</h2>
              <p className="text-ink/65 mb-6 max-w-xs mx-auto">
                {service?.name} on <strong>{date?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong> at <strong>{time && format12h(time)}</strong>.
              </p>
              <div className="bg-sage-100/60 border border-sage-200 rounded-xl p-4 text-sm text-ink/75 inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sage-700" />
                We'll send you reminders so you don't forget.
              </div>
              <p className="text-xs text-ink/45 mt-8 font-mono">Powered by Bloom Healthcare</p>
            </div>
          )}
        </div>

        {step < 4 && (
          <p className="text-center text-xs text-ink/40 mt-6 font-mono">
            Powered by <span className="text-sage-700">Bloom Healthcare</span>
          </p>
        )}
      </div>
    </main>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 text-xs text-ink/55 hover:text-ink mb-4">
      <ChevronLeft className="w-3.5 h-3.5" /> back
    </button>
  );
}

function PatientField({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-ink/50 mb-1.5 font-mono">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-cream border border-sage-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-sage-500" />
    </div>
  );
}

function format12h(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}
