interface Report {
  id: string;
  projectId: string;
  issues: unknown[];
  performanceScore: number;
  aiSuggestions: unknown[];
  createdAt: string;
}

const reports: Report[] = [];

export function createReport(projectId: string, report: Omit<Report, 'id' | 'createdAt'>) {
  const record: Report = {
    id: `report-${reports.length + 1}`,
    createdAt: new Date().toISOString(),
    ...report,
    projectId
  };
  reports.push(record);
  return record;
}

export function getLatestReport(projectId: string) {
  return reports
    .filter((report) => report.projectId === projectId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}

