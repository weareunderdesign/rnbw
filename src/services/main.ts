import {
  LocalFileSystemWatchInterval,
  NodeUidSplitter,
} from '@_constants/main';
import { TNode } from '@_node/types';
import { TFileSystemType } from '@_types/main';

import { TNormalNodeData } from '../_node/types';
import { TOsType } from '../types/global';

export const addClass = (classList: string, classToAdd: string): string => {
  const validClassList = classList.split(' ').filter(_class => !!_class && _class !== classToAdd).join(' ')
  return `${validClassList} ${classToAdd}`
}
export const removeClass = (classList: string, classToRemove: string): string => {
  const validClassList = classList.split(' ').filter(_class => !!_class && _class !== classToRemove).join(' ')
  return validClassList
}

/**
 * get file system watch interval from its type
 * @param fsType 
 * @returns 
 */
export const getFileSystemWatchInterval = (fsType: TFileSystemType): number => {
  return fsType === 'local' ? LocalFileSystemWatchInterval : 0
}

/**
 * get temporary file extension based on os type
 * @param osType 
 * @returns 
 */
export const getTemporaryFileExtension = (osType: TOsType) => {
  return osType === 'Windows' ? '.crswap' :
    osType === 'Mac' ? '.crswap' :
      osType === 'Linux' ? '.crswap' : ''
}

/**
 * return temporary created file name
 * @param node 
 * @param newName 
 * @param osType 
 * @returns 
 */
export const getTemporaryFileNodeUid = (node: TNode, newName: string, osType: TOsType): string => {
  const data = node.data as TNormalNodeData
  const newUid = `${node.parentUid}${NodeUidSplitter}${newName}${data.type === '*folder' ? '' : `.${data.type}`}`

  const ext = osType === 'Windows' ? '.crswap' :
    osType === 'Mac' ? '.crswap' :
      osType === 'Linux' ? '.crswap' : ''

  return data.type === '*folder' ? `${newUid}` : `${newUid}${ext}`
}

/**
 * check the permission of file handle, return true/false
 * @param fileHandle 
 * @returns 
 */
export const verifyFileHandlerPermission = async (fileHandle: FileSystemHandle): Promise<boolean> => {
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