export const verifyPermission = async (fileHandle: FileSystemHandle) => {
  // Check if permission was already granted. If so, return true.
  const opts: FileSystemHandlePermissionDescriptor = {
    mode: 'readwrite'
  }
  console.log("handle check")
  if (fileHandle === undefined)
    return false
  console.log("query check")  
  if ((await fileHandle.queryPermission(opts)) === 'granted') {
    return true
  }
  console.log("request check")
  // Request permission. If the user grants permission, return true.
  if ((await fileHandle.requestPermission(opts)) === 'granted') {
    return true
  }
  // The user didn't grant permission, so return false.
  return false
}