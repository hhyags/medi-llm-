'use client';

import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import PatientsView from '../../components/patients/PatientsView';

export default function PatientsPage() {
  return (
    <AppLayout resource="patients" action="read">
      <PatientsView />
    </AppLayout>
  );
}
