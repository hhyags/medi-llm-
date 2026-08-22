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
  AlertCircle,
  UserPlus,
  LogIn
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, signup, isAuthenticated, isFirebaseMode } = useAuth();
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin1@medflow.com');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<'admin' | 'doctor' | 'receptionist' | 'patient'>('admin');
  const [hospitalId, setHospitalId] = useState<'hospital_001' | 'hospital_002'>('hospital_001');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

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

    if (isSignUpMode) {
      if (!name.trim()) {
        setError('Please enter your full name.');
        setIsSubmitting(false);
        return;
      }
      const res = await signup(email, password, name, role, hospitalId);
      setIsSubmitting(false);
      if (!res.success) {
        setError(res.error || 'Account creation failed.');
      }
    } else {
      const res = await login(email, password);
      setIsSubmitting(false);
      if (!res.success) {
        setError(res.error || 'Authentication failed.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleSubmitting(true);
    const res = await loginWithGoogle();
    setIsGoogleSubmitting(false);
    if (!res.success) {
      setError(res.error || 'Google Sign-In failed.');
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
      email: 'patient1@medflow.com',
      icon: <User className="w-4 h-4 text-amber-600" />,
      tag: 'Hospital A'
    },
    {
      role: 'Admin 3 (Hospital B)',
      name: 'Dr. Linda Hayes',
      email: 'admin_b@medflow.com',
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
          Hospital Management &amp; Autonomous AI Voice Calling System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-900/5 rounded-3xl border border-slate-200/90 space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{typeof error === 'object' ? (error as any)?.message || JSON.stringify(error) : String(error)}</span>
            </div>
          )}

          {/* Google Sign-in Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleSubmitting || isSubmitting}
              className="w-full py-2.5 px-4 border border-slate-200 hover:border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleSubmitting ? 'Connecting with Google...' : 'Continue with Google Account'}</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-white px-3 text-slate-400">Or use email &amp; password</span>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setIsSignUpMode(false); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !isSignUpMode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUpMode(true); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isSignUpMode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Account</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUpMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Sarah Johnson"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>
            )}

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

            {isSignUpMode && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 font-medium"
                  >
                    <option value="admin">Admin</option>
                    <option value="doctor">Doctor</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="patient">Patient</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hospital Facility
                  </label>
                  <select
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 font-medium"
                  >
                    <option value="hospital_001">City Memorial (001)</option>
                    <option value="hospital_002">St. Jude Medical (002)</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isGoogleSubmitting}
              className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
            >
              <span>
                {isSubmitting
                  ? (isSignUpMode ? 'Creating Account...' : 'Authenticating...')
                  : (isSignUpMode ? 'Create Hospital Account' : 'Sign In to Workspace')}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          {/* Instant 1-Click Role & Hospital Test Matrix */}
          <div className="pt-4 border-t border-slate-100">
            <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              ⚡ 1-Click Multi-Admin &amp; Multi-Hospital Test Accounts:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setIsSignUpMode(false);
                    setEmail(acc.email);
                    setPassword('password123');
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-start justify-between ${
                    email === acc.email && !isSignUpMode
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

        <p className="text-center text-[11px] text-slate-500 mt-6 flex items-center justify-center gap-1.5 font-medium">
          {isFirebaseMode ? (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Connected to Firebase Project: <strong className="text-slate-800 font-mono font-bold">medi-3faa5</strong></span>
            </>
          ) : (
            <>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Offline demo mode</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
