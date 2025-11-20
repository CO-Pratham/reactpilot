import * as vscode from 'vscode';
import { analyzeProject } from '../../../packages/analyzer/src/index.js';

export function activate(context: vscode.ExtensionContext) {
  const analyzeCommand = vscode.commands.registerCommand('reactpilot.analyzeFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Open a file to analyze.');
      return;
    }
    const filePath = editor.document.uri.fsPath;
    const report = analyzeProject(filePath);
    vscode.window.showInformationMessage(`ReactPilot scanned ${report.componentsScanned} files`);
  });

  const fixCommand = vscode.commands.registerCommand('reactpilot.fixFile', async () => {
    vscode.window.showInformationMessage('Fix command coming soon.');
  });

  context.subscriptions.push(analyzeCommand, fixCommand);
}

export function deactivate() {}

