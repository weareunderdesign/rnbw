export const verifyPermission = async (fileHandle: FileSystemHandle) => {
  // Check if permission was already granted. If so, return true.
  const opts: FileSystemHandlePermissionDescriptor = {
    mode: 'readwrite'
  }

  if (fileHandle === undefined)
    return false
    
  if ((await fileHandle.queryPermission(opts)) === 'granted') {
    return true
  }
  // Request permission. If the user grants permission, return true.
  if ((await fileHandle.requestPermission(opts)) === 'granted') {
    return true
  }
  // The user didn't grant permission, so return false.
  return false
}