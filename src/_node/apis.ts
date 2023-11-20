import {
  f_copy,
  f_create,
  f_duplicate,
  f_move,
  f_remove,
  n_copy,
  n_create,
  n_duplicate,
  n_move,
  n_remove,
} from "./";
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
        switch (action) {
          case "create":
            f_create();
            break;
          case "remove":
            f_remove();
            break;
          case "duplicate":
            f_duplicate();
            break;
          case "move":
            f_move();
            break;
          case "copy":
            f_copy();
            break;
          default:
            break;
        }
      } else {
        if (fileExt == "html") {
          switch (action) {
            case "create":
              n_create();
              break;
            case "remove":
              n_remove();
              break;
            case "duplicate":
              n_duplicate();
              break;
            case "move":
              n_move();
              break;
            case "copy":
              n_copy();
              break;
            default:
              break;
          }
        } else {
        }
      }

      cb && cb();
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};
