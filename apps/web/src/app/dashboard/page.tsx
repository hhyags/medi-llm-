'use client';

import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import DashboardView from '../../components/dashboard/DashboardView';

export default function DashboardPage() {
  return (
    <AppLayout resource="dashboard" action="read">
      <DashboardView />
    </AppLayout>
  );
}
