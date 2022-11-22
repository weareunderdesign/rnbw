import { TUid } from '@_node/types';

export const verifyPermission = async (fileHandle: FileSystemHandle): Promise<boolean> => {
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

export const validateUids = (uids: TUid[], targetUid?: TUid): TUid[] => {
  if (targetUid !== undefined) {
    uids = uids.filter((uid) => { return !uid.startsWith(targetUid) })
  }
  uids = uids.sort((a: TUid, b: TUid) => { return a < b ? -1 : 1 });
  let result: TUid[] = [];
  while (uids.length) {
    const uid = uids.shift() as TUid
    result.push(uid)
    uids = uids.filter((curUid) => { return !curUid.startsWith(uid) })
  }
  return result
}