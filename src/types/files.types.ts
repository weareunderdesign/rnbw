interface IcreateFile {
  entityName: string;
  extension: string;
}

interface IcreateFolder {
  entityName?: string;
}

interface IgetFolderTree {
  uid: string;
}

interface IsetCurrentFile {
  uid: string;
}

interface IrenameFiles {
  uid: string;
  newName: string;
  extension?: string;
}

interface IsetCurrentFileContent {
  content: string;
}

interface IcopyFiles {
  uids?: string[];
}

interface IcutFiles {
  uids?: string[];
}

interface Iremove {
  uids?: string[];
}

interface IpasteFiles {
  uids?: string[];
  targetUid?: string;
  deleteSource?: boolean;
}

interface Imove {
  uids: string[];
  targetUid: string;
}
export {
  IcreateFile,
  IcreateFolder,
  IgetFolderTree,
  IrenameFiles,
  IsetCurrentFile,
  IsetCurrentFileContent,
  Iremove,
  IcopyFiles,
  IcutFiles,
  IpasteFiles,
  Imove,
};
