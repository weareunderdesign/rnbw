import {
  LogAllow,
  RootNodeUid,
} from '@_constants/main';
import { SystemFiles } from '@_ref/SystemFiles';
import { verifyFileHandlerPermission } from '@_services/main';
import { TOsType } from '@_types/global';
import { TFileType } from '@_types/main';

import {
  parseHtml,
  serializeHtml,
  TFileParserResponse,
  THtmlReferenceData,
  TNodeReferenceData,
  TNodeTreeData,
} from '../';
import {
  TFileHandlerInfo,
  TFileHandlerInfoObj,
} from './types';

export const _fs = window.Filer.fs
export const _path = window.Filer.path
export const _sh = new _fs.Shell()

export const configProject = async (projectHandle: FileSystemDirectoryHandle, osType: TOsType, cb: () => void): Promise<TFileHandlerInfoObj> => {
  // verify handler permission
  if (!(await verifyFileHandlerPermission(projectHandle))) throw 'error'

  // loop through the project
  const rootHandler: TFileHandlerInfo = {
    uid: RootNodeUid,
    parentUid: null,
    path: `/${projectHandle.name}`,
    kind: 'directory',
    name: projectHandle.name,
    handler: projectHandle,
    children: [],
  }
  const handlers: TFileHandlerInfo[] = [rootHandler]
  const handlerObj: TFileHandlerInfoObj = { [RootNodeUid]: rootHandler }
  const dirHandlers: TFileHandlerInfo[] = [rootHandler]
  while (dirHandlers.length) {
    const { uid, path, handler } = dirHandlers.shift() as TFileHandlerInfo

    try {
      for await (const entry of (handler as FileSystemDirectoryHandle).values()) {
        const c_path = _path.join(path, entry.name) as string
        const c_kind = entry.kind
        const c_name = entry.name
        const c_handler = entry

        if (SystemFiles[osType][c_name]) continue

        handlerObj[uid].children.push(c_path)
        if (entry.kind === 'directory') {
          const handlerInfo: TFileHandlerInfo = {
            uid: c_path,
            parentUid: uid,
            path: c_path,
            kind: c_kind,
            name: c_name,
            handler: c_handler,
            children: [],
          }

          dirHandlers.push(handlerInfo)
          handlers.push(handlerInfo)
          handlerObj[c_path] = handlerInfo
        } else {
          const c_ext = _path.extname(c_name) as string
          const nameArr = c_name.split('.')
          nameArr.length > 1 && nameArr.pop()
          const _c_name = nameArr.join('.')

          const fileEntry = await (c_handler as FileSystemFileHandle).getFile()
          const c_content = await fileEntry.text()

          const handlerInfo: TFileHandlerInfo = {
            uid: c_path,
            parentUid: uid,
            path: c_path,
            kind: c_kind,
            name: _c_name,
            ext: c_ext,
            handler: c_handler as FileSystemHandle,
            content: c_content,
            children: [],
          }

          handlers.push(handlerInfo)
          handlerObj[c_path] = handlerInfo
        }
      }
    } catch (err) {
      throw 'file handle err'
    }
  }

  // store project to idb
  _fs.stat(`/${projectHandle.name}`, (err: any, stats: any) => {
    if (err) {
      mkhandler(handlers, 0, cb)
    } else {
      rmnod(`/${projectHandle.name}`, () => {
        mkhandler(handlers, 0, cb)
      })
    }
  })

  // return data for file-tree-view data
  return handlerObj
}
export const mkhandler = (handlers: TFileHandlerInfo[], index: number, cb: () => void) => {
  if (handlers[index] === undefined) {
    cb()
    return
  }
  const { path, kind, content } = handlers[index]
  if (kind === 'directory') {
    mkdir(path, () => {
      mkhandler(handlers, index + 1, cb)
    })
  } else {
    writeFile(path, content as string)
    mkhandler(handlers, index + 1, cb)
  }
}
export const mkdir = (path: string, cb?: () => void) => {
  _fs.mkdir(path, function (err: any) {
    if (err) {
      LogAllow && console.log('mkdir err', path, err)
    } else {
      cb && cb()
    }
  })
}
export const writeFile = (path: string, content: string, cb?: () => void) => {
  _fs.writeFile(path, content, (err: any) => {
    if (err) {
      LogAllow && console.log('writeFile err', path, err)
    } else {
      cb && cb()
    }
  })
}
export const rmnod = (path: string, cb?: () => void) => {
  _sh.rm(path, { recursive: true }, (err: any) => {
    if (err) {
      LogAllow && console.log('rmnod err', path, err)
    } else {
      cb && cb()
    }
  })
}

export const parseFile = (type: TFileType, content: string, referenceData: TNodeReferenceData, osType: TOsType): TFileParserResponse => {
  if (type === 'html') {
    return parseHtml(content, referenceData as THtmlReferenceData, osType)
  } else {
    return {
      formattedContent: '',
      contentInApp: '',
      tree: {},
      nodeMaxUid: '0',
      info: null,
    }
  }
}
export const serializeFile = (type: TFileType, tree: TNodeTreeData, referenceData: TNodeReferenceData): string => {
  if (type === 'html') {
    const { html } = serializeHtml(tree, referenceData as THtmlReferenceData)
    return html
  }
  return ''
}