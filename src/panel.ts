import * as vscode from 'vscode';
import { randomBytes } from 'node:crypto';

export interface AuthViewState {
  phase: 'idle' | 'loading' | 'disconnected' | 'waiting' | 'connected' | 'error';
  message: string;
}

export interface JayannActions {
  onReady(): void;
  connect(): Promise<void>;
  refresh(): Promise<void>;
  disconnect(): Promise<void>;
  inspect(): Promise<void>;
}

export class JayannPanel implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private state: AuthViewState = { phase: 'idle', message: 'Chargement…' };

  constructor(private readonly actions: JayannActions) {}

  updateAuthState(state: AuthViewState): void {
    this.state = state;
    void this.view?.webview.postMessage({ type: 'authState', state });
  }

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.onDidDispose(() => { if (this.view === view) this.view = undefined; });
    const webview = view.webview;
    webview.options = { enableScripts: true, localResourceRoots: [] };
    const nonce = randomBytes(16).toString('base64');
    webview.html = [
      '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8" />',
      '<meta name="viewport" content="width=device-width, initial-scale=1" />',
      `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">`,
      `<style nonce="${nonce}">`,
      'body{padding:14px;color:var(--vscode-foreground);font-family:var(--vscode-font-family)}',
      'h2{margin-top:0;font-size:1.2rem}p{line-height:1.5;color:var(--vscode-descriptionForeground)}',
      '.status{border:1px solid var(--vscode-panel-border);padding:10px;border-radius:6px;margin:12px 0;overflow-wrap:anywhere}',
      '.status strong{display:block;margin-bottom:4px}.status span{line-height:1.5;font-size:.93em}',
      'button{display:block;width:100%;padding:9px 12px;margin:8px 0;cursor:pointer;',
      'background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:0;border-radius:4px}',
      'button.secondary{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}',
      'button:disabled{opacity:.5;cursor:default}[hidden]{display:none!important}.subheading{font-weight:600;margin-top:18px}',
      '</style></head><body>',
      '<h2>Jayann</h2>',
      '<p>Assistant de développement · MVP 0.2</p>',
      '<div class="status" role="status" aria-live="polite"><strong id="phase">Initialisation</strong><span id="message">Vérification du compte…</span></div>',
      '<button id="connect" type="button">Se connecter avec ChatGPT</button>',
      '<button id="refresh" class="secondary" type="button">Actualiser la connexion</button>',
      '<button id="disconnect" class="secondary" type="button" hidden>Se déconnecter</button>',
      '<p class="subheading">Projet local</p>',
      '<button id="inspect" class="secondary" type="button">Inspecter un dossier</button>',
      '<p>Le chat et les actions sur le code ne sont pas encore activés. Aucun fichier n’est envoyé.</p>',
      `<script nonce="${nonce}">`,
      "const api = acquireVsCodeApi();",
      "const button = id => document.getElementById(id);",
      "const send = type => api.postMessage({type});",
      "for (const key of ['connect','refresh','disconnect','inspect']) button(key).addEventListener('click', () => send(key));",
      "window.addEventListener('message', event => {",
      "  if (event.data?.type !== 'authState') return;",
      "  const state = event.data.state;",
      "  if (!state || typeof state.message !== 'string') return;",
      "  const labels = {idle:'Prêt',loading:'Vérification…',disconnected:'Non connecté',waiting:'Connexion en cours',connected:'Connecté',error:'Action nécessaire'};",
      "  button('phase').textContent = labels[state.phase] || 'État inconnu';",
      "  button('message').textContent = state.message;",
      "  const busy = state.phase === 'loading';",
      "  button('connect').hidden = state.phase === 'connected' || state.phase === 'waiting';",
      "  button('connect').disabled = busy;",
      "  button('disconnect').hidden = state.phase !== 'connected';",
      "  button('refresh').disabled = busy;",
      "});",
      "send('ready');",
      '</script></body></html>'
    ].join('\n');

    webview.onDidReceiveMessage(async (message: unknown) => {
      if (!message || typeof message !== 'object' || !('type' in message)) return;
      const type = (message as { type: unknown }).type;
      switch (type) {
        case 'ready':
          this.actions.onReady();
          this.updateAuthState(this.state);
          break;
        case 'connect': await this.actions.connect(); break;
        case 'refresh': await this.actions.refresh(); break;
        case 'disconnect': await this.actions.disconnect(); break;
        case 'inspect': await this.actions.inspect(); break;
      }
    });
  }
}
