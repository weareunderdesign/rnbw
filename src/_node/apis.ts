import { ActionsPanel } from "@_components/main";
import { fileActions, nodeActions } from ".";
import { TNodeApiPayload } from "./types";

export const callNodeApi = async (params: TNodeApiPayload, cb?: () => {}) => {
  const {
    tree,
    isFileTree,
    fileExt = "",

    action,

    selectedUids,
    tragetUid,
    isBetween = false,
    position = 0,

    codeViewInstance,
    codeViewTabSize = 2,

    osType = "Windows",
  } = params;

  return new Promise<void>((resolve, reject) => {
    try {
      if (isFileTree) {
        fileActions[action]();
      } else {
        nodeActions[action]();
      }
      cb && cb();
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};
