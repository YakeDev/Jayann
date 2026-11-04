# Jayann 0.2 — ChatGPT authentication

## Integration decision

Jayann 0.2 uses the **Codex-managed ChatGPT sign-in** built into local **Codex app-server**, following [Codex App Server documentation](https://developers.openai.com/codex/app-server).

This is not a custom OpenID Connect client or third-party OAuth token-sharing integration. It requires the user's installed Codex CLI, and the user's ChatGPT/Codex account must be eligible. Do not claim that Jayann independently has approved Sign in with ChatGPT plan usage.

## Local prerequisites

1. Node.js, npm and VS Code.
2. Codex CLI installed and available as `codex` on PATH. Install from the official [Codex repository](https://github.com/openai/codex).
3. Working connection to the OpenAI authentication service.

## Behavior

- A locally spawned `codex app-server --listen stdio://` process speaks JSON lines over standard input/output.
- The extension sends `initialize` and `initialized` on launch.
- The extension reads `account/read` to display accurate login status.
- Clicking **Se connecter avec ChatGPT** requests `account/login/start` with `type: chatgpt`, then opens the returned OpenAI-owned HTTPS `authUrl` using VS Code's external browser action.
- `account/login/completed` and `account/updated` notifications cause status updates.
- Clicking **Se déconnecter** asks for confirmation before `account/logout`, which can affect other Codex clients on the same machine.

## Explicit limitations and security

- The extension never asks for an email password, API key or OAuth tokens.
- Codex manages credentials outside the Jayann webview. No token value is sent in a webview message or written to Jayann settings.
- The auth browser URL is rejected unless HTTPS and on an `openai.com` or `chatgpt.com` hostname (or an actual subdomain).
- No chat, `thread/start`, `turn/start`, shell execution or code-editing tool calls are implemented in 0.2.
- The Codex local process has access to the current user's Codex configuration; Jayann does not store credentials but does not control how the underlying CLI stores its own.
- No workspace contents are sent by Jayann. The inspection command lists top-level file names locally.
- Because Codex CLI is an external prerequisite, Windows/macOS/Linux integration needs a real installed-CLI acceptance test before merging.

## Manual acceptance checklist

- [ ] `npm run check` passes.
- [ ] Run `codex --version` from the same VS Code terminal.
- [ ] F5 opens an Extension Development Host.
- [ ] Unauthenticated: Jayann reports **Non connecté**.
- [ ] Click sign in; official ChatGPT login opens in a browser.
- [ ] Completing sign-in changes status to **Connecté**, ideally showing email and plan.
- [ ] Refresh shows the same account.
- [ ] Logout asks for confirmation, then returns to **Non connecté**.
- [ ] A missing CLI displays an actionable error; no false "Connecté" state.
- [ ] Existing workspace inspection remains functional.
