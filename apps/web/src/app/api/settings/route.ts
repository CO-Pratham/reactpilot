import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

// .env is at the monorepo root directory
const ENV_PATH = path.join(process.cwd(), '../../.env');

export async function GET() {
  let envContent = '';
  if (fs.existsSync(ENV_PATH)) {
    envContent = fs.readFileSync(ENV_PATH, 'utf-8');
  }

  const variables: Record<string, string> = {};
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      variables[key] = val;
    }
  });

  return NextResponse.json({
    apiKey: variables.REACTPILOT_API_KEY || '',
    apiBaseUrl: variables.REACTPILOT_API_BASE_URL || '',
    model: variables.REACTPILOT_MODEL || '',
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey, apiBaseUrl, model } = body;

    const envLines = [
      `REACTPILOT_API_KEY=${apiKey || ''}`,
      `REACTPILOT_API_BASE_URL=${apiBaseUrl || ''}`,
      `REACTPILOT_MODEL=${model || ''}`,
      ''
    ];

    fs.writeFileSync(ENV_PATH, envLines.join('\n'), 'utf-8');
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
