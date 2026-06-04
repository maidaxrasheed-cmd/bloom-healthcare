import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bloom Healthcare — Patient bookings for modern clinics',
  description: 'Automated bookings and reminders across WhatsApp, Instagram, Facebook, your website, and email — all in one dashboard.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="noise">
        {children}
      </body>
    </html>
  );
}
