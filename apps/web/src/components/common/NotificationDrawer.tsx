'use client';

import React from 'react';
import { useMedFlow } from '../../context/MedFlowContext';
import {
  X,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Check,
  Headphones
} from 'lucide-react';

export default function NotificationDrawer() {
  const {
    isNotificationDrawerOpen,
    setIsNotificationDrawerOpen,
    notifications,
    markNotificationAsRead,
    resolveCallback,
    setSelectedPatientId
  } = useMedFlow();

  if (!isNotificationDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-4 px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Hospital Alerts & Escalations</h3>
              <p className="text-[11px] text-slate-500">{notifications.filter(n => !n.isRead).length} Unread Notifications</p>
            </div>
          </div>

          <button
            onClick={() => setIsNotificationDrawerOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No notifications at this time.
            </div>
          ) : (
            notifications.map((n) => {
              const isUrgent = n.severity === 'urgent';
              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    !n.isRead
                      ? isUrgent
                        ? 'bg-rose-50/60 border-rose-200 shadow-xs'
                        : 'bg-amber-50/60 border-amber-200 shadow-xs'
                      : 'bg-slate-50 border-slate-200/80 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {isUrgent ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                        ) : n.type === 'callback_request' ? (
                          <Headphones className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Info className="w-4 h-4 text-sky-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                        <p className="text-xs text-slate-700 mt-1 leading-relaxed">{typeof n.message === 'object' ? (n.message as any)?.message || JSON.stringify(n.message) : String(n.message)}</p>
                        <span className="text-[10px] text-slate-400 font-mono mt-1.5 block">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-black/5 flex items-center justify-between text-xs">
                    {n.relatedPatientId && (
                      <button
                        onClick={() => {
                          setSelectedPatientId(n.relatedPatientId!);
                          setIsNotificationDrawerOpen(false);
                        }}
                        className="text-sky-700 font-bold hover:underline"
                      >
                        View Patient Profile →
                      </button>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                      {n.relatedCallId && !n.isRead && (
                        <button
                          onClick={() => resolveCallback(n.relatedCallId!)}
                          className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold"
                        >
                          Resolve
                        </button>
                      )}
                      {!n.isRead && (
                        <button
                          onClick={() => markNotificationAsRead(n.id)}
                          className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-semibold"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
