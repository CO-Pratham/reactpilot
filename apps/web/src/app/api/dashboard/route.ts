import { NextResponse } from 'next/server';
import { getDashboardSnapshot } from '../../../lib/dashboard-data';

export async function GET() {
  try {
    return NextResponse.json(getDashboardSnapshot());
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
