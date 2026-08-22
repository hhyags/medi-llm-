'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useMedFlow } from '../../context/MedFlowContext';
import { canAccessRoute } from '../../lib/auth/permissions';
import {
  LayoutDashboard,
  Users,
  Calendar,
  PhoneCall,
  FileText,
  Settings,
  Plus,
  Bell,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Headphones,
  User as UserIcon,
  ChevronDown,
  LogOut,
  Building2,
  Check,
  MessageSquare
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { profile, role, hospital, logout, switchDemoAccount } = useAuth();
  const {
    unreadNotificationCount,
    setIsNotificationDrawerOpen,
    setIsNewAppointmentOpen,
    setIsAddPatientOpen,
    openCallModal
  } = useMedFlow();

  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/patients', label: 'Patients', icon: <Users className="w-4 h-4" /> },
    { href: '/appointments', label: role === 'patient' ? 'My Visits' : 'Appointments', icon: <Calendar className="w-4 h-4" /> },
    { href: '/chat', label: 'Patient Assistant', icon: <MessageSquare className="w-4 h-4" /> },
    { href: '/calling', label: 'AI Calling', icon: <PhoneCall className="w-4 h-4" />, badge: 'Live Agent' },
    { href: '/records', label: role === 'patient' ? 'My Records' : 'Records Vault', icon: <FileText className="w-4 h-4" /> },
    { href: '/settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  // Filter visible tabs based on centralized permission matrix
  const visibleNavItems = navItems.filter((item) => canAccessRoute(role, item.href));

  // Role visual metadata
  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-purple-600" /> Admin</span>;
      case 'doctor':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1"><Stethoscope className="w-3 h-3 text-emerald-600" /> Doctor</span>;
      case 'receptionist':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1"><Headphones className="w-3 h-3 text-sky-600" /> Reception</span>;
      case 'patient':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1"><UserIcon className="w-3 h-3 text-amber-600" /> Patient</span>;
      default:
        return null;
    }
  };

  const demoAccounts = [
    { email: 'admin1@medflow.com', name: 'Elena Rostova', role: 'admin', hospital: 'Hospital A (City Memorial)' },
    { email: 'admin2@medflow.com', name: 'Marcus Vance', role: 'admin', hospital: 'Hospital A (City Memorial)' },
    { email: 'doctor1@medflow.com', name: 'Dr. Meera Patel', role: 'doctor', hospital: 'Hospital A (City Memorial)' },
    { email: 'doctor2@medflow.com', name: 'Dr. Arjun Verma', role: 'doctor', hospital: 'Hospital A (City Memorial)' },
    { email: 'reception1@medflow.com', name: 'Sarah Jenkins', role: 'receptionist', hospital: 'Hospital A (City Memorial)' },
    { email: 'patient1@gmail.com', name: 'Rahul Sharma', role: 'patient', hospital: 'Hospital A (City Memorial)' },
    { email: 'admin3@medflow.com', name: 'Dr. David Vance', role: 'admin', hospital: 'Hospital B (St. Jude Medical)' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3 text-left group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <span className="text-xl font-black tracking-tighter">M+</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-lg tracking-tight group-hover:text-sky-600 transition-colors">
                    MedFlow
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-gradient-to-r from-sky-100 to-indigo-100 text-sky-800 border border-sky-200/80 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-sky-600" />
                    AI CRM
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block truncate max-w-[210px]">
                  {hospital?.name || 'Healthcare System'}
                </p>
              </div>
            </Link>
          </div>

          {/* Center: Shared Routes Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70 shadow-xs">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.2 rounded-full bg-emerald-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions, Notifications, Account Switcher & Logout */}
          <div className="flex items-center gap-2.5">
            
            {/* Quick Action Dropdown */}
            {role !== 'patient' && (
              <div className="relative">
                <button
                  onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Action</span>
                  <ChevronDown className="w-3 h-3 opacity-80" />
                </button>

                {isQuickActionOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onClick={() => setIsQuickActionOpen(false)}
                  >
                    <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Operations Launcher
                    </div>
                    
                    {role !== 'doctor' && (
                      <button
                        onClick={() => setIsAddPatientOpen(true)}
                        className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium"
                      >
                        <Users className="w-4 h-4 text-sky-600" />
                        <span>Register New Patient</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsNewAppointmentOpen(true)}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium"
                    >
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>Book Appointment</span>
                    </button>

                    {role !== 'doctor' && (
                      <button
                        onClick={() => openCallModal()}
                        className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-bold text-sky-700"
                      >
                        <PhoneCall className="w-4 h-4 text-purple-600" />
                        <span>Start AI Voice Call</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Notification Bell */}
            {(role === 'receptionist' || role === 'admin') && (
              <button
                onClick={() => setIsNotificationDrawerOpen(true)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                title="Triage & Callback Alerts"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white animate-bounce">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile & Demo Switcher Menu */}
            <div className="relative">
              <button
                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs"
              >
                <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-extrabold text-[11px]">
                  {profile?.name ? profile.name[0] : 'U'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-[11px] font-extrabold text-slate-900 leading-tight">
                    {profile?.name}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono leading-tight">
                    {hospital?.name.split(' ')[0]} • <span className="capitalize text-slate-600 font-bold">{role}</span>
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
              </button>

              {isRoleMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setIsRoleMenuOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-slate-900 text-xs">{profile?.name}</span>
                      {getRoleBadge()}
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">{profile?.email}</p>
                    <p className="text-[10px] text-sky-700 font-bold mt-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {hospital?.name} ({hospital?.hospitalId})
                    </p>
                  </div>
                  
                  {/* Demo Account Switcher Header */}
                  <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Instant Demo Account Switcher
                  </div>

                  <div className="p-1 max-h-60 overflow-y-auto space-y-1">
                    {demoAccounts.map((acc) => {
                      const isCurrent = profile?.email === acc.email;
                      return (
                        <button
                          key={acc.email}
                          onClick={() => switchDemoAccount(acc.email)}
                          className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                            isCurrent ? 'bg-sky-50 border border-sky-200' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                              {acc.name}
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase bg-slate-100 text-slate-700">
                                {acc.role}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono">{acc.email}</p>
                            <p className="text-[9px] text-slate-400">{acc.hospital}</p>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-sky-600" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-2 border-t border-slate-100">
                    <button
                      onClick={logout}
                      className="w-full py-2 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-between overflow-x-auto py-2 border-t border-slate-100 gap-1">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-100 text-sky-900 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

      </div>
    </header>
  );
}
