interface IcreateFile {
  name: string;
  extension: string;
}

interface IcreateFolder {
  name: string;
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

interface Iremove {
  uids: string[];
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
};
