import { TFile } from "@_types/main";

export const getFileNameFromPath = (file: TFile) => {
  return file.uid.split("/")[file.uid.split("/").length - 1];
};
