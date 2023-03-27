import { Buffer } from 'buffer';

import {
  LogAllow,
  RootNodeUid,
} from '@_constants/main';
import { SystemDirectories } from '@_ref/SystemDirectories';
import { verifyFileHandlerPermission } from '@_services/main';
import { TOsType } from '@_types/global';
import { TFileType } from '@_types/main';

import {
  parseHtml,
  serializeHtml,
  TFileParserResponse,
  THtmlNodeData,
  THtmlReferenceData,
  TNodeReferenceData,
  TNodeTreeData,
  TNodeUid,
} from '../';
import {
  TFileHandlerInfo,
  TFileHandlerInfoObj,
} from './types';

export const _fs = window.Filer.fs
export const _path = window.Filer.path
export const _sh = new _fs.Shell()

export const configProject = async (projectHandle: FileSystemDirectoryHandle, osType: TOsType): Promise<TFileHandlerInfoObj> => {
  return new Promise(async (res, rej) => {
    // verify project-handler permission
    if (!(await verifyFileHandlerPermission(projectHandle))) rej('project handler permission error')

    // build project-root
    const rootHandler: TFileHandlerInfo = {
      uid: RootNodeUid,
      parentUid: null,
      path: `/${projectHandle.name}`,
      kind: 'directory',
      name: projectHandle.name,
      handler: projectHandle,
      children: [],
    }
    const handlerArr: TFileHandlerInfo[] = [rootHandler]
    const handlerObj: TFileHandlerInfoObj = { [RootNodeUid]: rootHandler }
    const fsToCreate: { [path: string]: boolean } = { [rootHandler.path]: true }

    // loop through the project
    const dirHandlers: TFileHandlerInfo[] = [rootHandler]
    while (dirHandlers.length) {
      const { uid, path, handler } = dirHandlers.shift() as TFileHandlerInfo
      try {
        for await (const entry of (handler as FileSystemDirectoryHandle).values()) {
          // skip system directories
          if (SystemDirectories[osType][entry.name]) continue

          // build handler
          const c_path = _path.join(path, entry.name) as string
          const c_kind = entry.kind
          const c_name = entry.name
          const c_handler = entry

          const c_ext = _path.extname(c_name) as string
          const nameArr = c_name.split('.')
          nameArr.length > 1 && nameArr.pop()
          const _c_name = nameArr.join('.')

          const handlerInfo: TFileHandlerInfo = {
            uid: c_path,
            parentUid: uid,
            path: c_path,
            kind: c_kind,
            name: c_kind === 'directory' ? c_name : _c_name,
            ext: c_ext,
            handler: c_handler,
            children: [],
          }

          // update handler-arr, handler-obj
          handlerArr.push(handlerInfo)
          handlerObj[uid].children.push(c_path)
          handlerObj[c_path] = handlerInfo

          c_kind === 'directory' && dirHandlers.push(handlerInfo)
          fsToCreate[c_path] = true
        }
      } catch (err) {
        rej(err)
      }
    }

    // build idb
    await Promise.all(handlerArr.map(async (_handler) => {
      const { kind, path, handler } = _handler
      if (kind === 'directory') {
        // create dir
        createDirectory(path, () => {
          delete fsToCreate[path]
          if (Object.keys(fsToCreate).length === 0) {
            res(handlerObj)
          }
        }, () => {
          delete fsToCreate[path]
          if (Object.keys(fsToCreate).length === 0) {
            res(handlerObj)
          }
        })
      } else {
        // read and store file content
        const fileEntry = await (handler as FileSystemFileHandle).getFile()
        const fileReader = new FileReader()
        fileReader.onload = (e) => {
          const content = new Uint8Array(e.target?.result as ArrayBuffer)
          const contentBuffer = Buffer.from(content)
          handlerObj[path].content = contentBuffer
          writeFile(path, contentBuffer, () => {
            delete fsToCreate[path]
            if (Object.keys(fsToCreate).length === 0) {
              res(handlerObj)
            }
          }, () => {
            delete fsToCreate[path]
            if (Object.keys(fsToCreate).length === 0) {
              res(handlerObj)
            }
          })
        }
        fileReader.readAsArrayBuffer(fileEntry)
      }
    }))
  })
}
export const createDirectory = (path: string, cb?: () => void, fb?: () => void) => {
  _fs.mkdir(path, function (err: any) {
    if (err) {
      LogAllow && console.log('_fs.mkdir err', path, err)
      fb && fb()
    } else {
      LogAllow && console.log('created directory', path)
      cb && cb()
    }
  })
}
export const writeFile = (path: string, content: Uint8Array | string, cb?: () => void, fb?: () => void) => {
  _fs.writeFile(path, content, (err: any) => {
    if (err) {
      LogAllow && console.log('_fs.writeFile err', path, err)
      fb && fb()
    } else {
      LogAllow && console.log('wrote file', path)
      cb && cb()
    }
  })
}
export const removeFileSystem = (path: string, cb?: () => void) => {
  _sh.rm(path, { recursive: true }, (err: any) => {
    if (err) {
      LogAllow && console.log('rmnod err', path, err)
    } else {
      cb && cb()
    }
  })
}

export const parseFile = (type: TFileType, content: string, referenceData: TNodeReferenceData, osType: TOsType, keepNodeUids: null | boolean = false, nodeMaxUid: TNodeUid = ''): TFileParserResponse => {
  if (type === 'html') {
    return parseHtml(content, referenceData as THtmlReferenceData, osType, keepNodeUids, nodeMaxUid)
  } else {
    return {
      formattedContent: '',
      contentInApp: '',
      tree: {},
      nodeMaxUid: '0',
    }
  }
}
export const serializeFile = (type: TFileType, tree: TNodeTreeData, referenceData: TNodeReferenceData, osType: TOsType): THtmlNodeData | string => {
  if (type === 'html') {
    return serializeHtml(tree, referenceData as THtmlReferenceData, osType)
  }
  return ''
}