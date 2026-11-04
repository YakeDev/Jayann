import * as vscode from 'vscode';
import { randomBytes } from 'node:crypto';

export class JayannPanel implements vscode.WebviewViewProvider {
  resolveWebviewView(view: vscode.WebviewView): void {
    const webview = view.webview;
    webview.options = { enableScripts: true, localResourceRoots: [] };
    const nonce = randomBytes(16).toString('base64');
    webview.html = [
      '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" />',
      '<meta name="viewport" content="width=device-width, initial-scale=1" />',
      `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">`,
      `<style nonce="${nonce}">`,
      'body{padding:14px;color:var(--vscode-foreground);font-family:var(--vscode-font-family)}',
      'h2{margin-top:0;font-size:1.15rem}p{line-height:1.5;color:var(--vscode-descriptionForeground)}',
      '.status{padding:7px 10px;margin-bottom:12px;border:1px solid var(--vscode-panel-border);border-radius:6px}',
      'button{display:block;width:100%;padding:9px 12px;margin:9px 0;cursor:pointer;',
      'background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:0;border-radius:4px}',
      'button.secondary{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}',
      '</style></head><body>',
      '<h2>Jayann</h2>',
      '<div class="status">MVP 0.1 · Local-only prototype</div>',
      '<p>Inspect the open workspace, or select a project folder if none is open. Only local top-level names are listed. AI chat and ChatGPT sign-in are not available yet.</p>',
      '<button id="inspect" type="button">Inspect workspace</button>',
      '<button id="connect" class="secondary" type="button">ChatGPT sign-in (coming soon)</button>',
      `<script nonce="${nonce}">`,
      'const vscode = acquireVsCodeApi();',
      "document.getElementById('inspect').addEventListener('click', () => vscode.postMessage({type:'inspect'}));",
      "document.getElementById('connect').addEventListener('click', () => vscode.postMessage({type:'connect'}));",
      '</script></body></html>'
    ].join('\n');

    webview.onDidReceiveMessage(async (message: unknown) => {
      if (!message || typeof message !== 'object' || !('type' in message)) return;
      const type = (message as { type: unknown }).type;
      if (type === 'inspect') {
        await vscode.commands.executeCommand('jayann.inspectWorkspace');
      } else if (type === 'connect') {
        await vscode.window.showInformationMessage('ChatGPT sign-in is not implemented in Jayann 0.1.');
      }
    });
  }
}
