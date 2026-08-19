'use client';

import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import AICallingView from '../../components/calling/AICallingView';

export default function CallingPage() {
  return (
    <AppLayout resource="calling" action="read">
      <AICallingView />
    </AppLayout>
  );
}
