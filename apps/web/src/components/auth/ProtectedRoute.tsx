'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { AppResource, hasPermission } from '../../lib/auth/permissions';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: React.ReactNode;
  resource?: AppResource;
  action?: 'read' | 'create' | 'update' | 'delete';
}

export default function ProtectedRoute({
  children,
  resource = 'dashboard',
  action = 'read'
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, role, loading, hospital } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-semibold tracking-wide">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check role permissions for this specific resource & action
  const isAllowed = hasPermission(role, resource, action);

  if (!isAllowed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card rounded-3xl p-8 text-center space-y-4 border-rose-200 shadow-xl shadow-rose-950/5">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 uppercase tracking-wider">
              HTTP 403 Forbidden
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-2">Access Restricted</h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Your active role (<strong className="capitalize text-slate-900">{role}</strong> at {hospital?.name || 'this hospital'}) does not have sufficient permissions to access the <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-rose-600 text-[11px]">{pathname}</code> module.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 text-left space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> Security Policy:
            </div>
            <p>Role-Based Access Control (RBAC) is strictly enforced via Firestore Security Rules and server-side authorization.</p>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to My Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
