import {
  parsable,
  TFileType,
} from '@_node/types';

/**
 * remove line terminator at the end of the path - remove double //
 * @param pathName 
 * @returns 
 */
export const getNormalizedPath = (pathName: string): string => {
  return pathName.replace(/\n$/g, '').split('/').filter(p => !!p).join('/')
}

/**
 * get parent path
 * @param fullPath 
 * @returns 
 */
export const getPath = (fullPath: string): string => {
  const pathArr = fullPath.split('/').filter(p => !!p)
  pathArr.pop()
  return pathArr.join('/')
}

/**
 * get the name from the full path
 * @param fullPath 
 * @returns 
 */
export const getName = (fullPath: string): string => {
  const pathArr = fullPath.split('/').filter(p => !!p)
  return pathArr.pop() as string
}

/**
 * return pathName/ffName
 * @param pathName 
 * @param ffName 
 * @returns 
 */
export const joinPath = (pathName: string, ffName: string): string => {
  return `${pathName}/${ffName}`
}

/**
 * get the file extension from the filename
 * @param fileName 
 * @returns 
 */
export const getFileExtension = (fileName: string): TFileType => {
  const fileNameArr = fileName.split('.')
  if (fileNameArr.length) {
    const fileExtension = fileNameArr[fileNameArr.length - 1]
    return !parsable[fileExtension] ? 'unknown' : fileExtension as TFileType
  }
  return 'unknown'
}

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