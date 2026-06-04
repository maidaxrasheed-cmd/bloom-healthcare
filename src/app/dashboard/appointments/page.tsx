'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  getSession, getClinic, getAppointments, createAppointment, updateAppointment,
  deleteAppointment, markAppointmentsSeen, getRemindersFor,
  type Appointment, type Channel, type Clinic, type Reminder
} from '@/lib/store';
import {
  Plus, Filter, X, Instagram, MessageCircle, Globe, Mail, Facebook, PencilLine,
  Search, Check, Clock, MoreVertical, Calendar, Trash2, ChevronDown
} from 'lucide-react';

const channelIcons: any = {
  instagram: Instagram, whatsapp: MessageCircle, facebook: Facebook,
  website: Globe, email: Mail, manual: PencilLine,
};
const channelColors: any = {
  instagram: 'bg-pink-100 text-pink-700',
  whatsapp: 'bg-green-100 text-green-700',
  facebook: 'bg-blue-100 text-blue-700',
  website: 'bg-sage-100 text-sage-700',
  email: 'bg-amber-100 text-amber-700',
  manual: 'bg-stone-100 text-stone-700',
};

export default function AppointmentsPage() {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [filterChannel, setFilterChannel] = useState<Channel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'week' | 'past'>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const refresh = async (c: Clinic) => {
    const a = await getAppointments(c.id);
    setAppts(a);
  };

  useEffect(() => {
    const session = getSession();
    if (!session) return;
    getClinic(session.clinicId).then(async c => {
      if (!c) return;
      setClinic(c);
      await refresh(c);
      setTimeout(async () => {
        await markAppointmentsSeen(c.id);
        await refresh(c);
      }, 800);
    });
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    return appts.filter(a => {
      if (filterChannel !== 'all' && a.channel !== filterChannel) return false;
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      const d = new Date(a.scheduledFor);
      if (filterDate === 'today' && !sameDay(d, now)) return false;
      if (filterDate === 'week') {
        const week = new Date(now); week.setDate(week.getDate() + 7);
        if (d < now || d > week) return false;
      }
      if (filterDate === 'past' && d > now) return false;
      if (search && !`${a.patientName} ${a.service} ${a.patientPhone}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [appts, filterChannel, filterStatus, filterDate, search]);

  if (!clinic) return <DashboardLayout><div /></DashboardLayout>;

  const channels: (Channel | 'all')[] = ['all', 'website', 'instagram', 'whatsapp', 'facebook', 'email', 'manual'];

  return (
    <DashboardLayout>
      <div className="p-8 md:p-12 max-w-7xl mx-auto w-full">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="ft-xs uppercase tracking-widest text-sage-700 font-mono mb-2">Schedule</p>
            <h1 className="font-display text-4xl md:text-5xl">All appointments</h1>
            <p className="text-ink/60 mt-2 ft-base">{filtered.length} of {appts.length} shown</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="btn-lift inline-flex items-center gap-2 bg-sage-700 text-cream rounded-full px-5 py-3 ft-base font-medium shadow-soft">
            <Plus className="w-4 h-4" /> Create new
          </button>
        </div>

        {/* Filters */}
        <div className="bg-bone border border-sage-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4 text-xs uppercase tracking-wider text-ink/50 font-mono">
            <Filter className="w-3.5 h-3.5" /> Filter by
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink/40 mb-1.5 font-mono">Channel</div>
              <div className="flex flex-wrap gap-2">
                {channels.map(ch => {
                  const active = filterChannel === ch;
                  const Icon = ch === 'all' ? Filter : channelIcons[ch];
                  return (
                    <button key={ch} onClick={() => setFilterChannel(ch)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition border ${active ? 'bg-sage-700 text-cream border-sage-700' : 'bg-cream border-sage-200 text-ink/70 hover:border-sage-400'}`}>
                      <Icon className="w-3 h-3" /> <span className="capitalize">{ch}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink/40 mb-1.5 font-mono">Status</div>
                <Select value={filterStatus} onChange={v => setFilterStatus(v as any)} options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink/40 mb-1.5 font-mono">Date</div>
                <Select value={filterDate} onChange={v => setFilterDate(v as any)} options={[
                  { value: 'all', label: 'Anytime' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'Next 7 days' },
                  { value: 'past', label: 'Past' },
                ]} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink/40 mb-1.5 font-mono">Search</div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, service, phone"
                    className="w-full bg-cream border border-sage-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-sage-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : (
          <div className="bg-bone border border-sage-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full ft-base">
                <thead>
                  <tr className="ft-xs uppercase tracking-wider text-ink/45 font-mono border-b border-sage-200">
                    <th className="text-left px-5 py-3 font-normal">Patient</th>
                    <th className="text-left px-5 py-3 font-normal">Service</th>
                    <th className="text-left px-5 py-3 font-normal">When</th>
                    <th className="text-left px-5 py-3 font-normal">Channel</th>
                    <th className="text-left px-5 py-3 font-normal">Status</th>
                    <th className="text-left px-5 py-3 font-normal">Reminders</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <Row key={a.id} appt={a} onClick={() => setSelectedAppt(a)} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreateModal clinic={clinic} onClose={() => setShowCreate(false)} onCreated={() => refresh(clinic)} />}
      {selectedAppt && <DetailDrawer appt={selectedAppt} onClose={() => setSelectedAppt(null)} onUpdate={() => { refresh(clinic); setSelectedAppt(null); }} />}
    </DashboardLayout>
  );
}

function Row({ appt, onClick }: { appt: Appointment; onClick: () => void }) {
  const Icon = channelIcons[appt.channel];
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    getRemindersFor(appt.id).then(setReminders);
  }, [appt.id]);

  const sent = reminders.filter(r => r.status === 'sent').length;
  return (
    <tr onClick={onClick} className="border-b border-sage-200/50 hover:bg-cream/60 transition cursor-pointer last:border-b-0">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sage-700 text-cream flex items-center justify-center ft-xs font-medium">
            {appt.patientName.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{appt.patientName}</span>
              {appt.isNew && <span className="text-[9px] uppercase tracking-wider bg-accent text-cream px-1.5 py-0.5 rounded font-mono">new</span>}
            </div>
            <div className="ft-xs text-ink/55 mt-0.5">{appt.patientPhone}</div>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-ink/75">{appt.service}</td>
      <td className="px-5 py-4 text-ink/75">{formatWhen(appt.scheduledFor)}</td>
      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${channelColors[appt.channel]}`}>
          <Icon className="w-3 h-3" /> <span className="capitalize">{appt.channel}</span>
        </span>
      </td>
      <td className="px-5 py-4"><StatusBadge status={appt.status} /></td>
      <td className="px-5 py-4">
        <div className="inline-flex items-center gap-1">
          {[0,1,2].map(i => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < sent ? 'bg-sage-500' : 'bg-sage-200'}`} />
          ))}
          <span className="ft-xs text-ink/55 ml-1.5 font-mono">{sent}/3</span>
        </div>
      </td>
      <td className="px-3 py-4"><MoreVertical className="w-4 h-4 text-ink/30" /></td>
    </tr>
  );
}

function StatusBadge({ status }: { status: Appointment['status'] }) {
  const styles: Record<Appointment['status'], string> = {
    confirmed: 'bg-sage-100 text-sage-700',
    completed: 'bg-stone-100 text-stone-600',
    cancelled: 'bg-red-50 text-red-700',
    pending: 'bg-amber-100 text-amber-700',
  };
  return <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${styles[status]}`}>{status}</span>;
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full appearance-none bg-cream border border-sage-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-sage-500">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="bg-bone border border-sage-200 rounded-2xl p-16 text-center">
      <Calendar className="w-12 h-12 text-sage-300 mx-auto mb-4" />
      <p className="font-display ft-xl mb-2">No appointments match</p>
      <p className="ft-base text-ink/55 mb-6">Try changing filters, or create one manually.</p>
      <button onClick={onCreate}
        className="btn-lift inline-flex items-center gap-2 bg-sage-700 text-cream rounded-full px-5 py-2.5 ft-base">
        <Plus className="w-4 h-4" /> Create appointment
      </button>
    </div>
  );
}

function CreateModal({ clinic, onClose, onCreated }: { clinic: Clinic; onClose: () => void; onCreated: () => void }) {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(10, 0, 0, 0);
  const [form, setForm] = useState({
    patientName: '', patientPhone: '', patientEmail: '',
    service: clinic.services[0]?.name ?? 'Consultation',
    durationMin: clinic.services[0]?.durationMin ?? 30,
    scheduledFor: toLocalInput(tomorrow),
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.patientName || !form.patientPhone) return;
    setLoading(true);
    await createAppointment({
      clinicId: clinic.id,
      patientName: form.patientName,
      patientPhone: form.patientPhone,
      patientEmail: form.patientEmail,
      service: form.service,
      scheduledFor: new Date(form.scheduledFor).toISOString(),
      durationMin: form.durationMin,
      channel: 'manual',
      notes: form.notes,
    });
    setSubmitted(true);
    setTimeout(() => { onCreated(); onClose(); }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 reveal">
      <div className="bg-cream rounded-3xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="ft-xs uppercase tracking-widest text-sage-700 font-mono mb-1">New appointment</p>
            <h2 className="font-display ft-2xl">Manual booking</h2>
          </div>
          <button onClick={onClose} className="text-ink/40 hover:text-ink"><X className="w-5 h-5" /></button>
        </div>

        {submitted ? (
          <div className="py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-sage-700" />
            </div>
            <h3 className="font-display ft-xl mb-2">Booked.</h3>
            <p className="ft-base text-ink/60">Three reminders are now queued.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <FormField label="Patient name" value={form.patientName} onChange={v => setForm({ ...form, patientName: v })} placeholder="Hassan Ahmed" />
              <FormField label="Phone" value={form.patientPhone} onChange={v => setForm({ ...form, patientPhone: v })} placeholder="+92 300 0000000" />
              <FormField label="Email (for reminders)" type="email" value={form.patientEmail} onChange={v => setForm({ ...form, patientEmail: v })} placeholder="patient@email.com" />
              <div>
                <label className="block text-xs uppercase tracking-wider text-ink/50 mb-1.5 font-mono">Service</label>
                <select value={form.service} onChange={e => {
                  const svc = clinic.services.find(s => s.name === e.target.value);
                  setForm({ ...form, service: e.target.value, durationMin: svc?.durationMin ?? 30 });
                }} className="w-full bg-bone border border-sage-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-sage-500">
                  {clinic.services.length > 0
                    ? clinic.services.map(s => <option key={s.id} value={s.name}>{s.name} ({s.durationMin}min)</option>)
                    : <option value="Consultation">Consultation (30min)</option>
                  }
                </select>
              </div>
              <FormField label="When" type="datetime-local" value={form.scheduledFor} onChange={v => setForm({ ...form, scheduledFor: v })} />
              <div>
                <label className="block text-xs uppercase tracking-wider text-ink/50 mb-1.5 font-mono">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full bg-bone border border-sage-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-sage-500" />
              </div>
            </div>

            <div className="mt-3 p-3 bg-sage-100/50 border border-sage-200 rounded-lg ft-xs text-sage-800">
              <Clock className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
              3 reminders will be sent: now (confirmation), midway, and the morning of.
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={onClose} className="flex-1 border border-sage-200 rounded-full py-3 text-sm hover:bg-bone transition">Cancel</button>
              <button onClick={submit} disabled={loading}
                className="btn-lift flex-1 bg-sage-700 text-cream rounded-full py-3 ft-base font-medium disabled:opacity-50">
                {loading ? 'Creating…' : 'Create & send reminders'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-ink/50 mb-1.5 font-mono">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-bone border border-sage-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-sage-500" />
    </div>
  );
}

function DetailDrawer({ appt, onClose, onUpdate }: { appt: Appointment; onClose: () => void; onUpdate: () => void }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const Icon = channelIcons[appt.channel];

  useEffect(() => {
    getRemindersFor(appt.id).then(setReminders);
  }, [appt.id]);

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex justify-end reveal">
      <div className="bg-cream w-full max-w-md h-full overflow-y-auto p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="ft-xs uppercase tracking-widest text-sage-700 font-mono mb-1">Appointment</p>
            <h2 className="font-display ft-2xl">{appt.patientName}</h2>
          </div>
          <button onClick={onClose} className="text-ink/40 hover:text-ink"><X className="w-5 h-5" /></button>
        </div>

        <div className="bg-bone border border-sage-200 rounded-xl p-5 mb-6 space-y-3 ft-base">
          <Detail label="Service" value={appt.service} />
          <Detail label="When" value={new Date(appt.scheduledFor).toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} />
          <Detail label="Duration" value={`${appt.durationMin} min`} />
          <Detail label="Phone" value={appt.patientPhone} />
          {appt.patientEmail && <Detail label="Email" value={appt.patientEmail} />}
          <div className="flex items-center justify-between">
            <span className="ft-xs uppercase tracking-wider text-ink/50 font-mono">Channel</span>
            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${channelColors[appt.channel]}`}>
              <Icon className="w-3 h-3" /> <span className="capitalize">{appt.channel}</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="ft-xs uppercase tracking-wider text-ink/50 font-mono">Status</span>
            <StatusBadge status={appt.status} />
          </div>
        </div>

        {appt.notes && (
          <div className="mb-6">
            <p className="ft-xs uppercase tracking-wider text-ink/50 mb-2 font-mono">Notes</p>
            <p className="ft-base text-ink/75 bg-bone p-4 rounded-lg border border-sage-200">{appt.notes}</p>
          </div>
        )}

        <div className="mb-6">
          <p className="ft-xs uppercase tracking-wider text-ink/50 mb-3 font-mono">Reminders</p>
          <div className="space-y-2">
            {reminders.map((r) => (
              <div key={r.id} className="bg-bone border border-sage-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="ft-xs font-medium capitalize">{r.stage.replace('_', ' ')}</span>
                  <span className={`text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded ${r.status === 'sent' ? 'bg-sage-100 text-sage-700' : 'bg-amber-100 text-amber-700'}`}>
                    {r.status === 'sent' ? `Sent ${formatRelative(r.sentAt!)}` : `Scheduled ${formatRelative(r.scheduledAt)}`}
                  </span>
                </div>
                <p className="ft-xs text-ink/65 leading-relaxed">{r.message}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {appt.status === 'confirmed' && (
            <button onClick={async () => { await updateAppointment(appt.id, { status: 'completed' }); onUpdate(); }}
              className="w-full bg-sage-700 text-cream rounded-full py-3 ft-base font-medium">Mark as completed</button>
          )}
          {appt.status === 'confirmed' && (
            <button onClick={async () => { await updateAppointment(appt.id, { status: 'cancelled' }); onUpdate(); }}
              className="w-full border border-sage-200 rounded-full py-3 ft-base">Cancel appointment</button>
          )}
          <button onClick={async () => { if (confirm('Delete this appointment?')) { await deleteAppointment(appt.id); onUpdate(); } }}
            className="w-full ft-xs text-red-600 hover:bg-red-50 rounded-full py-3 flex items-center justify-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="ft-xs uppercase tracking-wider text-ink/50 font-mono">{label}</span>
      <span className="ft-base font-medium text-right">{value}</span>
    </div>
  );
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (sameDay(d, now)) return `Today · ${time}`;
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  if (sameDay(d, tomorrow)) return `Tomorrow · ${time}`;
  return `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${time}`;
}

function formatRelative(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(ms);
  const sign = ms < 0 ? 'ago' : 'in';
  if (abs < 60000) return ms < 0 ? 'just now' : 'momentarily';
  if (abs < 3600000) return `${sign} ${Math.round(abs / 60000)}m`;
  if (abs < 86400000) return `${sign} ${Math.round(abs / 3600000)}h`;
  return `${sign} ${Math.round(abs / 86400000)}d`;
}

function toLocalInput(d: Date) {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}
