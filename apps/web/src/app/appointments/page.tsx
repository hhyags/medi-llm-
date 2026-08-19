'use client';

import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import AppointmentsView from '../../components/appointments/AppointmentsView';

export default function AppointmentsPage() {
  return (
    <AppLayout resource="appointments" action="read">
      <AppointmentsView />
    </AppLayout>
  );
}
