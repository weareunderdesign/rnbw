export const addClass = (classList: string, classToAdd: string): string => {
  const validClassList = classList
    .split(" ")
    .filter((_class) => !!_class && _class !== classToAdd)
    .join(" ");
  return `${validClassList} ${classToAdd}`;
};
export const removeClass = (
  classList: string,
  classToRemove: string,
): string => {
  const validClassList = classList
    .split(" ")
    .filter((_class) => !!_class && _class !== classToRemove)
    .join(" ");
  return validClassList;
};
export const generateQuerySelector = (path: string): string => {
  return path.replace(/[^A-Za-z]/g, (c) => c.charCodeAt(0).toString());
};
export const verifyFileHandlerPermission = async (
  fileHandle: FileSystemHandle,
): Promise<boolean> => {
  // If the file handle is undefined, return false
  if (fileHandle === undefined) return false;

  try {
    // Check if permission was already granted. If so, return true.
    const opts: FileSystemHandlePermissionDescriptor = { mode: "readwrite" };
    if ((await fileHandle.queryPermission(opts)) === "granted") return true;

    // Request permission. If the user grants permission, return true.
    if ((await fileHandle.requestPermission(opts)) === "granted") return true;

    // The user didn't grant permission, so return false.
    return false;
  } catch (err) {
    return false;
  }
};
