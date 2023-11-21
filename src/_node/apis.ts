import { doFileActions, doNodeActions } from ".";
import { TNodeApiPayload } from "./types";

export const callNodeApi = async (
  params: TNodeApiPayload,
  fb?: (...params: any[]) => void,
  cb?: (...params: any[]) => void,
) => {
  const { isFileTree = false } = params;

  return new Promise<void>((resolve, reject) => {
    try {
      if (isFileTree) {
        doFileActions(params, fb, cb);
      } else {
        doNodeActions(params, fb, cb);
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};
