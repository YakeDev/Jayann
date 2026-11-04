# Jayann

**Jayann — Your AI Development Companion**

A VS Code extension prototype for learning, collaborating and eventually developing software with an AI assistant.

## MVP 0.2 (authentication prototype)

- Local VS Code sidebar.
- ChatGPT sign-in, connection status, refresh and logout through **Codex app-server**.
- Browser-based OpenAI-hosted authentication, never password entry inside Jayann.
- Local top-level workspace inspection (from v0.1).

**Not yet available:** AI chat, inference, code generation, file modifications or autonomous agent execution. The sign-in button is real, but AI conversations are deliberately deferred to the next milestone.

## Requirements

- VS Code, Node.js and npm
- Codex CLI installed and available in your terminal (`codex --version`)
- Internet access for login

For the CLI, see the [official Codex repository](https://github.com/openai/codex). For a typical npm setup: `npm install -g @openai/codex`.

## Try it

```powershell
git switch feat/chatgpt-auth
npm install
npm run check
codex --version
```

Press **F5** in VS Code. In the Extension Development Host, open **Explorer → Jayann**. Choose **Se connecter avec ChatGPT**, complete sign-in in your browser, then return to Jayann. Use **Actualiser la connexion** if needed. The sign-out action warns that shared local Codex credentials may affect other Codex clients.

To inspect a local project, click **Inspecter un dossier**. If no workspace is open, Jayann asks you to choose one explicitly.

## Security and status

- Jayann does not receive or store your ChatGPT password, access tokens or API key.
- Codex CLI handles local ChatGPT credentials; Jayann displays only account metadata.
- Browser redirects are restricted to OpenAI-owned HTTPS domains.
- Jayann does not send workspace files or execute agent turns in 0.2.
- Authentication and its Windows CLI launch behavior still require an end-to-end test before release or merge.

For implementation details see [Authentication](docs/authentication.md) and [Architecture](docs/architecture.md).

## Future modes

**Learn · Collaborate · Agent**

## License

Not chosen yet. A public repository does not automatically give reuse permission.
