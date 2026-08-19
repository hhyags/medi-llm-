'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Headphones,
  User,
  Building2,
  AlertCircle
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isFirebaseMode } = useAuth();
  const [email, setEmail] = useState('admin1@medflow.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to /dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const res = await login(email, password);
    setIsSubmitting(false);
    if (!res.success) {
      setError(res.error || 'Authentication failed.');
    }
  };

  const sampleAccounts = [
    {
      role: 'Admin 1 (Hospital A)',
      name: 'Elena Rostova',
      email: 'admin1@medflow.com',
      icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
      tag: 'Hospital A'
    },
    {
      role: 'Admin 2 (Hospital A)',
      name: 'Marcus Vance',
      email: 'admin2@medflow.com',
      icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
      tag: 'Hospital A'
    },
    {
      role: 'Doctor 1 (Hospital A)',
      name: 'Dr. Meera Patel, MD',
      email: 'doctor1@medflow.com',
      icon: <Stethoscope className="w-4 h-4 text-emerald-600" />,
      tag: 'Hospital A'
    },
    {
      role: 'Receptionist 1 (Hospital A)',
      name: 'Sarah Jenkins',
      email: 'reception1@medflow.com',
      icon: <Headphones className="w-4 h-4 text-sky-600" />,
      tag: 'Hospital A'
    },
    {
      role: 'Patient 1 (Hospital A)',
      name: 'Rahul Sharma',
      email: 'patient1@gmail.com',
      icon: <User className="w-4 h-4 text-amber-600" />,
      tag: 'Hospital A'
    },
    {
      role: 'Admin 3 (Hospital B)',
      name: 'Dr. David Vance',
      email: 'admin3@medflow.com',
      icon: <Building2 className="w-4 h-4 text-rose-600" />,
      tag: 'Hospital B (St. Jude)'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        
        {/* Brand Logo */}
        <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-500 mx-auto flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-sky-500/25 mb-4">
          M+
        </div>

        <div className="flex items-center justify-center gap-2 mb-1">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">MedFlow AI CRM</h2>
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-sky-100 text-sky-700 border border-sky-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-600" />
            Enterprise
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
          Hospital Management & Autonomous AI Voice Calling System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-900/5 rounded-3xl border border-slate-200/90 space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hospital Email / Account
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin1@medflow.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          {/* Instant 1-Click Role & Hospital Test Matrix */}
          <div className="pt-4 border-t border-slate-100">
            <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              ⚡ 1-Click Multi-Admin & Multi-Hospital Test Accounts:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('password123');
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-start justify-between ${
                    email === acc.email
                      ? 'bg-sky-50 border-sky-300 ring-1 ring-sky-300'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">{acc.icon}</div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{acc.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{acc.email}</div>
                      <div className="text-[9px] text-sky-700 font-bold mt-0.5">{acc.role}</div>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-white text-slate-600 border border-slate-200">
                    {acc.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6 flex items-center justify-center gap-1.5">
          {isFirebaseMode ? (
            <>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Firebase Authentication &amp; Firestore Security Rules active
            </>
          ) : (
            <>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Offline demo mode — add Firebase credentials to enable live auth
            </>
          )}
        </p>
      </div>
    </div>
  );
}
