import { Buffer } from "buffer";
import FileSaver from "file-saver";
import { FileSystemFileHandle } from "file-system-access";
import JSZip from "jszip";

import { LogAllow } from "@_constants/global";
import {
  ParsableFileTypes,
  RootNodeUid,
  StagePreviewPathPrefix,
} from "@_constants/main";
import { TOsType } from "@_redux/global";
import { SystemDirectories } from "@_ref/SystemDirectories";
import { verifyFileHandlerPermission } from "@_services/main";

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
} from "../";
import { getInitialFileUidToOpen, sortFilesByASC } from "./helpers";
import {
  _createIDBDirectory,
  _getIDBDirectoryOrFileStat,
  _path,
  _readIDBDirectory,
  _readIDBFile,
  _removeIDBDirectoryOrFile,
  _writeIDBFile,
} from "./nohostApis";
import { TFileHandlerInfo, TFileHandlerInfoObj, TZipFileInfo } from "./types";

export const initIDBProject = async (projectPath: string): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    // remove original
    try {
      await _removeIDBDirectoryOrFile(projectPath);
    } catch (err) {
      LogAllow && console.error("error while removing IDB project", err);
    }

    // create a new project
    try {
      await createIDBProject(projectPath);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};
export const createIDBProject = async (projectPath: string): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      // create project directory
      await _createIDBDirectory(projectPath);

      // create index.html
      const indexHtmlPath = `${projectPath}/index.html`;
      const indexHtmlContent = getIndexHtmlContent();
      await _writeIDBFile(indexHtmlPath, indexHtmlContent);

      resolve();
    } catch (err) {
      LogAllow && console.error("error while creating IDB project", err);
      reject(err);
    }
  });
};

export const loadIDBProject = async (
  projectPath: string,
  isReload: boolean = false,
  fileTree?: TFileNodeTreeData,
): Promise<TIDBProjectLoaderBaseResponse> => {
  return new Promise<TIDBProjectLoaderBaseResponse>(async (resolve, reject) => {
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
      let _initialFileUidToOpen = getInitialFileUidToOpen(handlerObj);

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

      resolve({
        _fileTree,
        _initialFileUidToOpen,
        deletedUidsObj,
        deletedUids: Object.keys(deletedUidsObj),
      });
    } catch (err) {
      LogAllow && console.error("error in loadIDBProject API", err);
      reject(err);
    }
  });
};
export const loadLocalProject = async (
  projectHandle: FileSystemDirectoryHandle,
  osType: TOsType,
  isReload: boolean = false,
  fileTree?: TFileNodeTreeData,
): Promise<TLocalProjectLoaderBaseResponse> => {
  return new Promise<TLocalProjectLoaderBaseResponse>(
    async (resolve, reject) => {
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
        let _initialFileUidToOpen = getInitialFileUidToOpen(handlerObj);

        // build fileTree and fileHandlers
        const _fileTree: TFileNodeTreeData = {};
        const _fileHandlers: TFileHandlerCollection = {};
        Object.keys(handlerObj).map((uid) => {
          const {
            parentUid,
            children,
            path,
            kind,
            name,
            ext,
            content,
            handler,
          } = handlerObj[uid];

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

        resolve({
          handlerArr,
          _fileHandlers,
          _fileTree,
          _initialFileUidToOpen,
          deletedUidsObj,
          deletedUids: Object.keys(deletedUidsObj),
        });
      } catch (err) {
        LogAllow && console.log("error in loadLocalProject API", err);
        reject(err);
      }
    },
  );
};
export const buildNohostIDB = async (
  handlerArr: TFileHandlerInfo[],
  deletedPaths: TNodeUid[] = [],
): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      await Promise.all(
        deletedPaths.map(async (path) => {
          try {
            await _removeIDBDirectoryOrFile(path);
          } catch (err) {}
        }),
      );
      await Promise.all(
        handlerArr.map(async (_handler) => {
          const { kind, path, content } = _handler;
          if (kind === "directory") {
            try {
              await _createIDBDirectory(path);
            } catch (err) {}
          } else {
            try {
              await _writeIDBFile(path, content as Uint8Array);
            } catch (err) {}
          }
        }),
      );

      resolve();
    } catch (err) {
      LogAllow && console.error("error in buildNohostIDB API", err);
      reject(err);
    }
  });
};

export const downloadIDBProject = async (
  projectPath: string,
): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const zip = new JSZip();

      // build project-root
      const projectName = projectPath.slice(1);
      const rootFolder = zip.folder(projectName);
      const rootHandler: TZipFileInfo = {
        path: projectPath,
        zip: rootFolder,
      };

      // loop through the project
      const dirHandlers: TZipFileInfo[] = [rootHandler];
      while (dirHandlers.length) {
        const { path, zip } = dirHandlers.shift() as TZipFileInfo;

        const entries = await _readIDBDirectory(path);
        await Promise.all(
          entries.map(async (entry) => {
            // skip stage preview files
            if (entry.startsWith(StagePreviewPathPrefix)) return;

            // build handler
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

      const projectBlob = await zip.generateAsync({ type: "blob" });
      FileSaver.saveAs(projectBlob, `${projectName}.zip`);

      resolve();
    } catch (err) {
      console.error("error in downloadIDBProject API");
      reject(err);
    }
  });
};

export const parseFile = (
  ext: string,
  content: string,
): TFileParserResponse => {
  return fileHandlers[ext]
    ? fileHandlers[ext](content)
    : { contentInApp: "", nodeTree: {}, htmlDom: null };
};
