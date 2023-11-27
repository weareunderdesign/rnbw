import { LogAllow } from "@_constants/global";
import { TFileApiPayload, TNodeApiPayload } from "..";

const add = () => {};
const remove = () => {};
const cut = () => {};
const copy = () => {};
const paste = () => {};
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

      resolve();
    } catch (err) {
      LogAllow && console.error(err);
      fb && fb();
      reject();
    }
  });
};
