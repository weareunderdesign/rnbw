import { Buffer } from 'buffer';
import FileSaver from 'file-saver';
import JSZip from 'jszip';

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
  TZipFileInfo,
} from './types';

export const _fs = window.Filer.fs
export const _path = window.Filer.path
export const _sh = new _fs.Shell()

export const initIDBProject = async (projectPath: string): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    // remove original welcome project
    try {
      await removeFileSystem(projectPath)
    } catch (err) {

    }

    // create new welcome project
    try {
      await createIDBProject(projectPath)
      resolve()
    } catch (err) {
      reject(err)
    }
  })
}
export const createIDBProject = async (projectPath: string): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      // create root directory
      await createDirectory(projectPath)

      // create index.html
      const indexHtmlPath = `${projectPath}/index.html`
      const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
</head>
<body>
  <div></div>
</body>
</html>`
      
//       `<!DOCTYPE html>
// <html lang="en">
//     <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <meta http-equiv="X-UA-Compatible" content="ie=edge">
//         <title>rnbw</title>
//         <meta name="description" content="rainbow">
//         <meta property="og:title" content="design. develop. ship.">
//         <link rel="icon" href="images/favicon.png">
//         <link rel="stylesheet" href="https://unpkg.com/renecss/dist/rene.min.css">
//         <script type="module" src="https://unpkg.com/@rainbowapp/svg-icon.js/dist/svg-icon.min.js"></script>
//         <script defer data-domain="rnbw.company" src="https://plausible.io/js/script.js"></script>
//     </head>

//     <body>
//         <div class="view align-center direction-row">
//             <div class="page">
//                 <div class="align-center">
//                     <img src="https://rnbw.company/images/rnbwcolor.svg" class="box-m"></img>
//                 </div>
//                 <div class="align-center">
//                     <div class="box-m">
//                         <h4 class="text-center">
//                             welcome to rnbw! hit
//                             <span class="padding-s radius-s background-secondary">A</span>
//                             to add something. hit
//                             <span class="padding-s radius-s background-secondary">W</span>
//                             to do something. hit
//                             <span class="padding-s radius-s background-secondary">J</span>
//                             to jumpstart. hit
//                             <span class="padding-s radius-s background-secondary">O</span>
//                             to open a project. that's it, you'll get the rest of
//                             it!
//                         </h4>
//                     </div>
//                 </div>

//                 <img class="dark" src="https://rnbw.company/images/keyboard-dark.svg"></img>
//                 <img class="light" src="https://rnbw.company/images/keyboard-light.svg"></img>
//                 <div class="direction-column gap-xl">
//                     <div class="box direction-row">
//                         <p>
//                             rnbw is an environment to design in the web medium.
//                             build websites, apps, and design systems. create
//                             with popular libraries or make your stuff. while you
//                             act on your ideas, HTML & CSS are generated in the
//                             background.
//                         </p>
//                     </div>
//                     <div class="box direction-row">
//                         <p>
//                             your design is an unlimited living product. it helps
//                             you embrace HTML, CSS (and JS!) as the ultimate
//                             design tool and common ground with your development
//                             workflows. when your design is done, it’s done.
//                         </p>
//                     </div>
//                 </div>
//                 <rnbw-nav></rnbw-nav>
//             </div>
//         </div>
//         <rnbw-footer></rnbw-footer>
//     </body>
//     <script src="https://rnbw.company/rnbw-nav.js"></script>
//     <script src="https://rnbw.company/rnbw-footer.js"></script>
// </html>`
      await writeFile(indexHtmlPath, indexHtmlContent)

      resolve()
    } catch (err) {
      reject(err)
    }
  })
}
export const loadIDBProject = async (projectPath: string): Promise<TIDBFileInfoObj> => {
  return new Promise<TIDBFileInfoObj>(async (resolve, reject) => {
    try {
      // build project-root
      const rootHandler: TIDBFileInfo = {
        uid: RootNodeUid,
        parentUid: null,
        children: [],
        path: projectPath,
        kind: 'directory',
        name: 'welcome',
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

          // skip hidden files
          if (c_name[0] === '.') return

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
export const reloadIDBProject = async (projectPath: string, ffTree: TNodeTreeData): Promise<{ handlerObj: TIDBFileInfoObj, deletedUids: TNodeUid[] }> => {
  return new Promise<{ handlerObj: TIDBFileInfoObj, deletedUids: TNodeUid[] }>(async (resolve, reject) => {
    try {
      // build project-root
      const rootHandler: TIDBFileInfo = {
        uid: RootNodeUid,
        parentUid: null,
        children: [],
        path: projectPath,
        kind: 'directory',
        name: 'welcome',
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

          // skip hidden files
          if (c_name[0] === '.') return

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

          // skip hidden files
          if (c_name[0] === '.') continue

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
export const reloadLocalProject = async (projectHandle: FileSystemDirectoryHandle, ffTree: TNodeTreeData, osType: TOsType, files: TNodeUid[] = []): Promise<{ handlerObj: TFileHandlerInfoObj, deletedUids: TNodeUid[] }> => {
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

          // skip hidden files
          if (c_name[0] === '.') continue

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
          if (files.length === 0) {
            if (!ffTree[c_uid]) {
              handlerArr.push(handlerInfo)
            }
          }
          else {
            if (files.filter(file => file === c_uid).length > 0) {
              handlerArr.push(handlerInfo)
            }
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

export const downloadProject = async (projectPath: string): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const zip = new JSZip()

      // build project-root
      const projectName = projectPath.slice(1)
      const rootFolder = zip.folder(projectName)
      const rootHandler: TZipFileInfo = {
        path: projectPath,
        zip: rootFolder,
      }

      // loop through the project
      const dirHandlers: TZipFileInfo[] = [rootHandler]
      while (dirHandlers.length) {
        const { path, zip } = dirHandlers.shift() as TZipFileInfo

        const entries = await readDir(path)
        await Promise.all(entries.map(async (entry) => {
          // skip stage preview files
          if (entry.startsWith(StagePreviewPathPrefix)) return

          // build handler
          const c_path = _path.join(path, entry) as string
          const stats = await getStat(c_path)
          const c_name = entry
          const c_kind = stats.type === 'DIRECTORY' ? 'directory' : 'file'

          let c_zip: JSZip | null | undefined
          if (c_kind === 'directory') {
            c_zip = zip?.folder(c_name)
          } else {
            const content = await readFile(c_path)
            c_zip = zip?.file(c_name, content)
          }

          const handlerInfo: TZipFileInfo = {
            path: c_path,
            zip: c_zip,
          }
          c_kind === 'directory' && dirHandlers.push(handlerInfo)
        }))
      }

      const projectBlob = await zip.generateAsync({ type: 'blob' })
      FileSaver.saveAs(projectBlob, `${projectName}.zip`)

      resolve()
    } catch (err) {
      reject(err)
    }
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

export const getNormalizedPath = (path: string): { isAbsolutePath: boolean, normalizedPath: string } => {
  if (path.startsWith('https://') || path.startsWith('http://')) {
    return { isAbsolutePath: true, normalizedPath: path }
  }
  const isAbsolutePath = _path.isAbsolute(path)
  const normalizedPath = _path.normalize(path)
  return { isAbsolutePath, normalizedPath }
}