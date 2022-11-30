/**
 * check the permission of file handle, return true/false
 * @param fileHandle 
 * @returns 
 */
export const verifyPermission = async (fileHandle: FileSystemHandle): Promise<boolean> => {
  // If the file handle is undefined, return false
  if (fileHandle === undefined) return false

  try {
    // Check if permission was already granted. If so, return true.
    const opts: FileSystemHandlePermissionDescriptor = { mode: 'readwrite' }
    if ((await fileHandle.queryPermission(opts)) === 'granted') return true

    // Request permission. If the user grants permission, return true.
    if ((await fileHandle.requestPermission(opts)) === 'granted') return true

    // The user didn't grant permission, so return false.
    return false
  } catch (err) {
    return false
  }
}

/**
 * get the file extension from the file name
 * @param fileName 
 * @returns 
 */
export const getFileExtension = (fileName: string) => {
  const arr: string[] = fileName.split('.')
  return arr.length === 1 ? '' : `.${arr.pop()}`
}