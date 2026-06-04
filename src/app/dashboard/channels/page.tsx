'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getSession, getClinic, updateClinic, type Clinic, type Channel } from '@/lib/store';
import { Instagram, MessageCircle, Globe, Mail, Facebook, Copy, Check, ExternalLink, Play, Clock } from 'lucide-react';

const channelMeta = {
  website: {
    icon: Globe, name: 'Website widget', color: 'sage',
    description: 'Embed a booking form on your clinic website.',
    status: 'live',
  },
  whatsapp: {
    icon: MessageCircle, name: 'WhatsApp', color: 'green',
    description: 'Patients message your WhatsApp number — bot handles booking.',
    status: 'soon',
  },
  instagram: {
    icon: Instagram, name: 'Instagram DM', color: 'pink',
    description: 'Auto-respond to Instagram DMs and book appointments.',
    status: 'soon',
  },
  facebook: {
    icon: Facebook, name: 'Facebook Messenger', color: 'blue',
    description: 'Same as Instagram, for your Facebook page.',
    status: 'soon',
  },
  email: {
    icon: Mail, name: 'Email parsing', color: 'amber',
    description: 'Patients email a dedicated inbox; bot parses and books.',
    status: 'soon',
  },
} as const;

export default function ChannelsPage() {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession(); if (!session) return;
    const c = getClinic(session.clinicId); if (!c) return;
    setClinic(c);
  }, []);

  if (!clinic) return <DashboardLayout><div /></DashboardLayout>;

  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${clinic.bookingSlug}`;
  const embedCode = `<iframe src="${url}" width="100%" height="700" frameborder="0"></iframe>`;

  const toggle = (channel: Channel) => {
    const chs = clinic.channels.map(c => c.channel === channel ? { ...c, connected: !c.connected, connectedAt: new Date().toISOString() } : c);
    const updated = updateClinic(clinic.id, { channels: chs });
    if (updated) setClinic(updated);
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(null), 1500);
  };

  return (
    <DashboardLayout>
      <div className="p-8 md:p-12 max-w-5xl mx-auto w-full">
        <p className="ft-xs uppercase tracking-widest text-sage-700 font-mono mb-2">Channels</p>
        <h1 className="font-display text-4xl md:text-5xl mb-3">Where patients <em className="italic font-light text-sage-700">find you.</em></h1>
        <p className="text-ink/65 mb-10">Each connected channel lands bookings directly in your dashboard.</p>

        {/* Booking link card */}
        <div className="bg-sage-700 text-cream rounded-3xl p-8 mb-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 90% 10%, rgba(255,255,255,0.5), transparent 50%)' }} />
          <div className="relative">
            <p className="ft-xs uppercase tracking-widest text-sage-300 font-mono mb-3">Your public booking link</p>
            <h2 className="font-display ft-xl mb-6">Share anywhere a patient might find you.</h2>

            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-sage-300 mb-1.5 font-mono">URL</div>
                <div className="flex items-center gap-2 bg-sage-800 rounded-lg px-4 py-3">
                  <code className="flex-1 ft-base text-cream/90 font-mono truncate">{url}</code>
                  <a href={url} target="_blank" rel="noopener" className="text-cream/70 hover:text-cream"><ExternalLink className="w-3.5 h-3.5" /></a>
                  <button onClick={() => copy(url, 'url')} className="ft-xs bg-cream text-ink px-3 py-1.5 rounded-full hover:bg-cream/90 flex items-center gap-1.5">
                    {copied === 'url' ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-sage-300 mb-1.5 font-mono">Website embed code</div>
                <div className="flex items-center gap-2 bg-sage-800 rounded-lg px-4 py-3">
                  <code className="flex-1 ft-xs text-cream/80 font-mono truncate">{embedCode}</code>
                  <button onClick={() => copy(embedCode, 'embed')} className="ft-xs bg-cream text-ink px-3 py-1.5 rounded-full hover:bg-cream/90 flex items-center gap-1.5">
                    {copied === 'embed' ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Channel grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {clinic.channels.map(ch => {
            const meta = channelMeta[ch.channel];
            if (!meta) return null;
            const Icon = meta.icon;
            return (
              <div key={ch.channel} className="bg-bone border border-sage-200 rounded-2xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ch.connected ? 'bg-sage-700 text-cream' : 'bg-cream text-ink/40 border border-sage-200'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display ft-lg">{meta.name}</h3>
                      {meta.status === 'soon' && <span className="text-[10px] uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-mono">soon</span>}
                      {meta.status === 'live' && <span className="text-[10px] uppercase tracking-wider bg-sage-100 text-sage-700 px-1.5 py-0.5 rounded font-mono">live</span>}
                    </div>
                    <p className="ft-base text-ink/60 mt-1">{meta.description}</p>
                  </div>
                </div>

                {ch.connected && (ch.channel !== 'website') && (
                  <div className="bg-cream border border-sage-200 rounded-lg px-3 py-2 ft-xs text-ink/70 font-mono mb-3">
                    {ch.handle || 'No handle set'}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  {meta.status === 'soon' ? (
                    <button className="ft-xs text-sage-700 hover:text-sage-800 flex items-center gap-1.5">
                      <Play className="w-3 h-3" /> Watch 60s demo
                    </button>
                  ) : <span />}
                  <button onClick={() => toggle(ch.channel)}
                    className={`relative w-11 h-6 rounded-full transition ${ch.connected ? 'bg-sage-700' : 'bg-sage-200'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-cream transition ${ch.connected ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 bg-bone border border-dashed border-sage-300 rounded-2xl p-6 flex items-start gap-4">
          <Clock className="w-5 h-5 text-sage-700 mt-0.5" />
          <div>
            <h3 className="font-display ft-lg mb-1">Bot channels are rolling out</h3>
            <p className="ft-base text-ink/65">Instagram, Facebook, WhatsApp, and email parsing all require Meta App Review or business API setup (1–4 weeks). Toggle them on now to be in the early-access queue.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
