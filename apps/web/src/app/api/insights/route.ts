import { NextResponse } from 'next/server';
import { resolveProjectRoot } from '@reactpilot/project-chat';
import { getDashboardSnapshot } from '../../../lib/dashboard-data';
import { getReactPilotVersionInfo } from '../../../lib/reactpilot-version';

export async function GET() {
  try {
    const projectRoot = resolveProjectRoot(process.cwd());
    const [data, reactpilot] = await Promise.all([
      Promise.resolve(getDashboardSnapshot()),
      getReactPilotVersionInfo(projectRoot),
    ]);

    return NextResponse.json({
      project: data.project,
      graph: data.graph,
      migration: data.migration,
      setup: data.setup,
      plugins: data.plugins,
      unusedNodes: data.graph?.unusedNodes ?? [],
      circularCycles: data.graph?.circularCycles ?? [],
      reactpilot,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
