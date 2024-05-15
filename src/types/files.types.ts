interface IcreateFile {
  name: string;
  extension: string;
}

interface IcreateFolder {
  name?: string;
}

interface IgetFolderTree {
  uid: string;
}

interface IsetCurrentFile {
  uid: string;
}

interface IsetCurrentFileContent {
  content: string;
}

interface Iredo {
  steps: number;
}
interface Iundo {
  steps: number;
}

interface IcopyFiles {
  uids: string[];
}

interface IcutFiles {
  uids: string[];
}

interface Iremove {
  uids?: string[];
}

interface IpasteFiles {
  uids: string[];
  targetUid: string;
  deleteSource: boolean;
}

interface Imove {
  uids: string[];
  targetUid: string;
}
export {
  IcreateFile,
  IcreateFolder,
  IgetFolderTree,
  IsetCurrentFile,
  IsetCurrentFileContent,
  Iredo,
  Iundo,
  Iremove,
  IcopyFiles,
  IcutFiles,
  IpasteFiles,
  Imove,
};
