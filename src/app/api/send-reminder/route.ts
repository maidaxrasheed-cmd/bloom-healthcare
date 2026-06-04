import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { to, patientName, clinicName, doctorName, service, date, time, stage, message } = await req.json();

  if (!to || !to.includes('@')) {
    return NextResponse.json({ skipped: true });
  }

  const subjects: Record<string, string> = {
    confirmation: `Appointment confirmed - ${clinicName}`,
    midway: `Reminder: Your appointment is coming up`,
    day_of: `Your appointment is TODAY at ${time}`,
  };

  try {
    const { data, error } = await resend.emails.send({
      from: `Bloom Healthcare <reminders@booking.jandland.com>`,
      to: [to],
      subject: subjects[stage] ?? `Reminder from ${clinicName}`,
      html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px;"><div style="background:#384f37;color:white;padding:24px;border-radius:8px;margin-bottom:24px;"><h1 style="margin:0;font-size:22px;">${subjects[stage]}</h1></div><p>Hi <strong>${patientName}</strong>,</p><div style="background:#f5f0e8;border-radius:8px;padding:20px;margin:20px 0;"><p style="margin:8px 0;"><strong>Clinic:</strong> ${clinicName}</p><p style="margin:8px 0;"><strong>Doctor:</strong> ${doctorName}</p><p style="margin:8px 0;"><strong>Service:</strong> ${service}</p><p style="margin:8px 0;"><strong>Date:</strong> ${date}</p><p style="margin:8px 0;"><strong>Time:</strong> ${time}</p></div><p>${message}</p><p style="color:#999;font-size:13px;">Powered by Bloom Healthcare</p></div>`,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error('Send reminder failed:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}