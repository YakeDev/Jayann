import * as vscode from 'vscode';
import { CodexAppServer } from './codexAppServer';
import { isTrustedAuthUrl } from './authUrl';
import { AuthViewState } from './panel';

export class AuthController implements vscode.Disposable {
  private readonly server = new CodexAppServer();
  private busy = false;
  private refreshQueued = false;
  private loginId?: string;
  private current: AuthViewState = { phase: 'idle', message: 'Prêt à vérifier la session ChatGPT.' };

  constructor(private readonly publish: (state: AuthViewState) => void) {
    this.server.onNotification = (method, params) => {
      if (method === 'account/updated') {
        this.scheduleRefresh();
      }
      if (method === 'account/login/completed') {
        const p = params as { loginId?: string; success?: boolean; error?: string } | undefined;
        if (!this.loginId || p?.loginId !== this.loginId) return;
        this.loginId = undefined;
        if (p?.success) this.scheduleRefresh();
        else this.set({ phase: 'error', message: p?.error || 'Connexion ChatGPT non terminée.' });
      }
    };
    this.server.onDisconnected = () => {
      this.set({ phase: 'error', message: 'Codex CLI n’est pas disponible. Vérifie son installation.' });
    };
  }

  private scheduleRefresh(): void {
    if (this.busy) { this.refreshQueued = true; return; }
    void this.refresh();
  }
  private finishBusy(): void {
    this.busy = false;
    if (this.refreshQueued) {
      this.refreshQueued = false;
      void this.refresh();
    }
  }

  show(): void { this.publish(this.current); }
  private set(state: AuthViewState): void { this.current = state; this.publish(state); }
  private failure(error: unknown): void {
    this.set({ phase: 'error', message: error instanceof Error ? error.message : 'Une erreur est survenue.' });
  }

  async refresh(): Promise<void> {
    // Notifications can arrive while another request is outstanding; use refresh after it finishes.
    if (this.busy) return;
    this.busy = true;
    this.set({ phase: 'loading', message: 'Vérification de la session locale…' });
    try {
      const account = await this.server.account();
      if (!account) this.set({ phase: 'disconnected', message: 'Aucun compte ChatGPT connecté.' });
      else if (account.type === 'chatgpt') {
        const label = [account.email, account.planType].filter(Boolean).join(' · ');
        this.set({ phase: 'connected', message: label ? 'Connecté : ' + label : 'Compte ChatGPT connecté.' });
      } else {
        this.set({ phase: 'disconnected', message: 'Codex utilise actuellement un autre mode de connexion : ' + account.type });
      }
    } catch (error) { this.failure(error); }
    finally { this.finishBusy(); }
  }

  async connect(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.set({ phase: 'loading', message: 'Préparation de la connexion sécurisée…' });
    try {
      const auth = await this.server.beginChatGptLogin();
      if (!isTrustedAuthUrl(auth.authUrl)) {
        throw new Error('Le lien de connexion fourni par Codex n’est pas un domaine OpenAI autorisé.');
      }
      this.loginId = auth.loginId;
      const opened = await vscode.env.openExternal(vscode.Uri.parse(auth.authUrl));
      if (!opened) throw new Error('Impossible d’ouvrir le navigateur. Réessaie.');
      this.set({ phase: 'waiting', message: 'Termine la connexion ChatGPT dans ton navigateur, puis reviens dans Jayann.' });
    } catch (error) { this.loginId = undefined; this.failure(error); }
    finally { this.finishBusy(); }
  }

  async disconnect(): Promise<void> {
    if (this.busy) return;
    const choice = await vscode.window.showWarningMessage(
      'Se déconnecter de Codex sur cet ordinateur ? Cela peut affecter les autres clients Codex utilisant cette session.',
      { modal: true }, 'Se déconnecter'
    );
    if (choice !== 'Se déconnecter') return;
    this.busy = true;
    this.set({ phase: 'loading', message: 'Déconnexion…' });
    try {
      await this.server.logout();
      this.loginId = undefined;
      this.set({ phase: 'disconnected', message: 'Déconnecté de ChatGPT.' });
    } catch (error) { this.failure(error); }
    finally { this.finishBusy(); }
  }

  dispose(): void { this.server.dispose(); }
}
