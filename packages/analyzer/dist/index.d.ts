interface AnalyzerIssue {
    file: string;
    type: string;
    line: number;
    column?: number;
    suggestion: string;
    severity: "error" | "warning" | "info";
    details?: Record<string, any>;
}
interface AnalyzeOptions {
    rules?: string[];
}

interface AnalyzerReport {
    issues: AnalyzerIssue[];
    componentsScanned: number;
    filesScanned: number;
    summary: {
        errors: number;
        warnings: number;
        info: number;
    };
}
/**
 * Main analyzer function - scans project and detects React issues
 */
declare function analyzeProject(projectPath: string, options?: AnalyzeOptions): AnalyzerReport;
declare function getRuleNames(): string[];

export { type AnalyzerIssue, type AnalyzerReport, analyzeProject, getRuleNames };
