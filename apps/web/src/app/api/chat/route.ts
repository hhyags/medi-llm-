import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, session_id } = body;

    if (!message) {
      return NextResponse.json(
        { response: 'Please provide a message.' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, session_id: session_id || 'web_session' }),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error (${response.status}):`, errorText);
      return NextResponse.json({
        response: 'The hospital virtual assistant service is temporarily busy. Please try again shortly.',
        action_taken: 'SERVICE_BUSY'
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in chat proxy API:', error);
    return NextResponse.json({
      response: 'Unable to connect to the hospital virtual assistant backend. Please verify that the API server is running.',
      action_taken: 'NETWORK_ERROR'
    });
  }
}