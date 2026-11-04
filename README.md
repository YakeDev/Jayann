# Jayann

**Jayann** — *Your AI Development Companion*.

An early-stage, open-source VS Code extension intended to help developers learn, collaborate, and safely automate software development.

## Current status

**MVP 0.1 — local-only foundation**. This branch contains:
- A Jayann panel in VS Code's Explorer sidebar.
- An explicit action for inspecting the currently opened workspace.
- A conservative, non-recursive listing of top-level items.
- A workspace-trust check before inspection.
- A clear placeholder for future ChatGPT authentication.

**Not implemented:** ChatGPT login, AI inference, code changes, agent execution, command execution, GitHub automation, or publication. The prototype does not upload files.

## Run locally

Requirements: Node.js, npm, and Visual Studio Code.

```bash
npm install
npm run check
```

Open this repository in VS Code and press **F5**. In the *Extension Development Host*, open **Explorer → Jayann** and click **Inspect workspace**, or run **Jayann: Inspect Workspace** from the Command Palette. If the debug host has no open workspace, a folder picker appears: choose the project folder directly (it is **not** necessary to reopen the editor). The listing appears under **View → Output → Jayann**. Only top-level file and directory names are listed locally; no file content is read, executed or transmitted.

No API key or ChatGPT account is required for this local-only prototype.

## Product direction

- **Learn:** guided learning and explanations.
- **Collaborate:** review changes before applying them.
- **Agent:** controlled automation with explicit permissions.

## Architecture and security

See [docs/architecture.md](docs/architecture.md).

## License

No license has been chosen yet. Public repository visibility does not itself grant reuse rights.
