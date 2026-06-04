// Bloom data layer — Supabase-backed store
// Replace your entire src/lib/store.ts with this file

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

export type Channel = 'website' | 'instagram' | 'facebook' | 'whatsapp' | 'email' | 'manual';
export type ReminderStage = 'confirmation' | 'midway' | 'day_of';

export type Reminder = {
  id: string;
  appointmentId: string;
  stage: ReminderStage;
  scheduledAt: string;
  sentAt: string | null;
  status: 'pending' | 'sent' | 'failed';
  channel: Channel;
  message: string;
};

export type Appointment = {
  id: string;
  clinicId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  service: string;
  scheduledFor: string;
  durationMin: number;
  channel: Channel;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  createdAt: string;
  isNew: boolean;
};

export type Service = {
  id: string;
  name: string;
  durationMin: number;
  description?: string;
};

export type ChannelConfig = {
  channel: Channel;
  connected: boolean;
  handle?: string;
  connectedAt?: string;
};

export type Clinic = {
  id: string;
  name: string;
  doctorName: string;
  email: string;
  phone: string;
  specialty: string;
  passwordHash: string;
  trialEndsAt: string;
  createdAt: string;
  onboardingComplete: boolean;
  workingDays: number[];
  openTime: string;
  closeTime: string;
  services: Service[];
  channels: ChannelConfig[];
  bookingSlug: string;
  reminderTemplates: {
    confirmation: string;
    midway: string;
    day_of: string;
  };
};

export type Session = {
  clinicId: string;
  loggedInAt: string;
};

// ---------- Helpers ----------

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const hash = (s: string) => btoa(unescape(encodeURIComponent(s))).slice(0, 24);
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const isClient = () => typeof window !== 'undefined';

export const DEFAULT_TEMPLATES = {
  confirmation: "Hi {{patient}}, your {{service}} appointment at {{clinic}} is confirmed for {{date}} at {{time}}. Reply CANCEL to cancel.",
  midway: "Reminder: your appointment at {{clinic}} is on {{date}} at {{time}}. See you then!",
  day_of: "Today at {{time}} — your appointment with Dr. {{doctor}} at {{clinic}}. Call us if you need to reschedule.",
};

// ---------- Session (still localStorage for simplicity) ----------

const SESSION_KEY = 'bloom.session';

export function getSession(): Session | null {
  if (!isClient()) return null;
  try {
    const v = localStorage.getItem(SESSION_KEY);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

export function login(clinicId: string) {
  if (!isClient()) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ clinicId, loggedInAt: new Date().toISOString() }));
}

export function logout() {
  if (!isClient()) return;
  localStorage.removeItem(SESSION_KEY);
}

// ---------- Clinics ----------

export async function getClinics(): Promise<Clinic[]> {
  const { data, error } = await supabase.from('clinics').select('*');
  if (error) { console.error(error); return []; }
  return (data || []).map(mapClinic);
}

export async function getClinic(id: string): Promise<Clinic | undefined> {
  const { data, error } = await supabase.from('clinics').select('*').eq('id', id).single();
  if (error) return undefined;
  return mapClinic(data);
}

export async function getClinicByEmail(email: string): Promise<Clinic | undefined> {
  const { data, error } = await supabase.from('clinics').select('*').ilike('email', email).single();
  if (error) return undefined;
  return mapClinic(data);
}

export async function getClinicBySlug(slug: string): Promise<Clinic | undefined> {
  const { data, error } = await supabase.from('clinics').select('*').eq('booking_slug', slug).single();
  if (error) return undefined;
  return mapClinic(data);
}

function mapClinic(row: any): Clinic {
  return {
    id: row.id,
    name: row.name,
    doctorName: row.doctor_name,
    email: row.email,
    phone: row.phone,
    specialty: row.specialty,
    passwordHash: row.password_hash,
    trialEndsAt: row.trial_ends_at,
    createdAt: row.created_at,
    onboardingComplete: row.onboarding_complete,
    workingDays: row.working_days || [1,2,3,4,5],
    openTime: row.open_time || '09:00',
    closeTime: row.close_time || '18:00',
    services: row.services || [],
    channels: row.channels || [],
    bookingSlug: row.booking_slug,
    reminderTemplates: row.reminder_templates || { ...DEFAULT_TEMPLATES },
  };
}

export async function createClinic(data: {
  name: string; doctorName: string; email: string; phone: string;
  specialty: string; password: string;
}): Promise<Clinic> {
  const trialEnd = new Date(); trialEnd.setDate(trialEnd.getDate() + 14);
  const row = {
    id: uid(),
    name: data.name,
    doctor_name: data.doctorName,
    email: data.email,
    phone: data.phone,
    specialty: data.specialty,
    password_hash: hash(data.password),
    trial_ends_at: trialEnd.toISOString(),
    onboarding_complete: false,
    working_days: [1,2,3,4,5],
    open_time: '09:00',
    close_time: '18:00',
    services: [],
    channels: [
      { channel: 'website', connected: true },
      { channel: 'whatsapp', connected: false },
      { channel: 'instagram', connected: false },
      { channel: 'facebook', connected: false },
      { channel: 'email', connected: false },
    ],
    booking_slug: slugify(data.name) + '-' + uid().slice(0, 4),
    reminder_templates: { ...DEFAULT_TEMPLATES },
  };
  const { data: inserted, error } = await supabase.from('clinics').insert(row).select().single();
  if (error) throw error;
  return mapClinic(inserted);
}

export async function updateClinic(id: string, patch: Partial<Clinic>): Promise<Clinic | undefined> {
  const dbPatch: any = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.doctorName !== undefined) dbPatch.doctor_name = patch.doctorName;
  if (patch.email !== undefined) dbPatch.email = patch.email;
  if (patch.phone !== undefined) dbPatch.phone = patch.phone;
  if (patch.specialty !== undefined) dbPatch.specialty = patch.specialty;
  if (patch.onboardingComplete !== undefined) dbPatch.onboarding_complete = patch.onboardingComplete;
  if (patch.workingDays !== undefined) dbPatch.working_days = patch.workingDays;
  if (patch.openTime !== undefined) dbPatch.open_time = patch.openTime;
  if (patch.closeTime !== undefined) dbPatch.close_time = patch.closeTime;
  if (patch.services !== undefined) dbPatch.services = patch.services;
  if (patch.channels !== undefined) dbPatch.channels = patch.channels;
  if (patch.reminderTemplates !== undefined) dbPatch.reminder_templates = patch.reminderTemplates;

  const { data, error } = await supabase.from('clinics').update(dbPatch).eq('id', id).select().single();
  if (error) { console.error(error); return undefined; }
  return mapClinic(data);
}

export function verifyPassword(clinic: Clinic, password: string) {
  return clinic.passwordHash === hash(password);
}

// ---------- Appointments ----------

export async function getAppointments(clinicId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('scheduled_for', { ascending: true });
  if (error) { console.error(error); return []; }
  return (data || []).map(mapAppointment);
}

export async function getAppointment(id: string): Promise<Appointment | undefined> {
  const { data, error } = await supabase.from('appointments').select('*').eq('id', id).single();
  if (error) return undefined;
  return mapAppointment(data);
}

function mapAppointment(row: any): Appointment {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientName: row.patient_name,
    patientPhone: row.patient_phone,
    patientEmail: row.patient_email,
    service: row.service,
    scheduledFor: row.scheduled_for,
    durationMin: row.duration_min,
    channel: row.channel,
    status: row.status,
    notes: row.notes || '',
    createdAt: row.created_at,
    isNew: row.is_new,
  };
}

export async function createAppointment(
  data: Omit<Appointment, 'id' | 'createdAt' | 'isNew' | 'status'> & { status?: Appointment['status'] }
): Promise<Appointment> {
  const row = {
    id: uid(),
    clinic_id: data.clinicId,
    patient_name: data.patientName,
    patient_phone: data.patientPhone,
    patient_email: data.patientEmail,
    service: data.service,
    scheduled_for: data.scheduledFor,
    duration_min: data.durationMin,
    channel: data.channel,
    status: data.status ?? 'confirmed',
    notes: data.notes || '',
    is_new: data.channel !== 'manual',
  };
  const { data: inserted, error } = await supabase.from('appointments').insert(row).select().single();
  if (error) throw error;
  const appt = mapAppointment(inserted);
  await scheduleRemindersFor(appt);
  return appt;
}

export async function updateAppointment(id: string, patch: Partial<Appointment>): Promise<Appointment | undefined> {
  const dbPatch: any = {};
  if (patch.patientName !== undefined) dbPatch.patient_name = patch.patientName;
  if (patch.patientEmail !== undefined) dbPatch.patient_email = patch.patientEmail;
  if (patch.patientPhone !== undefined) dbPatch.patient_phone = patch.patientPhone;
  if (patch.service !== undefined) dbPatch.service = patch.service;
  if (patch.scheduledFor !== undefined) dbPatch.scheduled_for = patch.scheduledFor;
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.notes !== undefined) dbPatch.notes = patch.notes;
  if (patch.isNew !== undefined) dbPatch.is_new = patch.isNew;

  const { data, error } = await supabase.from('appointments').update(dbPatch).eq('id', id).select().single();
  if (error) { console.error(error); return undefined; }
  return mapAppointment(data);
}

export async function markAppointmentsSeen(clinicId: string) {
  await supabase.from('appointments').update({ is_new: false }).eq('clinic_id', clinicId).eq('is_new', true);
}

export async function deleteAppointment(id: string) {
  await supabase.from('reminders').delete().eq('appointment_id', id);
  await supabase.from('appointments').delete().eq('id', id);
}

// ---------- Reminders ----------

export async function getAllReminders(): Promise<Reminder[]> {
  const { data, error } = await supabase.from('reminders').select('*');
  if (error) { console.error(error); return []; }
  return (data || []).map(mapReminder);
}

export async function getRemindersFor(appointmentId: string): Promise<Reminder[]> {
  const { data, error } = await supabase.from('reminders').select('*').eq('appointment_id', appointmentId);
  if (error) return [];
  return (data || []).map(mapReminder);
}

export async function getRemindersForClinic(clinicId: string): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from('reminders')
    .select('*, appointments!inner(clinic_id)')
    .eq('appointments.clinic_id', clinicId)
    .order('scheduled_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return (data || []).map(mapReminder);
}

function mapReminder(row: any): Reminder {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    stage: row.stage,
    scheduledAt: row.scheduled_at,
    sentAt: row.sent_at,
    status: row.status,
    channel: row.channel,
    message: row.message,
  };
}

function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
}

export async function scheduleRemindersFor(appt: Appointment) {
  const clinic = await getClinic(appt.clinicId);
  if (!clinic) return;

  const now = new Date();
  const scheduledFor = new Date(appt.scheduledFor);
  const midway = new Date((now.getTime() + scheduledFor.getTime()) / 2);
  const dayOf = new Date(scheduledFor); dayOf.setHours(8, 0, 0, 0);

  const vars = {
    patient: appt.patientName.split(' ')[0],
    service: appt.service,
    clinic: clinic.name,
    doctor: clinic.doctorName,
    date: scheduledFor.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    time: scheduledFor.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };

  const channel: Channel = appt.channel === 'manual' ? 'email' : appt.channel;
  const tpls = clinic.reminderTemplates;

  const rows = [
    {
      id: uid(), appointment_id: appt.id, stage: 'confirmation',
      scheduled_at: now.toISOString(), sent_at: null, status: 'pending',
      channel, message: renderTemplate(tpls.confirmation, vars),
    },
    {
      id: uid(), appointment_id: appt.id, stage: 'midway',
      scheduled_at: midway.toISOString(), sent_at: null, status: 'pending',
      channel, message: renderTemplate(tpls.midway, vars),
    },
    {
      id: uid(), appointment_id: appt.id, stage: 'day_of',
      scheduled_at: dayOf.toISOString(), sent_at: null, status: 'pending',
      channel, message: renderTemplate(tpls.day_of, vars),
    },
  ];

  await supabase.from('reminders').delete().eq('appointment_id', appt.id);
  await supabase.from('reminders').insert(rows);
}

export async function tickReminders(): Promise<number> {
  const now = new Date();
  const { data: pending, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', now.toISOString());

  if (error || !pending?.length) return 0;

  let sent = 0;
  for (const r of pending) {
    await supabase.from('reminders').update({ status: 'sent', sent_at: now.toISOString() }).eq('id', r.id);
    sent++;

    const appt = await getAppointment(r.appointment_id);
    const clinic = appt ? await getClinic(appt.clinicId) : undefined;

    if (appt && clinic && appt.patientEmail) {
      const scheduledFor = new Date(appt.scheduledFor);
      fetch('/api/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: appt.patientEmail,
          patientName: appt.patientName,
          clinicName: clinic.name,
          doctorName: clinic.doctorName,
          service: appt.service,
          date: scheduledFor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
          time: scheduledFor.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          stage: r.stage,
          message: r.message,
        }),
      }).catch(err => console.error('Email send failed:', err));
    }
  }

  return sent;
}

// ---------- Demo seeding ----------

export async function ensureDemoAccount() {
  if (!isClient()) return;
  const existing = await getClinicByEmail('demo@bloom.com');
  if (existing) return;

  const clinic = await createClinic({
    name: 'Aurora Family Clinic',
    doctorName: 'Sarah Khan',
    email: 'demo@bloom.com',
    phone: '+92 300 1234567',
    specialty: 'General Practice',
    password: 'demo1234',
  });

  await updateClinic(clinic.id, {
    onboardingComplete: true,
    services: [
      { id: uid(), name: 'General Consultation', durationMin: 30 },
      { id: uid(), name: 'Follow-up', durationMin: 15 },
      { id: uid(), name: 'Annual Checkup', durationMin: 45 },
    ],
    channels: [
      { channel: 'website', connected: true, connectedAt: new Date().toISOString() },
      { channel: 'whatsapp', connected: true, connectedAt: new Date().toISOString(), handle: '+92 300 1234567' },
      { channel: 'instagram', connected: true, connectedAt: new Date().toISOString(), handle: '@auroraclinic' },
      { channel: 'facebook', connected: false },
      { channel: 'email', connected: true, connectedAt: new Date().toISOString(), handle: 'hello@auroraclinic.com' },
    ],
  });
}
