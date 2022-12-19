import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import cx from 'classnames';
import {
  FileSystemDirectoryHandle,
  FileSystemFileHandle,
  FileSystemHandle,
  showDirectoryPicker,
} from 'file-system-access';
import {
  CustomDirectoryPickerOptions,
} from 'file-system-access/lib/showDirectoryPicker';
import { DraggingPositionItem } from 'react-complex-tree';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import {
  Dialog,
  TreeView,
} from '@_components/common';
import { TreeViewData } from '@_components/common/treeView/types';
import { FileSystemWatchInterval } from '@_config/main';
import {
  generateNodeUid,
  validateUids,
} from '@_node/apis';
import { parseHtml } from '@_node/html';
import {
  TFileType,
  TNode,
  TUid,
  validFileType,
} from '@_node/types';
import * as Main from '@_redux/main';
import {
  MainContext,
  OpenedFile,
  setGlobalPending,
} from '@_redux/main';
import {
  getFileExtension,
  verifyPermission,
} from '@_services/main';
import {
  FFNode,
  FFNodeType,
  ProjectLocation,
} from '@_types/main';

import { WorkspaceTreeViewProps } from './types';

export default function WorkspaceTreeView(props: WorkspaceTreeViewProps) {
  const dispatch = useDispatch()

  // for groupping action - it contains the actionNames as keys which should be in the same group
  const runningActions = useRef<{ [actionName: string]: boolean }>({})
  const noRunningAction = () => {
    return Object.keys(runningActions.current).length === 0 ? true : false
  }
  const addRunningAction = (actionNames: string[]) => {
    for (const actionName of actionNames) {
      runningActions.current[actionName] = true
    }
  }
  const removeRunningAction = (actionNames: string[], effect: boolean = true) => {
    for (const actionName of actionNames) {
      delete runningActions.current[actionName]
    }
    if (effect && noRunningAction()) {
      dispatch(Main.increaseActionGroupIndex())
    }
  }

  // main context
  const { ffHoveredItem, setFFHoveredItem, ffHandlers, setFFHandlers, fnHoveredItem, setFNHoveredItem, nodeTree, setNodeTree, validNodeTree, setValidNodeTree, command } = useContext(MainContext)

  // redux state
  const { workspace, openedFiles, currentFile, pending, messages } = useSelector(Main.globalSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(Main.ffSelector)

  // project source location - localhost, git, dropbox, etc..
  const [projectLocation, setProjectLocation] = useState<ProjectLocation>()

  // command detect & do actions
  useEffect(() => {
    if (command.action === '') return

    switch (command.action) {
      case 'OpenProject':
        onImportProject()
        break
    }
  }, [command.changed])

  // generate TreeViewData from workspace
  const workspaceTreeViewData = useMemo(() => {
    let data: TreeViewData = {}
    for (const uid in workspace) {
      const node: FFNode = workspace[uid]
      data[uid] = {
        index: uid,
        data: node,
        children: node.children,
        isFolder: !node.isEntity,
        canMove: uid !== 'ROOT',
        canRename: uid !== 'ROOT',
      }
    }
    return data
  }, [workspace])

  // import project from localhost using filesystemdirectoryhandle
  const importLocalhostProject = useCallback(async (projectHandle: FileSystemDirectoryHandle) => {
    // verify handler permission
    if (!(await verifyPermission(projectHandle))) {
      dispatch(Main.setGlobalMessage({
        type: 'error',
        message: 'Project folder is not valid. Please import valid project.',
      }))
      throw 'error'
    }

    let handlers: { [uid: TUid]: FileSystemHandle } = { 'ROOT': projectHandle }
    let dirHandlers: { node: FFNode, handler: FileSystemDirectoryHandle }[] = [{
      node: {
        uid: 'ROOT',
        p_uid: null,
        name: projectHandle.name,
        isEntity: false,
        children: workspace['ROOT'] ? workspace['ROOT'].children : [],
        data: {
          new: workspace['ROOT'] === undefined,
        },
      },
      handler: projectHandle,
    }]

    // import all sub nodes
    let nodes: FFNode[] = []
    const deletedUids: TUid[] = []
    while (dirHandlers.length) {
      const { node: dirNode, handler: dirHandler } = dirHandlers.shift() as { node: FFNode, handler: FileSystemDirectoryHandle }

      // get the max child index
      let maxChildIndex = dirNode.children.reduce((prev: number, cur: TUid): number => {
        const childIndex = Number(cur.split("_").pop())
        return prev < childIndex ? childIndex : prev
      }, 0)

      // access file system handle and load the sub folder/file
      let subNodes: FFNode[] = []
      let hasChange = { create: false, delete: false }
      const children: { [uid: TUid]: boolean } = {}
      try {
        for await (const entry of dirHandler.values()) {
          // check if the entry already exists
          let entryExists = false
          let childNodeUid: TUid = ''
          let childNodeChildren: TUid[] = []
          dirNode.children.map((c_uid) => {
            if (workspace[c_uid] && workspace[c_uid].name === entry.name) {
              entryExists = true
              childNodeUid = c_uid
              childNodeChildren = workspace[c_uid].children
              children[c_uid] = true
            }
          })
          if (!entryExists) {
            hasChange.create = true
            childNodeUid = generateNodeUid(dirNode.uid, ++maxChildIndex)
          }

          handlers[childNodeUid] = entry
          const subNode: FFNode = {
            uid: childNodeUid,
            p_uid: dirNode.uid,
            name: entry.name,
            isEntity: entry.kind !== "directory",
            children: entryExists ? childNodeChildren : [],
            data: {
              new: !entryExists,
            },
          }
          subNodes.push(subNode)
          expandedItemsObj[childNodeUid] && dirHandlers.push({ node: subNode, handler: entry as FileSystemDirectoryHandle })
        }
      } catch (err) {
        dispatch(Main.setGlobalMessage({
          type: 'error',
          message: 'Error occurred during importing project.',
        }))
        throw 'error'
      }

      // sort the sub nodes by folder/file asc
      subNodes = subNodes.sort((a: TNode, b: TNode) => {
        return a.isEntity && !b.isEntity ? 1 :
          !a.isEntity && b.isEntity ? -1 :
            a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0
      })

      // update dirNode and push to total nodes
      dirNode.children.map((c_uid) => {
        if (children[c_uid] === undefined) {
          hasChange.delete = true
          deletedUids.push(c_uid)
        }
      })
      dirNode.data.modified = hasChange.create || hasChange.delete
      dirNode.children = []
      subNodes.map(subNode => dirNode.children.push(subNode.uid))
      nodes.push(dirNode)
      nodes.push(...subNodes)
    }

    // update the state
    setFFHandlers(deletedUids, handlers)
    dispatch(Main.updateFFTreeView({ deletedUids, nodes }))
    dispatch(Main.updateFFTreeViewState({ deletedUids }))
  }, [workspace, expandedItemsObj])

  // watch file system
  const watchFileSystem = useCallback(async () => {
    // if the project is from localhost
    if (projectLocation === 'localhost') {
      if (ffHandlers['ROOT'] === undefined || workspace['ROOT'] === undefined) {
        // do nothing
      } else {
        try {
          await importLocalhostProject(ffHandlers['ROOT'] as FileSystemDirectoryHandle)
        } catch (err) {
          dispatch(Main.clearMainState())
        }
      }
    }
  }, [projectLocation, ffHandlers, importLocalhostProject])

  // set file system watch timer
  useEffect(() => {
    let fsWatchInterval: NodeJS.Timer

    // stop if pending is true
    if (!pending) {
      // create a fs watch interval and get the id
      fsWatchInterval = setInterval(watchFileSystem, FileSystemWatchInterval)
    }

    // clear out the fs watch interval using the id when unmounting the component
    return () => clearInterval(fsWatchInterval)
  }, [pending, watchFileSystem])

  // open project button handler
  const onImportProject = useCallback(async (location: ProjectLocation = 'localhost') => {
    setProjectLocation(location)

    if (location === 'localhost') {
      addRunningAction(['importProject'])
      dispatch(setGlobalPending(true))

      // open directory picker and get the project folde handle
      let projectHandle: FileSystemHandle
      try {
        projectHandle = await showDirectoryPicker({ _preferPolyfill: false, mode: 'readwrite' } as CustomDirectoryPickerOptions)
      } catch (err) {
        dispatch(Main.setGlobalMessage({
          type: 'info',
          message: 'You canceled importing project.',
        }))

        dispatch(setGlobalPending(false))
        removeRunningAction(['importProject'], false)
        return
      }


      /* import localhost porject */
      try {
        await importLocalhostProject(projectHandle as FileSystemDirectoryHandle)
      } catch (err) {
        // error occurred
      }

      dispatch(Main.setGlobalPending(false))
      removeRunningAction(['importProject'])
    }
  }, [])

  // cb
  const cb_focusFFNode = useCallback((uid: TUid) => {
    // for key-nav
    addRunningAction(['focusFFNode'])

    // validate
    if (focusedItem === uid || workspace[uid] === undefined) {
      removeRunningAction(['focusFFNode'], false)
      return
    }

    dispatch(Main.focusFFNode(uid))
    removeRunningAction(['focusFFNode'])
  }, [focusedItem, workspace])
  const cb_selectFFNode = useCallback((uids: TUid[]) => {
    // for key-nav
    addRunningAction(['selectFFNode'])

    // validate
    let _uids = [...uids]
    _uids = validateUids(_uids)
    _uids = _uids.filter((_uid) => {
      return !(workspace[_uid] === undefined)
    })

    // check if it's new state
    if (_uids.length === selectedItems.length) {
      let same = true
      for (const _uid of _uids) {
        if (selectedItemsObj[_uid] === undefined) {
          same = false
          break
        }
      }
      if (same) {
        removeRunningAction(['selectFFNode'], false)
        return
      }
    }

    dispatch(Main.selectFFNode(_uids))
    removeRunningAction(['selectFFNode'])
  }, [workspace, selectedItems, selectedItemsObj])
  const cb_expandFFNode = useCallback(async (uid: TUid) => {
    // for key-nav
    addRunningAction(['expandFFNode'])

    // validate
    const node = workspace[uid]
    if (node === undefined || node.isEntity || expandedItemsObj[uid] === true) {
      removeRunningAction(['expandFFNode'], false)
      return
    }

    dispatch(Main.expandFFNode([uid]))
    removeRunningAction(['expandFFNode'])
  }, [workspace, expandedItemsObj])
  const cb_collapseFFNode = useCallback((uid: TUid) => {
    // for key-nav
    addRunningAction(['collapseFFNode'])

    // validate
    const node = workspace[uid]
    if (node === undefined || node.isEntity || expandedItemsObj[uid] === undefined) {
      removeRunningAction(['collapseFFNode'], false)
      return
    }

    dispatch(Main.collapseFFNode([uid]))
    removeRunningAction(['collapseFFNode'])
  }, [workspace, expandedItemsObj])

  // create directory/file dialog handle
  const [createFFModalOpen, setCreateFFModalOpen] = useState<boolean>(false)
  const [creatingFFType, setCreatingFFType] = useState<FFNodeType>()
  const [newFFName, setNewFFName] = useState<string>('')
  const openCreateFFNodeModal = useCallback((ffNodeType: FFNodeType) => {
    // validate
    const node = workspace[focusedItem]
    if (node === undefined || node.isEntity) return

    setCreatingFFType(ffNodeType)
    setNewFFName('')
    setCreateFFModalOpen(true)
  }, [workspace, focusedItem])

  // create folder/file api
  const createFFNode = useCallback(async () => {
    // close name input modal
    setCreateFFModalOpen(false)

    // addRunningAction(['createFFNode'])
    dispatch(Main.setGlobalPending(true))

    // verify handler permission
    const focusedItemHandler = ffHandlers[focusedItem] as FileSystemDirectoryHandle
    if (!(await verifyPermission(focusedItemHandler))) {
      dispatch(Main.setGlobalMessage({
        type: 'error',
        message: `Invalid target directory. Check if you have "write" permission for the directory.`,
      }))

      dispatch(Main.setGlobalPending(false))
      // removeRunningAction(['createFFNode'], false)
      return
    }

    if (creatingFFType === 'folder') {
      // generate new folder name - ex: {aaa - copy}...
      let folderName: string = newFFName
      let exists: boolean = true
      try {
        await focusedItemHandler.getDirectoryHandle(newFFName, { create: false })
        exists = true
      } catch (err) {
        exists = false
      }

      if (exists) {
        let index = 0
        while (exists) {
          const _folderName = `${newFFName} (${++index})`
          try {
            await focusedItemHandler.getDirectoryHandle(_folderName, { create: false })
            exists = true
          } catch (err) {
            folderName = _folderName
            exists = false
          }
        }
      }

      // create the directory with generated name
      try {
        await focusedItemHandler.getDirectoryHandle(folderName, { create: true })
      } catch (err) {
        dispatch(Main.setGlobalMessage({
          type: 'error',
          message: 'Error occurred while creating a new folder.',
        }))
      }
    } else if (creatingFFType === 'file') {
      // generate new file name - ex: {aaa - copy}...
      let ext: string = getFileExtension(newFFName)
      let name: string = newFFName.slice(0, newFFName.length - ext.length)

      let fileName: string = newFFName
      let exists: boolean = true
      try {
        await focusedItemHandler.getFileHandle(newFFName, { create: false })
        exists = true
      } catch (err) {
        exists = false
      }

      if (exists) {
        let index = 0
        while (exists) {
          const _fileName = `${name} (${++index})${ext}`
          try {
            await focusedItemHandler.getFileHandle(_fileName, { create: false })
            exists = true
          } catch (err) {
            fileName = _fileName
            exists = false
          }
        }
      }

      // create the file with generated name
      try {
        await focusedItemHandler.getFileHandle(fileName, { create: true })
      } catch (err) {
        dispatch(Main.setGlobalMessage({
          type: 'error',
          message: 'Error occurred while creating a new file.',
        }))
      }
    }

    dispatch(Main.setGlobalPending(false))
    // removeRunningAction(['createFFNode'])
  }, [ffHandlers, focusedItem, creatingFFType])

  // delete folder/file api
  const deleteFFNode = useCallback(async () => {
    // validate selected uids
    const uids = selectedItems
    if (uids.length === 0) return

    // addRunningAction(['deleteFFNode'])
    dispatch(Main.setGlobalPending(true))

    let allDone = true
    for (const uid of uids) {
      // validate node and parentNode
      const node: FFNode = workspace[uid]
      if (node === undefined) {
        allDone = false
        continue
      }
      const parentNode: FFNode = workspace[node.p_uid as TUid]
      if (parentNode === undefined) {
        allDone = false
        continue
      }

      // verify handler permission
      const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!(await verifyPermission(parentHandler))) {
        allDone = false
        continue
      }

      // remove the entry
      try {
        await parentHandler.removeEntry(node.name, { recursive: true })
      } catch (err) {
        allDone = false
      }
    }

    if (!allDone) {
      dispatch(Main.setGlobalMessage({
        type: 'warning',
        message: 'Some directory/file couldn\'t be deleted.',
      }))
    }

    dispatch(Main.setGlobalPending(false))
    // removeRunningAction(['deleteFFNode'])
  }, [selectedItems, workspace, ffHandlers])

  // read file content call back
  const cb_readFFNode = useCallback(async (uid: TUid) => {
    // for key-nav
    addRunningAction(['readFFNode'])

    // validate
    const node = workspace[uid]
    if (node === undefined || !node.isEntity) {
      removeRunningAction(['readFFNode'], false)
      return
    }

    dispatch(Main.setGlobalPending(true))

    // verify handler permission
    const handler = ffHandlers[uid] as FileSystemFileHandle
    if (!(await verifyPermission(handler))) {
      dispatch(Main.setGlobalMessage({
        type: 'error',
        message: 'Invalid file. Check if you have "read" permission for the file.',
      }))

      dispatch(Main.setGlobalPending(false))
      removeRunningAction(['readFFNode'], false)
      return
    }

    // get file type (extension)
    let fileType = getFileExtension(handler.name)
    if (fileType !== '') fileType = fileType.slice(1)
    fileType = validFileType[fileType] === true ? fileType : 'unknown'

    // read the file content and set to global state
    try {
      const fileEntry = await handler.getFile()
      let content = await fileEntry.text()

      // initial format code
      if (fileType === 'html') {
        content = parseHtml(content).content
      }

      const file: OpenedFile = {
        uid,
        name: handler.name,
        type: fileType as TFileType,
        content,
        saved: true
      }
      dispatch(Main.setFileContent(file))
    } catch (err) {
      dispatch(Main.setGlobalMessage({
        type: 'error',
        message: 'Error occurred while reading the file content.',
      }))
    }

    dispatch(Main.setGlobalPending(false))
    removeRunningAction(['readFFNode'])
  }, [workspace, ffHandlers])

  /**
   * general move api - for rename, copy/paste(duplicate), cut/paste(move)
   * here, the handler params are already verified ones.
   * @param handler 
   * @param parentHandler 
   * @param targetHandler 
   * @param newName 
   * @param copy 
   * @returns 
   */
  const moveFF = async (handler: FileSystemHandle, parentHandler: FileSystemDirectoryHandle, targetHandler: FileSystemDirectoryHandle, newName: string, copy: boolean = false, showWarning: boolean = false) => {
    if (handler.kind === 'directory') {
      // validate if the new name exists
      let exists: boolean = true
      try {
        await targetHandler.getDirectoryHandle(newName, { create: false })
        exists = true
      } catch (err) {
        exists = false
      }
      if (exists) {
        showWarning && dispatch(Main.setGlobalMessage({
          type: 'error',
          message: 'Folder with the same name already exists.',
        }))
        return
      }

      // move nested handler-dir to targetHandler with the newName - copy (optional)
      try {
        const newHandler = await targetHandler.getDirectoryHandle(newName, { create: true })
        const newDirHandlers: FileSystemDirectoryHandle[] = [newHandler]
        const dirHandlers: FileSystemDirectoryHandle[] = [handler as FileSystemDirectoryHandle]
        while (dirHandlers.length) {
          const dirHandler = dirHandlers.shift() as FileSystemDirectoryHandle
          const newDirHandler = newDirHandlers.shift() as FileSystemDirectoryHandle
          for await (const entry of dirHandler.values()) {
            if (entry.kind === 'directory') {
              const newDir = await newDirHandler.getDirectoryHandle(entry.name, { create: true })
              dirHandlers.push(entry)
              newDirHandlers.push(newDir)
            } else {
              const newFile = await newDirHandler.getFileHandle(entry.name, { create: true })
              const content = await (entry as FileSystemFileHandle).getFile()
              const writableStream = await newFile.createWritable()
              await writableStream.write(content)
              await writableStream.close()
            }
          }
        }

        // handle copy(optional)
        !copy && await parentHandler.removeEntry(handler.name, { recursive: true })
      } catch (err) {
        throw 'error'
      }
    } else {
      // validate if the new name exists
      let exists: boolean = true
      try {
        await targetHandler.getFileHandle(newName, { create: false })
        exists = true
      } catch (err) {
        exists = false
      }
      if (exists) {
        showWarning && dispatch(Main.setGlobalMessage({
          type: 'error',
          message: 'File with the same name already exists.',
        }))
        return
      }

      // create a new file with the new name and write the content
      try {
        const newFile = await targetHandler.getFileHandle(newName, { create: true })
        const content = await (handler as FileSystemFileHandle).getFile()
        const writableStream = await (newFile).createWritable()
        await writableStream.write(content)
        await writableStream.close()

        // handle copy(optional)
        !copy && await parentHandler.removeEntry(handler.name, { recursive: true })
      } catch (err) {
        throw 'error'
      }
    }
  }

  // rename folder/file call back
  const cb_renameFFNode = useCallback(async (uid: TUid, newName: string) => {
    // validate
    const node = workspace[uid]
    if (node === undefined || node.name === newName) return
    const parentNode = workspace[node.p_uid as TUid]
    if (parentNode === undefined) return

    // addRunningAction(['renameFFNode'])
    dispatch(Main.setGlobalPending(true))

    /* verify handler permission */
    const handler = ffHandlers[uid] as FileSystemHandle
    const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
    if (!(await verifyPermission(handler)) || !(await verifyPermission(parentHandler))) {
      dispatch(Main.setGlobalMessage({
        type: 'error',
        message: `Invalid directory/file. Check if you have "write" permission for the directory/file.`,
      }))

      dispatch(Main.setGlobalPending(false))
      // removeRunningAction(['renameFFNode'], false)
      return
    }

    // rename using moveFF api
    try {
      await moveFF(handler, parentHandler, parentHandler, newName, false, true)
    } catch (err) {
      dispatch(Main.setGlobalMessage({
        type: 'error',
        message: 'Error occurred while renaming ...',
      }))
    }

    dispatch(Main.setGlobalPending(false))
    // removeRunningAction(['renameFFNode'])
  }, [workspace, ffHandlers])

  // dnd fole/file call back - multiple
  const cb_dropFFNode = useCallback(async (uids: TUid[], targetUid: TUid) => {
    // validate
    let validatedUids: TUid[] = validateUids(uids, targetUid)
    if (validatedUids.length == 0 || workspace[targetUid] === undefined) return

    // addRunningAction(['dropFFNode'])
    dispatch(Main.setGlobalPending(true))

    /* verify target handler permission */
    const targetHandler = ffHandlers[targetUid] as FileSystemDirectoryHandle
    if (!verifyPermission(targetHandler)) {
      dispatch(Main.setGlobalMessage({
        type: 'error',
        message: `Invalid target directory. Check if you have "write" permission for the directory.`,
      }))

      dispatch(Main.setGlobalPending(false))
      // removeRunningAction(['dropFFNode'], false)
      return
    }

    let allDone = true
    for (const uid of validatedUids) {
      // validate
      const node = workspace[uid]
      if (node === undefined) {
        allDone = false
        continue
      }
      const parentNode = workspace[node.p_uid as TUid]
      if (parentNode === undefined) {
        allDone = false
        continue
      }

      // validate node handler
      const handler = ffHandlers[uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!(await verifyPermission(handler)) || !(await verifyPermission(parentHandler))) {
        allDone = false
        continue
      }

      // move using moveFF api
      try {
        await moveFF(handler, parentHandler, targetHandler, handler.name)
      } catch (err) {
        // error occurred
      }
    }
    if (!allDone) {/* toast error message */
      dispatch(Main.setGlobalMessage({
        type: 'warning',
        message: 'Some directory/file couldn\'t be moved.',
      }))
    }

    dispatch(Main.setGlobalPending(false))
    // removeRunningAction(['dropFFNode'])
  }, [workspace, ffHandlers])

  // duplicate directory/file api
  const duplicateFFNode = useCallback(async () => {
    // validate
    if (focusedItem === 'ROOT') return
    const node = workspace[focusedItem]
    if (node === undefined) return
    const parentNode = workspace[node.p_uid as TUid]
    if (parentNode === undefined) return

    // addRunningAction(['duplicateFFNode'])
    dispatch(Main.setGlobalPending(true))

    // verify handler permission
    const handler = ffHandlers[node.uid] as FileSystemHandle
    const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
    if (!(await verifyPermission(handler)) || !(await verifyPermission(parentHandler))) {
      dispatch(Main.setGlobalMessage({
        type: 'error',
        message: `Invalid directory/file. Check if you have "write" permission for the directory/file.`,
      }))

      dispatch(Main.setGlobalPending(false))
      // removeRunningAction(['duplicateFFNode'], false)
      return
    }

    // generate new name
    let newName = ''
    if (handler.kind === 'directory') {
      const ffName = `${handler.name} copy`
      let folderName: string = ffName
      let exists: boolean = true
      try {
        await parentHandler.getDirectoryHandle(ffName, { create: false })
        exists = true
      } catch (err) {
        exists = false
      }

      if (exists) {
        let index = 0
        while (exists) {
          const _folderName = `${ffName} (${++index})`
          try {
            await parentHandler.getDirectoryHandle(_folderName, { create: false })
            exists = true
          } catch (err) {
            folderName = _folderName
            exists = false
          }
        }
      }
      newName = folderName
    } else {
      let ext: string = getFileExtension(handler.name)
      let name: string = handler.name.slice(0, handler.name.length - ext.length)
      name = `${name} copy`
      const ffName = `${name}${ext}`

      let fileName: string = ffName
      let exists: boolean = true
      try {
        await parentHandler.getFileHandle(ffName, { create: false })
        exists = true
      } catch (err) {
        exists = false
      }

      if (exists) {
        let index = 0
        while (exists) {
          const _fileName = `${name} (${++index})${ext}`
          try {
            await parentHandler.getFileHandle(_fileName, { create: false })
            exists = true
          } catch (err) {
            fileName = _fileName
            exists = false
          }
        }
      }
      newName = fileName
    }

    // duplicate using moveFF api
    try {
      await moveFF(handler, parentHandler, parentHandler, newName, true)
    } catch (err) {
      dispatch(Main.setGlobalMessage({
        type: 'error',
        message: 'Error occurred while duplicating ...',
      }))
    }

    dispatch(Main.setGlobalPending(false))
    // removeRunningAction(['duplicateFFNode'])
  }, [focusedItem, workspace, ffHandlers])

  return (<>
    <div className="panel">
      <div className="border-bottom" style={{ height: "300px", overflow: "auto" }}>
        {/* Nav Bar */}
        <div className="sticky direction-column padding-s box-l justify-stretch border-bottom background-primary">
          <div className="gap-s box justify-start">
            {/* label */}
            <span className="text-s">Workspace</span>
          </div>
          <div className="gap-s justify-end box">
            {/* Create Folder Button */}
            <div className="icon-addelement opacity-m icon-xs" onClick={() => openCreateFFNodeModal('folder')}></div>

            {/* Create File Button */}
            <div className="icon-addelement opacity-m icon-xs" onClick={() => openCreateFFNodeModal('file')}></div>

            {/* Duplicate Button */}
            <div className="icon-copy opacity-m icon-xs" onClick={duplicateFFNode}></div>

            {/* Delete Node Button */}
            <div className="icon-delete opacity-m icon-xs" onClick={deleteFFNode}></div>

            {/* Import Project Button */}
            <div className="icon-import opacity-m icon-xs" onClick={() => onImportProject()}></div>
          </div>
        </div>

        {/* Main TreeView */}
        <TreeView
          /* style */
          width={'100%'}
          height={'auto'}

          /* info */
          info={{ id: 'file-tree-view' }}

          /* data */
          data={workspaceTreeViewData}
          focusedItem={focusedItem}
          expandedItems={expandedItems}
          selectedItems={selectedItems}

          /* renderers */
          renderers={{
            renderTreeContainer: (props) => {
              return <>
                <ul {...props.containerProps}>
                  {props.children}
                </ul>
              </>
            },
            renderItemsContainer: (props) => {
              return <>
                <ul {...props.containerProps}>
                  {props.children}
                </ul>
              </>
            },
            renderItem: (props) => {
              return <>
                <li
                  className={cx(
                    props.context.isSelected && '',
                    props.context.isDraggingOver && 'background-secondary',
                    props.context.isDraggingOverParent && '',
                    props.context.isFocused && '',
                  )}
                  {...props.context.itemContainerWithChildrenProps}
                >
                  {/* self */}
                  <div
                    className={cx(
                      'justify-stretch',
                      'padding-xs',
                      props.item.index === ffHoveredItem && 'background-secondary',
                      props.context.isSelected && 'background-secondary',
                      props.context.isDraggingOver && 'foreground-primary',
                      props.context.isDraggingOverParent && '',
                      props.context.isFocused && '',
                    )}
                    style={{
                      flexWrap: "nowrap",
                      paddingLeft: `${props.depth * 10}px`,
                      outline: props.context.isFocused ? "1px solid black" :
                        props.item.index === ffHoveredItem ? "1px dotted black" : "none",
                      outlineOffset: "-1px",
                    }}

                    {...props.context.itemContainerWithoutChildrenProps}
                    {...props.context.interactiveElementProps}
                    onClick={(e) => {
                      e.stopPropagation()

                      // check running action
                      if (!noRunningAction()) {
                        return
                      }
                      if (!props.context.isFocused) {
                        addRunningAction(['focusFFNode'])
                      }
                      if (e.shiftKey) {
                        addRunningAction(['selectFFNode'])
                      } else if (e.ctrlKey) {
                        addRunningAction(['selectFFNode'])
                      } else {
                        addRunningAction(['selectFFNode'])
                        if (props.item.isFolder) {
                          addRunningAction([props.context.isExpanded ? 'collapseFFNode' : 'expandFFNode'])
                        } else {
                          addRunningAction(['readFFNode'])
                        }
                      }

                      // call back
                      props.context.isFocused ? null : props.context.focusItem()
                      if (e.shiftKey) {
                        props.context.selectUpTo()
                      } else if (e.ctrlKey) {
                        props.context.isSelected ? props.context.unselectItem() : props.context.addToSelectedItems()
                      } else {
                        props.context.selectItem()
                        props.item.isFolder ? props.context.toggleExpandedState() : props.context.primaryAction()
                      }
                    }}
                    onFocus={() => { }}
                    onMouseEnter={() => setFFHoveredItem(props.item.index as TUid)}
                    onMouseLeave={() => setFFHoveredItem('')}
                  >
                    <div className="gap-xs padding-xs" style={{ width: "100%" }}>
                      {/* render arrow */}
                      {props.arrow}

                      {/* render icon */}
                      <div
                        className={cx(
                          'icon-xs',
                          props.item.isFolder ? (props.context.isExpanded ? 'icon-folder' : 'icon-folder') :
                            'icon-pages'
                        )}
                      >
                      </div>

                      {/* render title */}
                      {props.title}
                    </div>
                  </div>

                  {/* render children */}
                  {props.context.isExpanded ? <>
                    <div>
                      {props.children} {/* this calls the renderItemsContainer again */}
                    </div>
                  </> : null}
                </li>
              </>
            },
            renderItemArrow: (props) => {
              return <>
                <div
                  className={cx(
                    'icon-xs',
                    props.item.isFolder ? (props.context.isExpanded ? 'icon-down' : 'icon-right') : '',
                  )}
                >
                </div>
              </>
            },
            renderItemTitle: (props) => {
              return <>
                <span className='text-s' style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "calc(100% - 32px)" }}>
                  {props.title}
                </span>
              </>
            },
          }}

          /* possibilities */
          props={{
            canDragAndDrop: true,
            canDropOnFolder: true,
            canDropOnNonFolder: false,
          }}

          /* cb */
          callbacks={{
            /* RENAME CALLBACK */
            onRenameItem: (item, name, treeId) => {
              cb_renameFFNode(item.index as TUid, name)
            },

            /* SELECT, FOCUS, EXPAND, COLLAPSE CALLBACK */
            onSelectItems: (items, treeId) => {
              cb_selectFFNode(items as TUid[])
            },
            onFocusItem: (item, treeId) => {
              cb_focusFFNode(item.index as TUid)
            },
            onExpandItem: (item, treeId) => {
              cb_expandFFNode(item.index as TUid)
            },
            onCollapseItem: (item, treeId) => {
              cb_collapseFFNode(item.index as TUid)
            },

            /* READ CALLBACK */
            onPrimaryAction: (item, treeId) => {
              cb_readFFNode(item.index as TUid)
            },

            // DnD CALLBACK
            onDrop: (items, target) => {
              const uids: TUid[] = items.map(item => item.index as TUid)
              const targetUid: TUid = (target as DraggingPositionItem).targetItem as TUid
              cb_dropFFNode(uids, targetUid)
            }
          }}
        />
      </div>
    </div>

    {/* ff name input modal */}
    <Dialog
      open={createFFModalOpen}
      onClose={() => { setCreateFFModalOpen(false) }}
    >
      <div className='background-primary'>
        <h5>Create a {creatingFFType}</h5>
        <p className='text-m'>Enter the folder or file name you want</p>
        <input
          className=''
          value={newFFName}
          onChange={(e) => {
            setNewFFName(e.target.value)
          }}
        ></input>
        <button className='background-secondary text-m' onClick={createFFNode}>Ok</button>
      </div>
    </Dialog>
  </>)
}