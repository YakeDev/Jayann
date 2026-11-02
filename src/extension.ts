import * as vscode from 'vscode';
import { JayannPanel } from './panel';
import { safeTopLevelEntries, TopLevelEntry } from './projectOverview';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Jayann');
  context.subscriptions.push(output);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('jayann.sidebar', new JayannPanel()),
    vscode.commands.registerCommand('jayann.inspectWorkspace', async () => {
      if (!vscode.workspace.isTrusted) {
        await vscode.window.showWarningMessage('Jayann: Trust this workspace before inspecting it.');
        return;
      }

      const folders = vscode.workspace.workspaceFolders;
      if (!folders?.length) {
        await vscode.window.showInformationMessage('Jayann: Open a folder or workspace first.');
        return;
      }

      output.clear();
      output.appendLine('Jayann · Local workspace overview');
      output.appendLine('No files are uploaded or modified. Only top-level names are listed.');
      for (const folder of folders) {
        output.appendLine('');
        output.appendLine('Workspace: ' + folder.name);
        try {
          const raw = await vscode.workspace.fs.readDirectory(folder.uri);
          const entries: TopLevelEntry[] = raw.map(([name, kind]) => ({
            name,
            isDirectory: (kind & vscode.FileType.Directory) !== 0
          }));
          const shown = safeTopLevelEntries(entries);
          for (const entry of shown) {
            output.appendLine((entry.isDirectory ? '[dir]  ' : '[file] ') + entry.name);
          }
          if (entries.length > shown.length) {
            output.appendLine('(Some entries hidden or limited for safety.)');
          }
          if (!shown.length) output.appendLine('(No visible top-level entries)');
        } catch {
          output.appendLine('Unable to read this workspace folder.');
        }
      }
      output.show(true);
    })
  );
}

export function deactivate(): void {}
