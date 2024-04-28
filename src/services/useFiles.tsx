//Create
const createFile = () => {};
const createFolder = () => {};

//Read
const getRootTree = () => {};
const getFolderTree = () => {};
const getCurrentFile = () => {};
const copySelectedFiles = () => {};
const cutSelectedFiles = () => {};
const getSelectedFiles = () => {};

//Update
const setCurrentFile = () => {};
const setCurrentFileContent = () => {};
const rename = () => {};
const undo = () => {};
const redo = () => {};
const paste = () => {};
const move = () => {};

//Delete
const remove = () => {};
export default function useFiles() {
  return {
    createFile,
    createFolder,
    getRootTree,
    getFolderTree,
    getCurrentFile,
    copySelectedFiles,
    cutSelectedFiles,
    getSelectedFiles,
    setCurrentFile,
    setCurrentFileContent,
    rename,
    undo,
    redo,
    paste,
    move,
    remove,
  };
}
