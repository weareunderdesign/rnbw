import { doFileActions, doNodeActions } from ".";
import { TNodeApiPayload } from "./types";

export const callNodeApi = async (params: TNodeApiPayload, cb?: () => {}) => {
  const { isFileTree } = params;

  return new Promise<void>((resolve, reject) => {
    try {
      if (isFileTree) {
        doFileActions(params, cb);
      } else {
        doNodeActions(params, cb);
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};
