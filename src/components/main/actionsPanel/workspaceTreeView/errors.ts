import { TToast } from '@_types/index';

export const folderError: TToast = {
  type: "error",
  content: "Error occurred while creating a new folder.",
};

export const fileError: TToast = {
  type: "error",
  content: "Error occurred while creating a new file.",
};

export const renamingError: TToast = {
  type: "error",
  content: "Error occurred while renaming ...",
};

export const deletingWarning: TToast = {
  type: "warning",
  content: "Some directory/file couldn't be deleted.",
};

export const invalidDirError: TToast = {
  type: "error",
  content: `Invalid target directory. Check if you have "write" permission for the directory.`,
};

export const movingError: TToast = {
  type: "warning",
  content: "Some directory/file couldn't be moved.",
};

export const duplicatingWarning: TToast = {
  type: "warning",
  content: "Some directory/file couldn't be duplicated.",
};

export const invalidDirOrFile: TToast = {
  type: "error",
  content: `Invalid directory/file. Check if you have "write" permission for the directory/file.`,
};
