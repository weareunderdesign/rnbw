import { SystemFiles } from '@_ref/SystemFiles';
import { verifyFileHandlerPermission } from '@_services/main';
import { TOsType } from '@_types/global';

const fs = window.Filer.fs
const sh = new fs.Shell()

export const configProject = async (projectHandle: FileSystemDirectoryHandle, osType: TOsType) => {
  // verify handler permission
  if (!(await verifyFileHandlerPermission(projectHandle))) throw 'error'

  const handlers: { url: string, name: string, handler: FileSystemHandle, content: string }[] = [{
    url: `/${projectHandle.name}`,
    name: projectHandle.name,
    handler: projectHandle,
    content: '',
  }]
  const dirHandlers: { url: string, name: string, handler: FileSystemDirectoryHandle }[] = [{
    url: `/${projectHandle.name}`,
    name: projectHandle.name,
    handler: projectHandle,
  }]

  while (dirHandlers.length) {
    const { url, name, handler } = dirHandlers.shift() as { url: string, name: string, handler: FileSystemDirectoryHandle }

    try {
      for await (const entry of handler.values()) {
        const c_url = `${url}/${entry.name}`
        const c_name = entry.name
        const c_handler = entry

        if (SystemFiles[osType][c_name]) continue

        let content = ''
        if (entry.kind === 'directory') {
          dirHandlers.push({ url: c_url, name: c_name, handler: c_handler as FileSystemDirectoryHandle })
        } else {
          const fileEntry = await (c_handler as FileSystemFileHandle).getFile()
          content = await fileEntry.text()
        }

        handlers.push({ url: c_url, name: c_name, handler: c_handler as FileSystemHandle, content })
      }
    } catch (err) {
      throw 'file handle err'
    }
  }
  console.log('handler', handlers)

  fs.stat(`/${projectHandle.name}`, (err: any, stats: any) => {
    if (err) {
      mkhandler(handlers, 0)
    } else {
      rmnod(`/${projectHandle.name}`, () => {
        mkhandler(handlers, 0)
      })
    }
  })
}
export const mkhandler = (handlers: { url: string, name: string, handler: FileSystemHandle, content: string }[], index: number) => {
  const { url, name, handler, content } = handlers[index]
  if (handler.kind === 'directory') {
    mkdir(url, () => {
      (index < handlers.length - 1) && mkhandler(handlers, index + 1)
    })
  } else {
    writeFile(url, content);
    (index < handlers.length - 1) && mkhandler(handlers, index + 1)
  }
}
export const mkdir = (url: string, cb?: () => void) => {
  fs.mkdir(url, function (err: any) {
    if (err) {
      console.log('mkdir err', url, err)
    } else {
      cb && cb()
    }
  })
}
export const writeFile = (url: string, content: string, cb?: () => void) => {
  fs.writeFile(url, content, (err: any) => {
    if (err) {
      console.log('writeFile err', url, err)
    } else {
      cb && cb()
    }
  })
}
export const rmnod = (url: string, cb?: () => void) => {
  sh.rm(url, { recursive: true }, (err: any) => {
    if (err) {
      console.log('rmnod err', url, err)
    } else {
      cb && cb()
    }
  })
}

export const mknod = (url: string, type: string, cb?: () => void) => {
  console.log('mknod', url, type)
  if (type === 'DIRECTORY') {

  }
  fs.mknod(url, type, (err: any) => {
    console.log('mknod', err)
    if (err) throw err
    console.log(cb)
    if (cb !== undefined) {
      cb()
    }
  })
}




export const renameFile = async (orgName: string, newName: string, cb?: () => void) => {
  await Promise.all([
    fs.rename(orgName, newName, (err: Error) => {
      if (err) {
        console.log('renameFile error', err)
      } else {
        console.log('renameFile success')
        cb && cb()
      }
    })
  ])
}

export const updateFile = (url: string, content: string) => {
  fs.writeFile(url, content, (err: Error) => { if (err) console.error(err) })
}

export const createFolder = (url: string, content: string) => {
  fs.writeFile(url, content, (err: Error) => { if (err) console.error(err) })
}