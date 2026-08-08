import * as vscode from 'vscode';
import { analyzeProject } from '@reactpilot/analyzer';

export function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('reactpilot');

  const analyzeCurrentDocument = (document: vscode.TextDocument) => {
    if (!['typescriptreact', 'javascriptreact', 'typescript', 'javascript'].includes(document.languageId)) {
      return;
    }

    try {
      const report = analyzeProject(document.fileName);
      const diagnostics: vscode.Diagnostic[] = report.issues.map((issue) => {
        const line = Math.max(0, (issue.line ?? 1) - 1);
        const range = new vscode.Range(line, 0, line, 100);
        const severity =
          issue.severity === 'error'
            ? vscode.DiagnosticSeverity.Error
            : issue.severity === 'warning'
            ? vscode.DiagnosticSeverity.Warning
            : vscode.DiagnosticSeverity.Information;

        const diag = new vscode.Diagnostic(range, `[ReactPilot] ${issue.suggestion}`, severity);
        diag.source = 'ReactPilot';
        diag.code = issue.type;
        return diag;
      });

      diagnosticCollection.set(document.uri, diagnostics);
    } catch {
      diagnosticCollection.delete(document.uri);
    }
  };

  const analyzeCommand = vscode.commands.registerCommand('reactpilot.analyzeFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Please open a React file to analyze.');
      return;
    }
    analyzeCurrentDocument(editor.document);
    const count = diagnosticCollection.get(editor.document.uri)?.length ?? 0;
    vscode.window.showInformationMessage(`ReactPilot Analysis: ${count} issue(s) detected.`);
  });

  const fixCommand = vscode.commands.registerCommand('reactpilot.fixFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    vscode.window.showInformationMessage(
      'Run "reactpilot fix" in your terminal to apply AI patches with AST validation.'
    );
  });

  const onSave = vscode.workspace.onDidSaveTextDocument((document) => {
    analyzeCurrentDocument(document);
  });

  context.subscriptions.push(diagnosticCollection, analyzeCommand, fixCommand, onSave);
}

export function deactivate() {}
