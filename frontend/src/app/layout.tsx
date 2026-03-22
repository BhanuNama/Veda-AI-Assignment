import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { ToastContainer } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'VedaAI – AI Assessment Creator',
  description: 'Create AI-powered question papers for your students',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="font-sans antialiased" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('veda-theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.remove('dark','light');document.documentElement.classList.add(t);})()`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen font-sans antialiased">
        <ThemeProvider />
        {/* Desktop floating sidebar — 308px + 16px + 16px gap = 340px offset */}
        <Sidebar />
        {/* Mobile floating header */}
        <MobileHeader />
        {/* Main content */}
        <div className="flex-1 lg:ml-[340px] flex flex-col min-h-screen min-w-0 pt-[94px] lg:pt-0 pb-[132px] lg:pb-0 w-full max-w-full figma-main-canvas">
          {children}
        </div>
        <BottomNav />
        <ToastContainer />
      </body>
    </html>
  );
}
