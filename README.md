# Bloom Healthcare

A unified appointment management platform for clinics. Bookings from **Instagram, Facebook, WhatsApp, your website, email, or manual entry** all land in one dashboard. Every booking automatically schedules **three patient reminders** (confirmation, midway, day-of).

Built for pilot rollout with small clinics in Pakistan.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To build for production:

```bash
npm run build
npm run start
```

---

## Demo Account

For the fastest tour, click **"Use demo account"** on the login page, or sign in manually:

| Field | Value |
| --- | --- |
| Email | `demo@bloom.com` |
| Password | `demo1234` |
| Clinic | Aurora Family Clinic |

The demo clinic is pre-seeded with 6 appointments across all channels (Instagram, WhatsApp, Facebook, website, email, manual) so the dashboard isn't empty on first view.

---

## The Full Flow (what to show clinics)

1. **Landing page** (`/`) → click **Start free trial**
2. **Signup** (`/signup`) → fill clinic name, email, password → account is created and you're auto-logged in
3. **Onboarding wizard** (`/onboarding`) → 4 quick steps: hours → services → channels → reminder templates
4. **Dashboard** (`/dashboard`) → see today's overview, channel mix, upcoming list
5. **Appointments** (`/dashboard/appointments`) → filter by channel, status, date; create new manually; click any row for detail drawer
6. **Public booking widget** (`/book/{your-slug}`) → share this URL with patients; bookings land live in the dashboard
7. **Simulator** (`/dashboard/simulator`) → for live pitches: fake bookings from Instagram/WhatsApp/etc. appear on your dashboard in real-time

---

## Page Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/signup` | Create clinic account |
| `/login` | Sign in (with demo button) |
| `/onboarding` | 4-step setup wizard (hours, services, channels, reminders) |
| `/dashboard` | Overview: stats, upcoming, channel mix |
| `/dashboard/appointments` | Filterable list + manual booking + detail drawer |
| `/dashboard/channels` | Connect channels, copy public booking link & embed code |
| `/dashboard/reminders` | All reminders, status, message preview |
| `/dashboard/settings` | Edit clinic info, hours, services, reminder templates |
| `/dashboard/simulator` | Demo tool — inject sample bookings live |
| `/book/[slug]` | Public patient-facing booking widget |

---

## How Reminders Work

Every appointment — manual or from any channel — automatically schedules three reminders:

1. **Confirmation** — sent immediately when the booking is created
2. **Midway** — sent at the midpoint between booking time and appointment time
3. **Day-of** — sent at 8:00 AM on the appointment date

Templates are fully customizable in Settings and support variables: `{{patient}}`, `{{clinic}}`, `{{doctor}}`, `{{service}}`, `{{date}}`, `{{time}}`.

The reminder engine runs every 5 seconds in the dashboard, flipping pending → sent as scheduled times pass. For pilot demos you can briefly see all three states.

---

## What's Working vs Coming Soon

### Fully Working
- ✅ Landing, signup, login, onboarding
- ✅ Dashboard with stats and upcoming list
- ✅ Appointments page (filter, search, create, detail drawer, status updates)
- ✅ Manual appointment creation
- ✅ **Public website booking widget** — patients book themselves at `/book/{slug}`, appears live on dashboard
- ✅ Three-stage automated reminder engine
- ✅ Channel mix breakdown
- ✅ Settings (edit hours, services, reminder templates)

### Coming Soon (toggles visible in Channels page)
- 🚧 Instagram DM bot — requires Meta App Review (~2 weeks)
- 🚧 Facebook Messenger bot — requires Meta App Review
- 🚧 WhatsApp Business bot — requires Meta WhatsApp Business API approval (~1–4 weeks)
- 🚧 Email parser bot — IMAP listener + LLM intent classifier

The simulator page lets you demo what these will look like once approved.

---

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS 3.4**
- **lucide-react** for icons
- **date-fns** for date handling
- **localStorage** as the data layer (zero backend setup for pilot)

### Why localStorage?

For a 3–4 clinic pilot, this means zero infra cost, zero auth complexity, and clinics can play with the product immediately. The store layer in `src/lib/store.ts` has a clean interface — swap it for Supabase/Postgres calls without touching any UI code when you're ready to scale.

---

## Design System

- **Display font:** Fraunces (with italic accents for editorial feel)
- **Body font:** Plus Jakarta Sans
- **Mono font:** JetBrains Mono (for small-caps labels)
- **Palette:** sage green (`#5a7c56`, `#384f37`) + cream (`#faf7f2`) + bone (`#f5f0e8`) + ink (`#1a1f1a`) + terracotta accent (`#c97b4a`)

The aesthetic is editorial / refined-clinical — generous whitespace, italic display headlines, subtle noise overlay. Designed to feel different from generic SaaS dashboards and trustworthy enough for healthcare professionals.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Fonts, CSS vars, animations
│   ├── signup/page.tsx
│   ├── login/page.tsx
│   ├── onboarding/page.tsx
│   ├── book/[slug]/page.tsx  # Public patient widget
│   └── dashboard/
│       ├── page.tsx
│       ├── appointments/page.tsx
│       ├── channels/page.tsx
│       ├── reminders/page.tsx
│       ├── settings/page.tsx
│       └── simulator/page.tsx
├── components/
│   ├── DashboardLayout.tsx   # Sidebar + reminder tick loop
│   └── Logo.tsx
└── lib/
    └── store.ts              # All data + reminder scheduling logic
```

---

## Pilot Rollout Checklist

When you're ready to share with clinics:

1. **Deploy to Vercel** — `vercel --prod` from the project root
2. **Generate unique slugs per clinic** — the booking widget already uses `clinic.bookingSlug`; each signup generates a unique one
3. **Record the 60-second "coming soon" videos** — the Channels page has placeholders for Instagram, WhatsApp, Facebook, email
4. **For real reminder delivery** — wire up Twilio (SMS/WhatsApp) and SendGrid (email) into `tickReminders()` in `src/lib/store.ts`. Currently reminders flip to "sent" status; the actual send is stubbed.
5. **When scaling past 4 clinics** — swap `store.ts` from localStorage to Supabase. Add Row-Level Security so clinics can't see each other's data.

---

## Important Caveats for Pilot Clinics

- Data is currently stored in the **clinic's browser** (localStorage). If they clear browser data, they lose their appointments. Make sure they understand this is a working preview, not production. Move to Supabase before charging anyone.
- Reminders are scheduled and visually progress through pending → sent, but actual SMS/email delivery is not yet wired up. Plug in Twilio + SendGrid in `tickReminders()` before pilot launch if you want real delivery.
- Channel bots (Instagram, WhatsApp, etc.) need Meta API approval. Use the simulator to demo what they'll look like.

---

Built with care for the Pakistani clinic market.
