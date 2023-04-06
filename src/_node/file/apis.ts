import { Buffer } from 'buffer';

import {
  RootNodeUid,
  StagePreviewPathPrefix,
} from '@_constants/main';
import { SystemDirectories } from '@_ref/SystemDirectories';
import { verifyFileHandlerPermission } from '@_services/main';
import { TOsType } from '@_types/global';
import { TFileType } from '@_types/main';

import {
  getSubNodeUidsByBfs,
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
  TIDBFileInfo,
  TIDBFileInfoObj,
} from './types';

export const _fs = window.Filer.fs
export const _path = window.Filer.path
export const _sh = new _fs.Shell()

export const initDefaultProject = async (projectPath: string): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    // remove original default project
    try {
      await removeFileSystem(projectPath)
    } catch (err) {

    }

    // create new default project
    try {
      await createDefaultProject(projectPath)
      resolve()
    } catch (err) {
      reject(err)
    }
  })
}
export const createDefaultProject = async (projectPath: string): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      // create root directory
      await createDirectory(projectPath)

      // create index.html
      const indexHtmlPath = `${projectPath}/index.html`
      const indexHtmlContent = `<!DOCTYPE html>

<html>

<head></head>

<body>
  <h1>Build Web Page with Rainbow</h1>
</body>

</html>`
      await writeFile(indexHtmlPath, indexHtmlContent)

      resolve()
    } catch (err) {
      reject(err)
    }
  })
}
export const loadDefaultProject = async (projectPath: string): Promise<TIDBFileInfoObj> => {
  return new Promise<TIDBFileInfoObj>(async (resolve, reject) => {
    try {
      // build project-root
      const rootHandler: TIDBFileInfo = {
        uid: RootNodeUid,
        parentUid: null,
        children: [],
        path: projectPath,
        kind: 'directory',
        name: 'default project',
      }
      const handlerObj: TIDBFileInfoObj = { [RootNodeUid]: rootHandler }

      // loop through the project
      const dirHandlers: TIDBFileInfo[] = [rootHandler]
      while (dirHandlers.length) {
        const { uid, path } = dirHandlers.shift() as TIDBFileInfo

        const entries = await readDir(path)
        await Promise.all(entries.map(async (entry) => {
          // skip stage preview files
          if (entry.startsWith(StagePreviewPathPrefix)) return

          // build handler
          const c_uid = _path.join(uid, entry) as string
          const c_path = _path.join(path, entry) as string
          const stats = await getStat(c_path)
          const c_name = entry
          const c_kind = stats.type === 'DIRECTORY' ? 'directory' : 'file'

          const c_ext = _path.extname(c_name) as string
          const nameArr = c_name.split('.')
          nameArr.length > 1 && nameArr.pop()
          const _c_name = nameArr.join('.')

          const handlerInfo: TIDBFileInfo = {
            uid: c_uid,
            parentUid: uid,
            children: [],
            path: c_path,
            kind: c_kind,
            name: c_kind === 'directory' ? c_name : _c_name,
            ext: c_ext,
            content: c_kind === 'directory' ? undefined : await readFile(c_path),
          }

          // update handler-obj
          handlerObj[uid].children.push(c_uid)
          handlerObj[c_uid] = handlerInfo

          c_kind === 'directory' && dirHandlers.push(handlerInfo)
        }))
      }

      resolve(handlerObj)
    } catch (err) {
      reject(err)
    }
  })
}
export const reloadDefaultProject = async (projectPath: string, ffTree: TNodeTreeData): Promise<{ handlerObj: TIDBFileInfoObj, deletedUids: TNodeUid[] }> => {
  return new Promise<{ handlerObj: TIDBFileInfoObj, deletedUids: TNodeUid[] }>(async (resolve, reject) => {
    try {
      // build project-root
      const rootHandler: TIDBFileInfo = {
        uid: RootNodeUid,
        parentUid: null,
        children: [],
        path: projectPath,
        kind: 'directory',
        name: 'default project',
      }
      const handlerObj: TIDBFileInfoObj = { [RootNodeUid]: rootHandler }

      const orgUids: { [uid: TNodeUid]: true } = {}
      getSubNodeUidsByBfs(RootNodeUid, ffTree, false).map(uid => {
        orgUids[uid] = true
      })

      // loop through the project
      const dirHandlers: TIDBFileInfo[] = [rootHandler]
      while (dirHandlers.length) {
        const { uid, path } = dirHandlers.shift() as TIDBFileInfo

        const entries = await readDir(path)
        await Promise.all(entries.map(async (entry) => {
          // skip stage preview files
          if (entry.startsWith(StagePreviewPathPrefix)) return

          // build handler
          const c_uid = _path.join(uid, entry) as string
          const c_path = _path.join(path, entry) as string
          const stats = await getStat(c_path)
          const c_name = entry
          const c_kind = stats.type === 'DIRECTORY' ? 'directory' : 'file'

          const c_ext = _path.extname(c_name) as string
          const nameArr = c_name.split('.')
          nameArr.length > 1 && nameArr.pop()
          const _c_name = nameArr.join('.')

          delete orgUids[c_uid]

          const handlerInfo: TIDBFileInfo = {
            uid: c_uid,
            parentUid: uid,
            children: [],
            path: c_path,
            kind: c_kind,
            name: c_kind === 'directory' ? c_name : _c_name,
            ext: c_ext,
            content: c_kind === 'directory' ? undefined : await readFile(c_path),
          }

          // update handler-obj
          handlerObj[uid].children.push(c_uid)
          handlerObj[c_uid] = handlerInfo

          c_kind === 'directory' && dirHandlers.push(handlerInfo)
        }))
      }

      resolve({ handlerObj, deletedUids: Object.keys(orgUids) })
    } catch (err) {
      reject(err)
    }
  })
}

export const loadLocalProject = async (projectHandle: FileSystemDirectoryHandle, osType: TOsType): Promise<TFileHandlerInfoObj> => {
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
          const c_uid = _path.join(uid, entry.name) as string
          const c_path = _path.join(path, entry.name) as string
          const c_kind = entry.kind
          const c_name = entry.name
          const c_handler = entry

          const c_ext = _path.extname(c_name) as string
          const nameArr = c_name.split('.')
          nameArr.length > 1 && nameArr.pop()
          const _c_name = nameArr.join('.')

          const handlerInfo: TFileHandlerInfo = {
            uid: c_uid,
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
          handlerObj[uid].children.push(c_uid)
          handlerObj[c_uid] = handlerInfo

          c_kind === 'directory' && dirHandlers.push(handlerInfo)
          fsToCreate[c_path] = true
        }
      } catch (err) {
        rej(err)
      }
    }

    // build idb
    try {
      await Promise.all(handlerArr.map(async (_handler) => {
        const { uid, kind, path, handler } = _handler
        if (kind === 'directory') {
          // create directory
          await createDirectory(path)
        } else {
          // read and store file content
          const fileEntry = await (handler as FileSystemFileHandle).getFile()
          const contentBuffer = Buffer.from(await fileEntry.arrayBuffer())
          handlerObj[uid].content = contentBuffer
          await writeFile(path, contentBuffer)
        }
      }))
    } catch (err) {
    }

    res(handlerObj)
  })
}
export const reloadLocalProject = async (projectHandle: FileSystemDirectoryHandle, ffTree: TNodeTreeData, osType: TOsType): Promise<{ handlerObj: TFileHandlerInfoObj, deletedUids: TNodeUid[] }> => {
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
    const handlerArr: TFileHandlerInfo[] = []
    const handlerObj: TFileHandlerInfoObj = { [RootNodeUid]: rootHandler }
    const fsToCreate: { [path: string]: boolean } = {}

    const orgUids: { [uid: TNodeUid]: true } = {}
    getSubNodeUidsByBfs(RootNodeUid, ffTree, false).map(uid => {
      orgUids[uid] = true
    })

    // loop through the project
    const dirHandlers: TFileHandlerInfo[] = [rootHandler]
    while (dirHandlers.length) {
      const { uid, path, handler } = dirHandlers.shift() as TFileHandlerInfo
      try {
        for await (const entry of (handler as FileSystemDirectoryHandle).values()) {
          // skip system directories
          if (SystemDirectories[osType][entry.name]) continue

          // build handler
          const c_uid = _path.join(uid, entry.name) as string
          const c_path = _path.join(path, entry.name) as string
          const c_kind = entry.kind
          const c_name = entry.name
          const c_handler = entry

          const c_ext = _path.extname(c_name) as string
          const nameArr = c_name.split('.')
          nameArr.length > 1 && nameArr.pop()
          const _c_name = nameArr.join('.')

          delete orgUids[c_uid]

          const handlerInfo: TFileHandlerInfo = {
            uid: c_uid,
            parentUid: uid,
            path: c_path,
            kind: c_kind,
            name: c_kind === 'directory' ? c_name : _c_name,
            ext: c_ext,
            handler: c_handler,
            children: [],
          }

          // update handler-arr, handler-obj
          handlerObj[uid].children.push(c_uid)
          handlerObj[c_uid] = handlerInfo
          if (!ffTree[c_uid]) {
            handlerArr.push(handlerInfo)
            fsToCreate[c_path] = true
          }

          c_kind === 'directory' && dirHandlers.push(handlerInfo)
        }
      } catch (err) {
        rej(err)
      }
    }

    // build idb
    try {
      await Promise.all(handlerArr.map(async (_handler) => {
        const { uid, kind, path, handler } = _handler
        if (kind === 'directory') {
          // create directory
          await createDirectory(path)
        } else {
          // read and store file content
          const fileEntry = await (handler as FileSystemFileHandle).getFile()
          const contentBuffer = Buffer.from(await fileEntry.arrayBuffer())
          handlerObj[uid].content = contentBuffer
          await writeFile(path, contentBuffer)
        }
      }))
    } catch (err) {
    }

    res({ handlerObj, deletedUids: Object.keys(orgUids) })
  })
}

export const createDirectory = async (path: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    _fs.mkdir(path, (err: any) => {
      err ? reject(err) : resolve()
    })
  })
}
export const readFile = async (path: string): Promise<Uint8Array> => {
  return new Promise<Uint8Array>((resolve, reject) => {
    _fs.readFile(path, (err: any, data: Buffer) => {
      err ? reject(err) : resolve(data)
    })
  })
}
export const writeFile = async (path: string, content: Uint8Array | string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    _fs.writeFile(path, content, (err: any) => {
      err ? reject(err) : resolve()
    })
  })
}
export const removeFileSystem = async (path: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    _sh.rm(path, { recursive: true }, (err: any) => {
      err ? reject(err) : resolve()
    })
  })
}
export const readDir = async (path: string): Promise<string[]> => {
  return new Promise<string[]>((resolve, reject) => {
    _fs.readdir(path, (err: any, files: string[]) => {
      err ? reject(err) : resolve(files)
    })
  })
}
export const getStat = async (path: string): Promise<any> => {
  return new Promise<any>((resolve, reject) => {
    _fs.stat(path, (err: any, stats: any) => {
      err ? reject(err) : resolve(stats)
    })
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