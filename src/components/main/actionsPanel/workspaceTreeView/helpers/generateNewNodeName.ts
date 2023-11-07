export const generateNewNodeName = async (
  parentNode: FileSystemDirectoryHandle,
  baseName: string,
  isDirectory: boolean,
  ext: string,
) => {
  let newName = isDirectory ? `${baseName} copy` : `${baseName} copy${ext}`;
  let exists = true;
  let index = 0;

  while (exists) {
    try {
      if (isDirectory) {
        await parentNode.getDirectoryHandle(newName, { create: false });
      } else {
        await parentNode.getFileHandle(newName, { create: false });
      }
      exists = true;
    } catch (err) {
      exists = false;
    }

    if (exists) {
      index++;
      newName = isDirectory
        ? `${baseName} copy (${index})`
        : `${baseName} copy (${index})${ext}`;
    }
  }

  return newName;
};
