import { NextResponse } from 'next/server';
import path from 'node:path';
import os from 'node:os';
import { listInstalledPlugins, fetchMarketplace } from '@reactpilot/plugin-system';

const PLUGINS_DIR = path.join(os.homedir(), '.reactpilot', 'plugins');
const CACHE_DIR = path.join(os.homedir(), '.reactpilot', 'cache');

export async function GET() {
  try {
    const installed = listInstalledPlugins(PLUGINS_DIR);
    const marketplace = await fetchMarketplace(CACHE_DIR);
    return NextResponse.json({ installed, marketplace });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
