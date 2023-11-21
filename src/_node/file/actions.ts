import { TNodeApiPayload } from "..";

const add = () => {};
const remove = () => {};
const cut = () => {};
const copy = () => {};
const paste = () => {};
const duplicate = () => {};
const move = () => {};
const rename = () => {};

export const doFileActions = (
  params: TNodeApiPayload,
  fb?: (...params: any[]) => void,
  cb?: (...params: any[]) => void,
) => {
  const { action, osType = "Windows" } = params;

  switch (action) {
    case "add":
      add();
      break;
    case "remove":
      remove();
      break;
    case "cut":
      cut();
      break;
    case "copy":
      copy();
      break;
    case "paste":
      paste();
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
};
