import { NextResponse } from 'next/server';
import { listRuns, getLatestReview } from '@reactpilot/github-review';

export async function GET() {
  try {
    const runs = listRuns(50);
    const review = getLatestReview();
    return NextResponse.json({ runs, review });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

