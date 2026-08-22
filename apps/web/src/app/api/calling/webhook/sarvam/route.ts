import { NextResponse } from 'next/server';
import { POST as mainWebhookPost, GET as mainWebhookGet } from '../route';

export async function POST(request: Request) {
  return mainWebhookPost(request);
}

export async function GET(request: Request) {
  return mainWebhookGet();
}
