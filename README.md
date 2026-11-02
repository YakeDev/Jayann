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

Open this repository in VS Code and press **F5**. In the new *Extension Development Host*, open **Explorer → Jayann**. Click **Inspect workspace**, or run **Jayann: Inspect Workspace** in the Command Palette.

No API key or ChatGPT account is required for this local-only prototype.

## Product direction

- **Learn:** guided learning and explanations.
- **Collaborate:** review changes before applying them.
- **Agent:** controlled automation with explicit permissions.

## Architecture and security

See [docs/architecture.md](docs/architecture.md).

## License

No license has been chosen yet. Public repository visibility does not itself grant reuse rights.
