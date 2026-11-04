import * as vscode from 'vscode';
import { JayannPanel } from './panel';
import { AuthController } from './authController';
import { safeTopLevelEntries, TopLevelEntry } from './projectOverview';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Jayann');
  context.subscriptions.push(output);

  let auth: AuthController;
  const panel = new JayannPanel({
    onReady: () => { auth.show(); void auth.refresh(); },
    connect: () => auth.connect(),
    refresh: () => auth.refresh(),
    disconnect: () => auth.disconnect(),
    inspect: async () => { await vscode.commands.executeCommand('jayann.inspectWorkspace'); }
  });
  auth = new AuthController(state => panel.updateAuthState(state));
  context.subscriptions.push(auth);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('jayann.sidebar', panel),
    vscode.commands.registerCommand('jayann.connectChatgpt', () => auth.connect()),
    vscode.commands.registerCommand('jayann.refreshAuth', () => auth.refresh()),
    vscode.commands.registerCommand('jayann.disconnectChatgpt', () => auth.disconnect()),
    vscode.commands.registerCommand('jayann.inspectWorkspace', async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      let folders: Array<{ name: string; uri: vscode.Uri }>;
      if (workspaceFolders?.length) {
        if (!vscode.workspace.isTrusted) {
          await vscode.window.showWarningMessage('Jayann: Trust this workspace before inspecting it.');
          return;
        }
        folders = workspaceFolders.map(({ name, uri }) => ({ name, uri }));
      } else {
        const selected = await vscode.window.showOpenDialog({
          title: 'Jayann: Choose a project folder to inspect',
          openLabel: 'Inspect this folder',
          canSelectFiles: false,
          canSelectFolders: true,
          canSelectMany: false
        });
        if (!selected?.length) return;
        const uri = selected[0];
        const name = uri.path.split('/').filter(Boolean).pop() || 'Selected folder';
        folders = [{ name, uri }];
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
          if (entries.length > shown.length) output.appendLine('(Some entries hidden or limited for safety.)');
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
