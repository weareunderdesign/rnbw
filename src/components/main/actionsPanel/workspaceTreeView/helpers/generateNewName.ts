import { TFileNodeType } from '@_types/main';

export const generateNewName = async (
  parentHandler: FileSystemDirectoryHandle | undefined,
  ffType: TFileNodeType,
  ffName: string,
) => {
  if (!parentHandler) return ffName;

  let newName = ffName;
  let exists = true;

  const checkExists = async (name: string) => {
    try {
      if (ffType === "*folder") {
        await parentHandler.getDirectoryHandle(name, { create: false });
      } else {
        await parentHandler.getFileHandle(name, { create: false });
      }
      return true;
    } catch (err) {
      return false;
    }
  };

  if (await checkExists(newName)) {
    let index = 0;
    while (exists) {
      const _name =
        ffType === "*folder"
          ? `${ffName} (${++index})`
          : `${ffName} (${++index}).${ffType}`;
      if (!(await checkExists(_name))) {
        newName = _name;
        exists = false;
      }
    }
  }

  return newName;
};
