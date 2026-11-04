import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';

type RpcReply = { id?: number; method?: string; params?: unknown; result?: unknown; error?: { message?: string } };
type Pending = { resolve: (value: unknown) => void; reject: (err: Error) => void; timer: NodeJS.Timeout };

export interface AccountSnapshot {
  type: string;
  email?: string;
  planType?: string;
}

export class CodexAppServer {
  // Test injection avoids real CLI launch or real network authentication during unit tests.
  constructor(private readonly launch: typeof spawn = spawn) {}

  private child?: ChildProcessWithoutNullStreams;
  private ready?: Promise<void>;
  private sequence = 0;
  private readonly pending = new Map<number, Pending>();
  private buffer = '';
  private disposed = false;

  onNotification?: (method: string, params: unknown) => void;
  onDisconnected?: () => void;

  async start(): Promise<void> {
    if (this.disposed) throw new Error('Jayann session is closed.');
    if (!this.ready) {
      this.ready = this.initialize().catch((error: unknown) => {
        this.closeChild();
        this.ready = undefined;
        throw error;
      });
    }
    return this.ready;
  }

  private async initialize(): Promise<void> {
    try {
      // Arguments are fixed. No workspace or user input is passed to a shell.
      // Windows npm installs expose codex.cmd, which requires a command-shell launcher.
      this.child = this.launch('codex', ['app-server', '--listen', 'stdio://'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
        shell: process.platform === 'win32',
      });
    } catch {
      throw new Error('Impossible de démarrer Codex CLI. Installe @openai/codex et vérifie PATH.');
    }
    const child = this.child;
    if (!child) throw new Error('Codex CLI ne démarre pas.');
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => this.consume(chunk));
    // Deliberately do not display or record stderr: it may contain account details.
    child.stderr.resume();

    child.on('error', () => {
      if (this.child !== child) return;
      this.disconnected('Codex CLI introuvable. Installe-le puis réessaie.');
      this.child = undefined;
      this.ready = undefined;
    });
    child.on('exit', () => {
      if (this.child !== child) return;
      this.disconnected('Le service local Codex s’est arrêté.');
      this.child = undefined;
      this.ready = undefined;
    });

    await this.request('initialize', {
      clientInfo: { name: 'jayann_vscode', title: 'Jayann VS Code Extension', version: '0.2.0' }
    });
    this.notify('initialized', {});
  }

  private consume(chunk: string): void {
    this.buffer += chunk;
    if (this.buffer.length > 1024 * 1024) {
      this.disconnected('Réponse Codex trop volumineuse.');
      this.closeChild();
      return;
    }
    let idx: number;
    while ((idx = this.buffer.indexOf('\n')) >= 0) {
      const line = this.buffer.slice(0, idx).trim();
      this.buffer = this.buffer.slice(idx + 1);
      if (!line) continue;
      let msg: RpcReply;
      try { msg = JSON.parse(line) as RpcReply; } catch { continue; }
      if (typeof msg.id === 'number') {
        const item = this.pending.get(msg.id);
        if (!item) continue;
        clearTimeout(item.timer);
        this.pending.delete(msg.id);
        if (msg.error) item.reject(new Error(msg.error.message || 'Échec de la requête Codex.'));
        else item.resolve(msg.result);
      } else if (typeof msg.method === 'string') {
        this.onNotification?.(msg.method, msg.params);
        // Never auto-execute server-to-client tool calls.
        // This version sends only account-related RPCs, not agent turns.
      }
    }
  }

  async request(method: string, params?: object): Promise<unknown> {
    if (!this.child?.stdin.writable) throw new Error('Le service Codex n’est pas disponible.');
    const id = ++this.sequence;
    const message = JSON.stringify(params === undefined ? { id, method } : { id, method, params });
    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('Codex ne répond pas. Réessaie.'));
      }, 20000);
      this.pending.set(id, { resolve, reject, timer });
      this.child!.stdin.write(message + '\n', error => {
        if (error) {
          const item = this.pending.get(id);
          if (item) { clearTimeout(item.timer); this.pending.delete(id); item.reject(new Error('Écriture vers Codex impossible.')); }
        }
      });
    });
  }

  private notify(method: string, params: object): void {
    if (!this.child?.stdin.writable) throw new Error('Codex déconnecté.');
    this.child.stdin.write(JSON.stringify({ method, params }) + '\n');
  }

  async account(): Promise<AccountSnapshot | null> {
    await this.start();
    const payload = await this.request('account/read', { refreshToken: false }) as
      { account?: { type?: string; email?: string; planType?: string } | null };
    if (!payload?.account?.type) return null;
    return {
      type: payload.account.type,
      email: payload.account.email,
      planType: payload.account.planType
    };
  }

  async beginChatGptLogin(): Promise<{ authUrl: string; loginId: string }> {
    await this.start();
    const result = await this.request('account/login/start', {
      type: 'chatgpt', appBrand: 'chatgpt', useHostedLoginSuccessPage: true
    }) as { authUrl?: string; loginId?: string; type?: string };
    if (result?.type !== 'chatgpt' || !result.authUrl || !result.loginId) {
      throw new Error('Codex n’a pas fourni de lien de connexion ChatGPT.');
    }
    return { authUrl: result.authUrl, loginId: result.loginId };
  }

  async logout(): Promise<void> {
    await this.start();
    await this.request('account/logout');
  }

  private disconnected(reason: string): void {
    for (const item of this.pending.values()) {
      clearTimeout(item.timer);
      item.reject(new Error(reason));
    }
    this.pending.clear();
    this.onDisconnected?.();
  }

  private closeChild(): void {
    const child = this.child;
    this.child = undefined;
    this.buffer = '';
    if (child) child.kill();
  }

  dispose(): void {
    this.disposed = true;
    this.disconnected('Session Jayann fermée.');
    this.closeChild();
  }
}
