import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '../context/AuthContext';
import { MedFlowProvider } from '../context/MedFlowContext';

export const metadata: Metadata = {
  title: 'MedFlow AI CRM — Hospital Management & AI Voice Calling System',
  description: 'Multi-hospital management CRM with enterprise Role-Based Access Control and automated AI voice calling agents.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen bg-slate-100/60 font-sans">
        <AuthProvider>
          <MedFlowProvider>
            {children}
          </MedFlowProvider>
        </AuthProvider>
      </body>
    </html>
  );
}