import { Buffer } from "buffer";
import { FileSystemFileHandle } from "file-system-access";
import JSZip from "jszip";

import { LogAllow } from "@src/rnbwTSX";
import {
  ParsableFileTypes,
  RootNodeUid,
  StagePreviewPathPrefix,
} from "@src/rnbwTSX";
import { TOsType } from "@_redux/global";
import { SystemDirectories } from "../../commandMenu/SystemDirectories";
import { verifyFileHandlerPermission } from "../../rnbw";

import {
  fileHandlers,
  getIndexHtmlContent,
  getSubNodeUidsByBfs,
  TFileHandlerCollection,
  TFileNode,
  TFileNodeData,
  TFileNodeTreeData,
  TFileParserResponse,
  TIDBProjectLoaderBaseResponse,
  TLocalProjectLoaderBaseResponse,
  TNodeUid,
  TValidNodeUid,
} from "../";
import { getInitialFileUidToOpen, sortFilesByASC } from "./helpers";
import {
  _createIDBDirectory,
  _fs,
  _getIDBDirectoryOrFileStat,
  _path,
  _readIDBDirectory,
  _readIDBFile,
  _removeIDBDirectoryOrFile,
  _writeIDBFile,
} from "./nohostApis";
import { TFileHandlerInfo, TFileHandlerInfoObj, TZipFileInfo } from "./types";

import { notify } from "@src/services/notificationService";

export const initIDBProject = (projectPath: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    // remove original
    _removeIDBDirectoryOrFile(projectPath)
      .then(() => {
        // create a new project
        createIDBProject(projectPath)
          .then(() => resolve())
          .catch((err) => reject(err));
      })
      .catch((err) => {
        notify("error", "Error while removing IDB project");
        LogAllow && console.error("error while removing IDB project", err);
      });
  });
};

export const createIDBProject = async (projectPath: string): Promise<void> => {
  try {
    // create project directory
    await _createIDBDirectory(projectPath);

    // create index.html
    const indexHtmlPath = `${projectPath}/index.html`;
    const indexHtmlContent = getIndexHtmlContent();
    await _writeIDBFile(indexHtmlPath, indexHtmlContent);

    // If all operations are successful, resolve the promise
    return Promise.resolve();
  } catch (err) {
    notify("error", "Error while creating IDB project");
    // If an error occurs, log it and reject the promise
    LogAllow && console.error("error while creating IDB project", err);
    return Promise.reject(err);
  }
};

export const loadIDBProject = async (
  projectPath: string,
  isReload: boolean = false,
  fileTree?: TFileNodeTreeData,
): Promise<TIDBProjectLoaderBaseResponse> => {
  try {
    const deletedUidsObj: { [uid: TNodeUid]: true } = {};
    if (isReload) {
      getSubNodeUidsByBfs(
        RootNodeUid,
        fileTree as TFileNodeTreeData,
        false,
      ).map((uid) => {
        deletedUidsObj[uid] = true;
      });
    }
    await _createIDBDirectory(`/${projectPath}`);

    // build project root-handler
    const rootHandler: TFileHandlerInfo = {
      uid: RootNodeUid,
      parentUid: null,
      children: [],

      path: projectPath,
      kind: "directory",
      name: "welcome",
    };
    const handlerObj: TFileHandlerInfoObj = { [RootNodeUid]: rootHandler };

    // loop through the project
    const dirHandlers: TFileHandlerInfo[] = [rootHandler];
    while (dirHandlers.length) {
      const { uid: p_uid, path: p_path } =
        dirHandlers.shift() as TFileHandlerInfo;

      const entries = await _readIDBDirectory(p_path);
      await Promise.all(
        entries.map(async (entry) => {
          // skip stage preview files & hidden files
          if (entry.startsWith(StagePreviewPathPrefix) || entry[0] === ".")
            return;

          // build c_handler
          const c_uid = _path.join(p_uid, entry) as string;
          const c_path = _path.join(p_path, entry) as string;
          const stats = await _getIDBDirectoryOrFileStat(c_path);
          const c_kind = stats.type === "DIRECTORY" ? "directory" : "file";

          const nameArr = entry.split(".");
          const c_ext = nameArr.length > 1 ? nameArr.pop() : undefined;
          const c_name = nameArr.join(".");

          const c_content =
            c_kind === "directory" ? undefined : await _readIDBFile(c_path);

          const c_handlerInfo: TFileHandlerInfo = {
            uid: c_uid,
            parentUid: p_uid,
            children: [],

            path: c_path,
            kind: c_kind,
            name: c_kind === "directory" ? entry : c_name,

            ext: c_ext,
            content: c_content,
          };

          // update handlerObj & dirHandlers
          handlerObj[c_uid] = c_handlerInfo;
          handlerObj[p_uid].children.push(c_uid);
          c_kind === "directory" && dirHandlers.push(c_handlerInfo);

          // remove c_uid from deletedUids array
          delete deletedUidsObj[c_uid];
        }),
      );
    }

    // sort by ASC directory/file
    sortFilesByASC(handlerObj);
    // define the initialFileUidToOpen
    const _initialFileUidToOpen = getInitialFileUidToOpen(handlerObj);

    // build fileTree
    const _fileTree: TFileNodeTreeData = {};
    Object.keys(handlerObj).map((uid) => {
      const { parentUid, children, path, kind, name, ext, content } =
        handlerObj[uid];

      const parsable = kind === "file" && ParsableFileTypes[ext as string];
      const fileContent = parsable ? content?.toString() : "";

      _fileTree[uid] = {
        uid,
        parentUid: parentUid,

        displayName: name,

        isEntity: kind === "file",
        children: [...children],

        data: {
          valid: true,

          path: path,

          kind: kind,
          name: name,
          ext: ext,

          orgContent: fileContent,
          content: fileContent,
          contentInApp: "",

          changed: false,
        } as TFileNodeData,
      } as TFileNode;
    });

    return {
      _fileTree,
      _initialFileUidToOpen,
      deletedUidsObj,
      deletedUids: Object.keys(deletedUidsObj),
    };
  } catch (err) {
    notify("error", "Error while loading IDB project");
    LogAllow && console.error("error in loadIDBProject API", err);
    throw err;
  }
};

export const loadLocalProject = async (
  projectHandle: FileSystemDirectoryHandle,
  osType: TOsType,
  isReload: boolean = false,
  fileTree?: TFileNodeTreeData,
): Promise<TLocalProjectLoaderBaseResponse> => {
  try {
    // verify project-handler permission
    if (!(await verifyFileHandlerPermission(projectHandle)))
      throw "project handler permission error";

    const deletedUidsObj: { [uid: TNodeUid]: true } = {};
    if (isReload) {
      getSubNodeUidsByBfs(
        RootNodeUid,
        fileTree as TFileNodeTreeData,
        false,
      ).map((uid) => {
        deletedUidsObj[uid] = true;
      });
    }

    // build project root-handler
    const rootHandler: TFileHandlerInfo = {
      uid: RootNodeUid,
      parentUid: null,
      children: [],

      path: `/${projectHandle.name}`,
      kind: "directory",
      name: projectHandle.name,

      handler: projectHandle,
    };
    const handlerArr: TFileHandlerInfo[] = [rootHandler];
    const handlerObj: TFileHandlerInfoObj = { [RootNodeUid]: rootHandler };

    // loop through the project
    const dirHandlers: TFileHandlerInfo[] = [rootHandler];
    while (dirHandlers.length) {
      const {
        uid: p_uid,
        path: p_path,
        handler: p_handler,
      } = dirHandlers.shift() as TFileHandlerInfo;

      for await (const entry of (
        p_handler as FileSystemDirectoryHandle
      ).values()) {
        // skip system directories & hidden files
        if (SystemDirectories[osType][entry.name] || entry.name[0] === ".")
          continue;

        // build c_handler
        const c_uid = _path.join(p_uid, entry.name) as string;
        const c_path = _path.join(p_path, entry.name) as string;

        const c_kind = entry.kind;

        const nameArr = entry.name.split(".");
        const c_ext = nameArr.length > 1 ? nameArr.pop() : undefined;
        const c_name = nameArr.join(".");

        let c_content: Uint8Array | undefined = undefined;
        if (c_kind === "file") {
          const fileEntry = await (entry as FileSystemFileHandle).getFile();
          c_content = Buffer.from(await fileEntry.arrayBuffer());
        }

        const c_handlerInfo: TFileHandlerInfo = {
          uid: c_uid,
          parentUid: p_uid,
          children: [],

          path: c_path,
          kind: c_kind,
          name: c_kind === "directory" ? entry.name : c_name,

          ext: c_ext,
          content: c_content,

          handler: entry,
        };

        // update handler-arr, handler-obj
        handlerObj[p_uid].children.push(c_uid);
        handlerObj[c_uid] = c_handlerInfo;
        handlerArr.push(c_handlerInfo);
        c_kind === "directory" && dirHandlers.push(c_handlerInfo);

        // remove c_uid from deletedUids array
        delete deletedUidsObj[c_uid];
      }
    }

    // sort by ASC directory/file
    sortFilesByASC(handlerObj);
    // define the initialFileUidToOpen
    const _initialFileUidToOpen = getInitialFileUidToOpen(handlerObj);

    // build fileTree and fileHandlers
    const _fileTree: TFileNodeTreeData = {};
    const _fileHandlers: TFileHandlerCollection = {};
    Object.keys(handlerObj).map((uid) => {
      const { parentUid, children, path, kind, name, ext, content, handler } =
        handlerObj[uid];

      const parsable = kind === "file" && ParsableFileTypes[ext as string];
      const fileContent = parsable ? content?.toString() : "";

      _fileTree[uid] = {
        uid,
        parentUid: parentUid,

        displayName: name,

        isEntity: kind === "file",
        children: [...children],

        data: {
          valid: true,

          path: path,

          kind: kind,
          name: name,
          ext: ext ?? "",

          orgContent: fileContent,
          content: fileContent,
          contentInApp: "",

          changed: false,
        } as TFileNodeData,
      } as TFileNode;

      _fileHandlers[uid] = handler as FileSystemHandle;
    });

    await _createIDBDirectory(
      `/${(projectHandle as FileSystemDirectoryHandle).name}`,
    );

    return {
      handlerArr,
      _fileHandlers,
      _fileTree,
      _initialFileUidToOpen,
      deletedUidsObj,
      deletedUids: Object.keys(deletedUidsObj),
    };
  } catch (err) {
    LogAllow &&
      console.log(
        `error in ${isReload ? "reloadLocalProject" : "loadLocalProject"} API`,
        err,
      );
    throw err;
  }
};

export const buildNohostIDB = async (
  handlerArr: TFileHandlerInfo[],
  deletedPaths: TNodeUid[] = [],
): Promise<void> => {
  try {
    // Remove deleted paths
    await Promise.all(
      deletedPaths.map(async (path) => {
        try {
          _fs.exists(path, async function (exists: boolean) {
            if (exists) {
              await _removeIDBDirectoryOrFile(path);
            }
          });
        } catch (err) {
          notify("error", "Error while removing IDB project");
          console.error("Error while removing IDB project", err);
        }
      }),
    );

    // Process handlerArr
    await Promise.all(
      handlerArr.map(async (_handler) => {
        const { kind, path } = _handler;
        if (kind === "directory") {
          try {
            await _createIDBDirectory(path);
          } catch (err) {
            notify("error", "Error while creating IDB directory");
            console.error("Error while creating IDB directory", err);
          }
        }
      }),
    );
    await Promise.all(
      handlerArr.map(async (_handler) => {
        const { kind, path, content } = _handler;
        if (kind === "file") {
          try {
            await _writeIDBFile(path, content as Uint8Array);
          } catch (err) {
            notify("error", "Error while writing IDB file");
            console.error("Error while writing IDB file", err);
          }
        }
      }),
    );

    return; // Resolve the promise
  } catch (err) {
    notify("error", "Error while building IDB project");
    console.error("Error in buildNohostIDB API", err);
    throw err; // Reject the promise
  }
};

export const downloadIDBProject = async (
  projectPath: string,
): Promise<void> => {
  try {
    notify("info", "Downloading project, please wait...");
    const zip = new JSZip();

    // Build project root
    const projectName = projectPath.slice(1);
    const rootFolder = zip.folder(projectName);
    const rootHandler: TZipFileInfo = {
      path: projectPath,
      zip: rootFolder,
    };

    // Loop through the project
    const dirHandlers: TZipFileInfo[] = [rootHandler];
    while (dirHandlers.length) {
      const { path, zip } = dirHandlers.shift() as TZipFileInfo;

      const entries = await _readIDBDirectory(path);
      await Promise.all(
        entries.map(async (entry) => {
          // Skip stage preview files
          if (entry.startsWith(StagePreviewPathPrefix)) return;

          // Build handler
          const c_path = _path.join(path, entry) as string;
          const stats = await _getIDBDirectoryOrFileStat(c_path);
          const c_name = entry;
          const c_kind = stats.type === "DIRECTORY" ? "directory" : "file";

          let c_zip: JSZip | null | undefined;
          if (c_kind === "directory") {
            c_zip = zip?.folder(c_name);
          } else {
            const content = await _readIDBFile(c_path);
            c_zip = zip?.file(c_name, content);
          }

          const handlerInfo: TZipFileInfo = {
            path: c_path,
            zip: c_zip,
          };
          c_kind === "directory" && dirHandlers.push(handlerInfo);
        }),
      );
    }
    notify("success", "Project downloaded successfully");

    const projectBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(projectBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${projectName}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    notify("error", "Error while downloading IDB project");
    console.error("Error in downloadIDBProject API", err);
    throw err;
  }
};

export const parseFile = (
  ext: string,
  content: string,
  callback?: (validUid: TValidNodeUid) => void,
): TFileParserResponse => {
  const defaultResponse: TFileParserResponse = {
    contentInApp: "",
    nodeTree: {},
    htmlDom: null,
  };
  if (!content || !fileHandlers[ext]) return defaultResponse;
  return fileHandlers[ext](content, callback);
};
