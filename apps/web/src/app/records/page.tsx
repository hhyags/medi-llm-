'use client';

import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import RecordsView from '../../components/records/RecordsView';

export default function RecordsPage() {
  return (
    <AppLayout resource="records" action="read">
      <RecordsView />
    </AppLayout>
  );
}
