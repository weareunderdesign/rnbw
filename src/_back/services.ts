import fs from 'fs';

import {
  NAME,
  PATH,
  ResMessage,
} from '@_types/global';

import {
  FFNodeType,
  FFObject,
  FileExtension,
  validFileExtensions,
} from '../types/ff';
import { FolderSelectModalResponse } from './types';

// return JSON string from the message
export const createResMessage = (message: ResMessage): string => {
  return JSON.stringify(message)
}

// UUID generator
export const generateUID = () => {
  var dt = new Date().getTime()
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)
    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
  return uuid
}

// remove line terminator at the end of the path
export const getNormalizedPath = (pathName: PATH): PATH => {
  return pathName.replace(/\n$/g, '')
}
// get parent path
export const getPath = (fullPath: PATH): PATH => {
  const pathArr = fullPath.split('/').filter(p => !!p)
  pathArr.pop()
  return pathArr.join('/')
}
// get the current node's name
export const getName = (fullPath: PATH): NAME => {
  const pathArr = fullPath.split('/').filter(p => !!p)
  return pathArr.pop() as NAME
}

// return path + name for FFObject
export const getFullPath = (ffObject: FFObject): PATH => {
  return ffObject.path + (ffObject.path == '' ? '' : '/') + ffObject.name
}
export const joinPath = (pathName: PATH, fileName: NAME): PATH => {
  return `${pathName}/${fileName}`
}

// get the file extension from the filename
export const getFileExtension = (fileName: NAME): FileExtension => {
  const fileNameArr = fileName.split('.')
  const fileExtension = fileNameArr[fileNameArr.length - 1]
  const validCheckResult = validFileExtensions.filter((validFileExt) => {
    return validFileExt === fileExtension
  })
  return validCheckResult.length === 0 ? 'unknown' : fileExtension as FileExtension
}

// get if the pathName is folder or file or unlink
export async function getFFNodeType(pathName: PATH): Promise<FFNodeType> {
  return fs.promises
    .stat(pathName)
    .then((node) => {
      if (node.isDirectory()) return "folder"
      return "file"
    })
    .catch((err: string) => {
      console.log(err)
      return "unlink"
    })
}
// load folder structure and return with it's children
export async function loadFolderStructure(folder: FFObject): Promise<FFObject[]> {
  const fullPath = getFullPath(folder)
  const ffNames = await fs.promises.readdir(fullPath)

  let ffNodes: FFObject[] = await Promise.all(
    ffNames.map(async (ffName) => {
      const ffNodeType = await getFFNodeType(joinPath(fullPath, ffName))
      return {
        uid: generateUID(),
        p_uid: folder.uid,
        path: fullPath,
        name: ffName,
        type: ffNodeType,
        children: [],
      }
    })
  )
  ffNodes = ffNodes.sort((a, b) => {
    return a.type != b.type && a.type === 'folder' ? -1 : 0
  })

  folder.children = ffNodes.map((ffNode) => {
    return ffNode.uid
  })

  return [folder, ...ffNodes]
}
// open folder-select-modal and return the selected ff path
export async function selectFolderFromModal(): Promise<FolderSelectModalResponse> {
  /* return {
    success: true,
    path: "D:/",
  } */
  const dialog = require('node-file-dialog')

  const config = { type: 'directory' }
  return dialog(config)
    .then((dir: PATH) => {
      return {
        success: true,
        path: dir[0],
      }
    })
    .catch((err: string) => {
      console.log(err)
      return {
        success: false,
        error: err,
      }
    })
}