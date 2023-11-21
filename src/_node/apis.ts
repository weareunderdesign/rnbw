import { doFileActions, doNodeActions } from ".";
import { TNodeApiPayload } from "./types";

export const callNodeApi = async (
  params: TNodeApiPayload,
  cb?: ({ updatedHtml }: { updatedHtml?: string }) => void,
) => {
  const { isFileTree } = params;

  return new Promise<void>((resolve, reject) => {
    try {
      if (isFileTree) {
        doFileActions(params, cb);
      } else {
        const updatedHtml = doNodeActions(params);
        if (updatedHtml) {
          cb && cb({ updatedHtml });
        }
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};
