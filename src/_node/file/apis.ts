import { LogAllow } from '@_constants/main';
import { SystemFiles } from '@_ref/SystemFiles';
import { verifyFileHandlerPermission } from '@_services/main';
import { TOsType } from '@_types/global';

import {
  TFileHandlerInfo,
  TFileHandlerInfoObj,
} from './types';

export const _fs = window.Filer.fs
export const _path = window.Filer.path
/* 
var path = Filer.path;
var dir = path.dirname('/foo/bar/baz/asdf/quux');
// dir is now '/foo/bar/baz/asdf'

var base = path.basename('/foo/bar/baz/asdf/quux.html');
// base is now 'quux.html'

var ext = path.extname('index.html');
// ext is now '.html'

var newpath = path.join('/foo', 'bar', 'baz/asdf', 'quux', '..');
// new path is now '/foo/bar/baz/asdf'
*/
export const _sh = new _fs.Shell()

export const configProject = async (projectHandle: FileSystemDirectoryHandle, osType: TOsType): Promise<{ handlerObj: TFileHandlerInfoObj, maxUid: number }> => {
  // verify handler permission
  if (!(await verifyFileHandlerPermission(projectHandle))) throw 'error'

  // loop through the project
  let UID = 0
  const rootHandler: TFileHandlerInfo = {
    uid: ++UID,
    parentUid: 0,
    path: `/${projectHandle.name}`,
    kind: 'directory',
    name: projectHandle.name,
    handler: projectHandle,
    children: [],
  }
  const handlers: TFileHandlerInfo[] = [rootHandler]
  const handlerObj: TFileHandlerInfoObj = { 1: rootHandler }
  const dirHandlers: TFileHandlerInfo[] = [rootHandler]
  while (dirHandlers.length) {
    const { uid, path, handler } = dirHandlers.shift() as TFileHandlerInfo

    try {
      for await (const entry of (handler as FileSystemDirectoryHandle).values()) {
        const c_path = _path.join(path, entry.name)
        const c_kind = entry.kind
        const c_name = entry.name
        const c_handler = entry

        if (SystemFiles[osType][c_name]) continue

        handlerObj[uid].children.push(++UID)
        if (entry.kind === 'directory') {
          const handlerInfo: TFileHandlerInfo = {
            uid: UID,
            parentUid: uid,
            path: c_path,
            kind: c_kind,
            name: c_name,
            handler: c_handler,
            children: [],
          }

          dirHandlers.push(handlerInfo)
          handlers.push(handlerInfo)
          handlerObj[UID] = handlerInfo
        } else {
          const c_ext = _path.extname(c_name)
          const fileEntry = await (c_handler as FileSystemFileHandle).getFile()
          const c_content = await fileEntry.text()

          const handlerInfo: TFileHandlerInfo = {
            uid: UID,
            parentUid: uid,
            path: c_path,
            kind: c_kind,
            name: c_name,
            ext: c_ext,
            handler: c_handler as FileSystemHandle,
            content: c_content,
            children: [],
          }

          handlers.push(handlerInfo)
          handlerObj[UID] = handlerInfo
        }
      }
    } catch (err) {
      throw 'file handle err'
    }
  }

  // store project to idb
  _fs.stat(`/${projectHandle.name}`, (err: any, stats: any) => {
    if (err) {
      mkhandler(handlers, 0)
    } else {
      rmnod(`/${projectHandle.name}`, () => {
        mkhandler(handlers, 0)
      })
    }
  })

  // return data for file-tree-view data
  return { handlerObj, maxUid: UID }
}
export const mkhandler = (handlers: TFileHandlerInfo[], index: number) => {
  const { path, kind, content } = handlers[index]
  if (kind === 'directory') {
    mkdir(path, () => {
      index < handlers.length - 1 && mkhandler(handlers, index + 1)
    })
  } else {
    writeFile(path, content as string)
    index < handlers.length - 1 && mkhandler(handlers, index + 1)
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