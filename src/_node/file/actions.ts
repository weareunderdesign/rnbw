import { LogAllow } from "@_constants/global";

import {
  TFileApiPayload,
  TFileHandlerCollection,
  TFileNodeTreeData,
  TNodeUid,
} from "../";
import { TProjectContext } from "@_redux/main/fileTree";
import { FileSystemApis } from "./FileSystemApis";

const create = () => {};
const remove = async ({
  projectContext,
  uids,
  fileTree,
  fileHandlers,
}: {
  projectContext: TProjectContext;
  uids: TNodeUid[];
  fileTree: TFileNodeTreeData;
  fileHandlers?: TFileHandlerCollection;
}): Promise<boolean> => {
  return new Promise<boolean>((resolve, reject) => {
    try {
      let Alldone = true;
      uids.map((uid) => {
        const done = FileSystemApis[projectContext].removeSingleDirectoryOrFile(
          {
            uid,
            fileTree,
            fileHandlers: fileHandlers || {},
          },
        );
        if (!done) Alldone = false;
      });
      resolve(Alldone);
    } catch (err) {
      reject(err);
    }
  });
};
const cut = () => {};
const copy = () => {};
const duplicate = () => {};
const move = () => {};
const rename = () => {};

export const doFileActions = async (
  params: TFileApiPayload,
  fb?: (...params: any[]) => void,
  cb?: (...params: any[]) => void,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const {
        projectContext,
        action,
        uids,
        fileTree,
        fileHandlers,
        osType = "Windows",
      } = params;

      switch (action) {
        case "create":
          create();
          break;
        case "remove":
          remove({
            projectContext,
            uids,
            fileTree,
            fileHandlers,
          });
          break;
        case "cut":
          cut();
          break;
        case "copy":
          copy();
          break;
        case "duplicate":
          duplicate();
          break;
        case "move":
          move();
          break;
        case "rename":
          rename();
          break;
        default:
          break;
      }

      resolve();
    } catch (err) {
      LogAllow && console.error(err);
      fb && fb();
      reject();
    }
  });
};
