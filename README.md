# VSCode Workspace Folders Disabler

Workspace Folders Disabler adds a lightweight "virtual close" workflow for multi-root workspaces on VSCode

## Objective

Disable a top-level workspace folder without permanently removing it from your workspace setup.

When you disable a folder, the extension rewrites its entry in the active `.code-workspace` file by appending `.disabled` to the folder path. Enabling does the reverse by removing the suffix.

This gives you a quick way to reduce workspace scope while keeping folder membership easy to restore.

## Why this extension exists

It is a practical workaround inspired by the VS Code feature request:

- https://github.com/microsoft/vscode/issues/205160

That request asked for an Eclipse-like enable/disable folder action in the workspace UI, but the issue was closed as not planned.

## Current behavior

- Adds Explorer context menu actions for top-level workspace folders.

<img width="489" height="491" alt="image" src="https://github.com/user-attachments/assets/84bd0cbf-3854-41db-8c59-4c22a44504a3" />


- When disabled, a folder will appear greyed out and not accessible

<img width="612" height="300" alt="image" src="https://github.com/user-attachments/assets/55c80f14-e8e3-48c0-be94-eeb759a2d8fe" />


- You can then re-enable it via the same context menu

<img width="719" height="401" alt="image" src="https://github.com/user-attachments/assets/a2eec103-0865-4a2f-a69e-170774004278" />


- Requires the workspace to be saved as a `.code-workspace` file first because it edits the workspace file
- Applies changes immediately by updating the workspace file entry.
