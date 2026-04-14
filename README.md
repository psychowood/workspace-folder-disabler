# Workspace Folders Disabler

Workspace Folders Disabler adds a lightweight "virtual close" workflow for multi-root workspaces.

## Objective

Temporarily disable a top-level workspace folder without permanently removing it from your workspace setup.

When you disable a folder, the extension rewrites its entry in the active `.code-workspace` file by appending `.disabled` to the folder path. Enabling does the reverse by removing the suffix.

This gives you a quick way to reduce workspace scope while keeping folder membership easy to restore.

## Why this extension exists

It is a practical workaround inspired by the VS Code feature request:

- https://github.com/microsoft/vscode/issues/205160

That request asked for an Eclipse-like enable/disable folder action in the workspace UI, but the issue was closed as not planned.

## Current behavior

- Adds Explorer context menu actions for top-level workspace folders.
- Requires the workspace to be saved as a `.code-workspace` file first.
- Applies changes immediately by updating the workspace file entry.
