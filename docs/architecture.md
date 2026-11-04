# Jayann — Architecture / MVP 0.1

## Scope

Jayann is a Visual Studio Code extension built with TypeScript and VS Code's stable Extension API.

```
VS Code
  └─ Jayann extension host (TypeScript)
       ├─ Explorer sidebar webview (presentation only)
       ├─ explicit inspect-workspace command
       └─ local, top-level workspace listing
```

This prototype deliberately has **no remote service or model integration**.

## Future AI architecture (proposal, not implemented)

1. ChatGPT account authorization through the officially documented Sign in with ChatGPT flow, subject to eligibility and current terms.
2. Codex app-server for local agent orchestration, with permission gates for tools and file modifications.
3. Separate modules for authentication, conversation state, workspace context selection, diff previews, tests, and audit history.
4. A limited-scope, user-approved context boundary; never silently transfer an entire repository.

## Security constraints

- Do not read any file contents in MVP 0.1.
- Never execute a shell command in MVP 0.1.
- Require trusted workspace before inspecting an open workspace; if none is open, require the user to explicitly select a folder with the folder picker before any listing.
- Do not persist or transmit secrets.
- No external network connections in MVP 0.1.
- UI explicitly identifies unimplemented features.
- Future version: explicit approval for destructive commands, sensitive-file filtering, and clear prompts before code or context is sent externally.

## Roadmap

- 0.1: VS Code extension shell, panel, local workspace overview.
- 0.2: User-consented ChatGPT authentication prototype and connection status.
- 0.3: Streaming chat and controlled selection of project context.
- 0.4: Diff review and explicit consent for modifications.
- 0.5: Safe test execution, Git integration and release packaging.

Each milestone should be reviewed and tested before merging.
