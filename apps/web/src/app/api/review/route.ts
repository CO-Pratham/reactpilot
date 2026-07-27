import { NextResponse } from 'next/server';
import { getLatestReview } from '@reactpilot/github-review';

export async function GET() {
  try {
    const review = getLatestReview();
    if (!review) {
      return NextResponse.json({ review: null });
    }
    return NextResponse.json({ review });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
