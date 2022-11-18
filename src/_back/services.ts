import fs from 'fs';

import { TFileType } from '@_node/types';
import { ResMessage } from '@_types/socket';

import {
  FFNode,
  FFNodeType,
} from '../types/ff';
import {
  FolderSelectModalResponse,
  parsable,
} from './types';

/**
 * return JSON string from the message
 * @param message 
 * @returns 
 */
export const createResMessage = (message: ResMessage): string => {
  return JSON.stringify(message)
}

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

/**
 * detect if the path is a folder or a file or unlink
 * @param pathName 
 * @returns 
 */
export async function getFFNodeType(pathName: string): Promise<FFNodeType> {
  return fs.promises
    .stat(pathName)
    .then((node) => {
      if (node.isDirectory()) return "folder"
      return "file"
    })
    .catch((err: string) => {
      return "unlink"
    })
}

/**
 * load folder structure and return with it's children
 * @param folder 
 * @returns 
 */
export async function loadFolderStructure(folder: FFNode): Promise<FFNode[]> {
  const fullPath = folder.uid
  const nodeList = await fs.promises.readdir(fullPath)

  let nodes: FFNode[] = await Promise.all(
    nodeList.map(async (name) => {
      const ffNodeType = await getFFNodeType(joinPath(fullPath, name))
      return {
        uid: joinPath(folder.uid, name),
        p_uid: folder.uid,
        name: name,
        isEntity: ffNodeType === 'file' ? true : false,
        children: [],
        data: {},
      }
    })
  )
  nodes = nodes.sort((a, b) => {
    return (!a.isEntity && b.isEntity) ? -1 : 0
  })

  folder.children = nodes.map((node) => {
    return node.uid
  })

  return [folder, ...nodes]
}

/**
 * open folder-select-modal and return the selected ff path
 * @returns 
 */
export async function selectFolderFromModal(): Promise<FolderSelectModalResponse> {
  /* return {
    success: true,
    path: "D:/",
  } */
  const dialog = require('node-file-dialog')

  const config = { type: 'directory' }
  return dialog(config)
    .then((dir: string) => {
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