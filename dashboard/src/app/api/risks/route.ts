import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000';
const MOCK_TOKEN = 'mock-admin-token';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/batches/risks`, {
      headers: { Authorization: `Bearer ${MOCK_TOKEN}` },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
