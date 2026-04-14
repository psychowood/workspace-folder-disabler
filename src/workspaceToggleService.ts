import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";

const DISABLED_SUFFIX = ".disabled";

interface WorkspaceFolderEntry {
  path?: string;
  name?: string;
  uri?: string;
}

interface WorkspaceModel {
  folders?: WorkspaceFolderEntry[];
  [key: string]: unknown;
}

export interface ToggleResult {
  beforePath: string;
  afterPath: string;
  mode: "enabled" | "disabled";
}

export async function setVirtualFolderState(
  targetRootFolder: vscode.WorkspaceFolder,
  desiredState: "enabled" | "disabled"
): Promise<ToggleResult> {
  const workspaceFile = vscode.workspace.workspaceFile;
  if (!workspaceFile || workspaceFile.scheme !== "file") {
    throw new Error("Save this workspace as a .code-workspace file before toggling virtual folders.");
  }

  const workspaceFileFsPath = workspaceFile.fsPath;
  const workspaceDir = path.dirname(workspaceFileFsPath);
  const rawContent = await fs.readFile(workspaceFileFsPath, "utf8");

  let parsed: WorkspaceModel;
  try {
    parsed = JSON.parse(rawContent) as WorkspaceModel;
  } catch {
    throw new Error("The workspace file is not valid JSON.");
  }

  if (!Array.isArray(parsed.folders)) {
    throw new Error("The workspace file does not include a folders array.");
  }

  const folderIndex = parsed.folders.findIndex((entry) => {
    if (typeof entry.path !== "string") {
      return false;
    }

    const resolvedEntryPath = path.resolve(workspaceDir, entry.path);
    return sameFsPath(resolvedEntryPath, targetRootFolder.uri.fsPath);
  });

  if (folderIndex < 0) {
    throw new Error("Could not map the selected folder to a folders entry in the workspace file.");
  }

  const currentPath = parsed.folders[folderIndex].path;
  if (typeof currentPath !== "string") {
    throw new Error("Only path-based workspace folder entries are supported.");
  }

  const currentName = parsed.folders[folderIndex].name;

  const nextPath =
    desiredState === "disabled"
      ? addDisabledSuffix(currentPath)
      : removeDisabledSuffix(currentPath);

  parsed.folders[folderIndex].path = nextPath;

  // Keep the visible workspace folder label stable (without the .disabled suffix)
  // even when the backing path is temporarily redirected to *.disabled.
  parsed.folders[folderIndex].name = normalizeVisibleFolderName(currentName, targetRootFolder.name);

  const nextContent = `${JSON.stringify(parsed, null, 2)}\n`;
  await fs.writeFile(workspaceFileFsPath, nextContent, "utf8");

  return {
    beforePath: currentPath,
    afterPath: nextPath,
    mode: desiredState
  };
}

export function isTopLevelWorkspaceFolder(resource: vscode.Uri): vscode.WorkspaceFolder | undefined {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(resource);
  if (!workspaceFolder) {
    return undefined;
  }

  const isRootSelection = sameFsPath(resource.fsPath, workspaceFolder.uri.fsPath);
  return isRootSelection ? workspaceFolder : undefined;
}

export function inferDesiredState(command: "toggle" | "enable" | "disable", folderPath: string): "enabled" | "disabled" {
  if (command === "enable") {
    return "enabled";
  }

  if (command === "disable") {
    return "disabled";
  }

  return folderPath.endsWith(DISABLED_SUFFIX) ? "enabled" : "disabled";
}

function addDisabledSuffix(inputPath: string): string {
  return inputPath.endsWith(DISABLED_SUFFIX) ? inputPath : `${inputPath}${DISABLED_SUFFIX}`;
}

function removeDisabledSuffix(inputPath: string): string {
  return inputPath.endsWith(DISABLED_SUFFIX)
    ? inputPath.slice(0, -DISABLED_SUFFIX.length)
    : inputPath;
}

function normalizeVisibleFolderName(existingName: string | undefined, fallbackName: string): string {
  const baseName = typeof existingName === "string" && existingName.trim().length > 0
    ? existingName
    : fallbackName;

  return baseName.endsWith(DISABLED_SUFFIX)
    ? baseName.slice(0, -DISABLED_SUFFIX.length)
    : baseName;
}

function sameFsPath(left: string, right: string): boolean {
  const normalize = (value: string): string => path.normalize(value);

  if (process.platform === "win32") {
    return normalize(left).toLowerCase() === normalize(right).toLowerCase();
  }

  return normalize(left) === normalize(right);
}
