import { TNodeActionType, TNodeApiPayload } from "..";

const create = () => {};
const remove = () => {};
const duplicate = () => {};
const move = () => {};
const copy = () => {};

export const doFileActions = (params: TNodeApiPayload, cb?: () => {}) => {
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
};
