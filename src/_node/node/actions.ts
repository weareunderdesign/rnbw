import { TNodeApiPayload } from "..";

const create = () => {};
const remove = () => {};
const duplicate = () => {};
const move = () => {};
const copy = () => {};

export const doNodeActions = (params: TNodeApiPayload, cb?: () => {}) => {
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

  switch (action) {
    case "create":
      create();
      break;
    case "remove":
      remove();
      break;
    case "duplicate":
      duplicate();
      break;
    case "move":
      move();
      break;
    case "copy":
      copy();
      break;
    default:
      break;
  }

  cb && cb();
};
