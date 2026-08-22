'use client';

import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import PatientAssistantView from '../../components/chat/PatientAssistantView';

export default function ChatPage() {
  return (
    <AppLayout resource="chat" action="read">
      <PatientAssistantView />
    </AppLayout>
  );
}
