import * as vscode from "vscode";
import { inferDesiredState, isTopLevelWorkspaceFolder, setVirtualFolderState } from "./workspaceToggleService";

const OUTPUT_CHANNEL_NAME = "Workspace Folders Disabler";

type CommandMode = "toggle" | "enable" | "disable";

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  context.subscriptions.push(output);

  context.subscriptions.push(
    vscode.commands.registerCommand("workspaceFoldersDisabler.toggleFolder", (resource?: vscode.Uri) =>
      runForResource(output, "toggle", resource)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("workspaceFoldersDisabler.enableFolder", (resource?: vscode.Uri) =>
      runForResource(output, "enable", resource)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("workspaceFoldersDisabler.disableFolder", (resource?: vscode.Uri) =>
      runForResource(output, "disable", resource)
    )
  );

  output.appendLine("Workspace Folders Disabler activated.");
}

export function deactivate(): void {}

async function runForResource(output: vscode.OutputChannel, mode: CommandMode, resource?: vscode.Uri): Promise<void> {
  try {
    if (!ensureSavedWorkspace()) {
      return;
    }

    const effectiveResource = resource ?? vscode.window.activeTextEditor?.document.uri;
    if (!effectiveResource) {
      vscode.window.showErrorMessage("No target folder is selected.");
      return;
    }

    const rootWorkspaceFolder = isTopLevelWorkspaceFolder(effectiveResource);
    if (!rootWorkspaceFolder) {
      vscode.window.showErrorMessage("Select a top-level workspace folder in Explorer.");
      return;
    }

    const desiredState = inferDesiredState(mode, rootWorkspaceFolder.uri.fsPath);
    const result = await setVirtualFolderState(rootWorkspaceFolder, desiredState);

    output.appendLine(
      `${mode}: ${rootWorkspaceFolder.name} | ${result.beforePath} -> ${result.afterPath}`
    );

    void vscode.window.showInformationMessage(`Folder ${rootWorkspaceFolder.name} is now ${result.mode}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    output.appendLine(`Error: ${message}`);
    vscode.window.showErrorMessage(`Workspace Folders Disabler failed: ${message}`);
  }
}

function ensureSavedWorkspace(): boolean {
  const workspaceFile = vscode.workspace.workspaceFile;
  if (workspaceFile?.scheme === "file") {
    return true;
  }

  void vscode.window
    .showWarningMessage(
      "Save this workspace as a .code-workspace file before toggling virtual folders.",
      "Save Workspace As"
    )
    .then((choice) => {
      if (choice === "Save Workspace As") {
        void vscode.commands.executeCommand("workbench.action.saveWorkspaceAs");
      }
    });

  return false;
}
