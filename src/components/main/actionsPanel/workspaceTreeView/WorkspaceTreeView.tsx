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
  getEntryName,
  getParentUid,
  sortNodesByAsc,
  validateUids,
} from '@_node/apis';
import { parseHtml } from '@_node/html';
import {
  TFileType,
  TUid,
  validFileType,
} from '@_node/types';
import {
  clearFNState,
  clearMainState,
  collapseFFNode,
  expandFFNode,
  FFAction,
  ffSelector,
  focusFFNode,
  globalSelector,
  MainContext,
  OpenedFile,
  selectFFNode,
  setCurrentFile,
  setFFAction,
  updateFFTreeViewState,
} from '@_redux/main';
import {
  getFileExtension,
  verifyPermission,
} from '@_services/main';
import {
  FFNode,
  FFNodeType,
  FFTree,
  ProjectLocation,
} from '@_types/main';

import { WorkspaceTreeViewProps } from './types';

export default function WorkspaceTreeView(props: WorkspaceTreeViewProps) {
  const dispatch = useDispatch()

  // main context
  const {
    addRunningActions, removeRunningActions,
    ffHoveredItem, setFFHoveredItem, ffHandlers, ffTree, setFFTree, updateFF,
    fnHoveredItem, setFNHoveredItem, nodeTree, setNodeTree, validNodeTree, setValidNodeTree,
    updateOpt, setUpdateOpt,
    isHms, setIsHms, ffAction,
    command, setCommand,
    pending, setPending, messages, addMessage, removeMessage,
  } = useContext(MainContext)

  // redux state
  const { project, currentFile, action } = useSelector(globalSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(ffSelector)

  // ---------------- folder/file hms ----------------
  // handler
  const isRedo = useRef<boolean>(false)
  useEffect(() => {
    if (isHms === null) return

    /**
     * undo if isHms = true
     * redo if isHms = false
     */
    if (isHms === true) {
      const { name, param1, param2 } = ffAction
      if (name === 'create') {
        _delete([param1])
      } else if (name === 'rename') {
        const { uid, p_uid } = param1
        const { orgName, newName } = param2
        _rename(generateNodeUid(p_uid, newName), orgName)
      } else if (name === 'move') {
        const uids: TUid[] = []
        const targetUids: TUid[] = []
        param1.map((uid: TUid) => {
          const entryName: string = getEntryName(uid)
          const parentUid: TUid = getParentUid(uid)
          uids.push(generateNodeUid(param2, entryName))
          targetUids.push(parentUid)
        })
        _move(uids, targetUids)
      } else if (name === 'duplicate') {

      } else if (name === 'delete') {

      }
    } else {
      isRedo.current = !isRedo.current
      if (isRedo.current === true) return

      const { name, param1, param2 } = action
      if (name === 'create') {
        _create(param1, param2)
      } else if (name === 'rename') {
        const { uid, p_uid } = param1
        const { orgName, newName } = param2
        _rename(uid, newName)
      } else if (name === 'move') {
        _move(param1, param2)
      } else if (name === 'duplicate') {

      } else if (name === 'delete') {

      }
    }

    setIsHms(null)
  }, [isHms, action])

  // folder/file node-action apis
  const _create = useCallback(async (uid: TUid, type: FFNodeType) => {
    addRunningActions(['fileTreeView-create'])

    try {
      // validate parentNode
      const parentUid = getParentUid(uid)
      const parentNode = ffTree[parentUid]
      if (parentNode === undefined) throw 'error'

      // verify handler permission
      const parentHandler = ffHandlers[parentUid] as FileSystemDirectoryHandle
      if (!(await verifyPermission(parentHandler))) throw 'error'

      // create
      const entryName = getEntryName(uid)
      if (type === 'file') {
        await parentHandler.getFileHandle(entryName, { create: true })
      } else { // folder
        await parentHandler.getDirectoryHandle(entryName, { create: true })
      }
    } catch (err) {
    }

    removeRunningActions(['fileTreeView-create'], false)
  }, [ffTree, ffHandlers])
  const _delete = useCallback(async (uids: TUid[]) => {
    addRunningActions(['fileTreeView_delete'])

    for (const uid of uids) {
      // validate node and parentNode
      const node: FFNode = ffTree[uid]
      if (node === undefined) continue
      const parentNode: FFNode = ffTree[node.p_uid as TUid]
      if (parentNode === undefined) continue

      // verify handler permission
      const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!(await verifyPermission(parentHandler))) continue

      // remove the entry
      try {
        await parentHandler.removeEntry(node.name, { recursive: true })
      } catch (err) {
      }
    }

    removeRunningActions(['fileTreeView_delete'], false)
  }, [ffTree, ffHandlers])
  const _rename = useCallback(async (uid: TUid, newName: string) => {
    addRunningActions(['fileTreeView-rename'])

    try {
      // validate
      const node = ffTree[uid]
      if (node === undefined || node.name === newName) throw 'error'
      const parentNode = ffTree[node.p_uid as TUid]
      if (parentNode === undefined) throw 'error'

      /* verify handler permission */
      const handler = ffHandlers[uid] as FileSystemHandle, parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!(await verifyPermission(handler)) || !(await verifyPermission(parentHandler))) throw 'error'

      // rename using moveFF api
      await moveFF(handler, parentHandler, parentHandler, newName)
    } catch (err) {

    }

    removeRunningActions(['fileTreeView-rename'], false)
  }, [ffTree, ffHandlers])
  const _duplicate = useCallback(async (uids: TUid[], targetUids: TUid[]) => {
    addRunningActions(['fileTreeView-duplicate'])

    for (let index = 0; index < uids.length; ++index) {
      const uid = uids[index]
      const targetUid = targetUids[index]

      // validate
      const node = ffTree[uid]
      if (node === undefined) continue
      const parentNode = ffTree[node.p_uid as TUid]
      if (parentNode === undefined) continue
      if (ffTree[targetUid] === undefined) continue

      // validate ff handlers
      const handler = ffHandlers[uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle, targetHandler = ffHandlers[targetUid] as FileSystemDirectoryHandle
      if (!(await verifyPermission(handler)) || !(await verifyPermission(parentHandler)) || !(await verifyPermission(targetHandler))) continue

      // move using moveFF api
      try {
        await moveFF(handler, parentHandler, targetHandler, handler.name, true)
      } catch (err) {

      }
    }

    removeRunningActions(['fileTreeView-duplicate'], false)
  }, [ffTree, ffHandlers])
  const _move = useCallback(async (uids: TUid[], targetUids: TUid[]) => {
    addRunningActions(['fileTreeView-move'])

    for (let index = 0; index < uids.length; ++index) {
      const uid = uids[index]
      const targetUid = targetUids[index]

      // validate
      const node = ffTree[uid]
      if (node === undefined) continue
      const parentNode = ffTree[node.p_uid as TUid]
      if (parentNode === undefined) continue
      if (ffTree[targetUid] === undefined) continue

      // validate ff handlers
      const handler = ffHandlers[uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle, targetHandler = ffHandlers[targetUid] as FileSystemDirectoryHandle
      if (!(await verifyPermission(handler)) || !(await verifyPermission(parentHandler)) || !(await verifyPermission(targetHandler))) continue

      // move using moveFF api
      try {
        await moveFF(handler, parentHandler, targetHandler, handler.name)
      } catch (err) {

      }
    }

    removeRunningActions(['fileTreeView-move'], false)
  }, [ffTree, ffHandlers])
  // ---------------- folder/file hms ----------------

  // import project from localhost using filesystemdirectoryhandle
  const importLocalhostProject = useCallback(async (projectHandle: FileSystemDirectoryHandle) => {
    // verify handler permission
    if (!(await verifyPermission(projectHandle))) {
      addMessage({
        type: 'error',
        message: 'Project folder is not valid. Please import valid project.',
      })
      throw 'error'
    }

    const deletedUids: { [uid: TUid]: boolean } = {}
    const nodes: FFTree = {}
    const handlers: { [uid: TUid]: FileSystemHandle } = { 'ROOT': projectHandle }

    // import all of the sub nodes
    const dirHandlers: { node: FFNode, handler: FileSystemDirectoryHandle }[] = [{
      node: {
        uid: 'ROOT',
        p_uid: null,
        name: projectHandle.name,
        isEntity: false,
        children: ffTree['ROOT'] ? ffTree['ROOT'].children : [],
        data: {},
      },
      handler: projectHandle,
    }]
    while (dirHandlers.length) {
      const { node: dirNode, handler: dirHandler } = dirHandlers.shift() as { node: FFNode, handler: FileSystemDirectoryHandle }

      const childrenObj: { [uid: TUid]: boolean } = {}
      dirNode.children.map((c_uid) => {
        childrenObj[c_uid] = true
      })

      const _subNodes: FFNode[] = []
      const childrenExists: { [uid: TUid]: boolean } = {}
      try {
        for await (const entry of dirHandler.values()) {
          const childNodeUid = generateNodeUid(dirNode.uid, entry.name)
          childrenExists[childNodeUid] = true
          const entryExists = (childrenObj[childNodeUid] === true)
          const childNodeChildren = entryExists ? ffTree[childNodeUid].children : []
          handlers[childNodeUid] = entry

          const _subNode: FFNode = {
            uid: childNodeUid,
            p_uid: dirNode.uid,
            name: entry.name,
            isEntity: entry.kind !== "directory",
            children: childNodeChildren,
            data: {},
          }
          _subNodes.push(_subNode)
          expandedItemsObj[childNodeUid] === true && dirHandlers.push({ node: _subNode, handler: entry as FileSystemDirectoryHandle })
        }
      } catch (err) {
        addMessage({
          type: 'error',
          message: 'Error occurred during importing project.',
        })
        throw 'error'
      }

      // sort the sub nodes by folder/file asc
      const subNodes = sortNodesByAsc(_subNodes)

      // update dirNode and push to total nodes
      dirNode.children.map((c_uid) => {
        if (childrenExists[c_uid] === undefined) {
          deletedUids[c_uid] = true
        }
      })
      dirNode.children = []
      subNodes.map((subNode) => {
        nodes[subNode.uid] = subNode
        dirNode.children.push(subNode.uid)
      })
      nodes[dirNode.uid] = dirNode
    }

    // update the state
    updateFF(deletedUids, nodes, handlers)
    dispatch(updateFFTreeViewState({ deletedUids: Object.keys(deletedUids) }))
  }, [ffTree, expandedItemsObj])

  // open project button handler
  const onImportProject = useCallback(async (location: ProjectLocation = 'localhost') => {
    if (location === 'localhost') {
      setPending(true)

      // open directory picker and get the project folde handle
      let projectHandle: FileSystemHandle
      try {
        projectHandle = await showDirectoryPicker({ _preferPolyfill: false, mode: 'readwrite' } as CustomDirectoryPickerOptions)
      } catch (err) {
        addMessage({
          type: 'info',
          message: 'You canceled importing project.',
        })

        setPending(false)
        return
      }

      dispatch(clearMainState())
      dispatch({ type: 'main/clearHistory' })

      /* import localhost porject */
      try {
        await importLocalhostProject(projectHandle as FileSystemDirectoryHandle)
      } catch (err) {
        // err occurred
      }

      setPending(false)
    }
  }, [importLocalhostProject])

  // watch file system
  const watchFileSystem = useCallback(async () => {
    if (project.location === 'localhost') {
      if (ffHandlers['ROOT'] === undefined || ffTree['ROOT'] === undefined) {
        // do nothing
      } else {
        try {
          await importLocalhostProject(ffHandlers['ROOT'] as FileSystemDirectoryHandle)
        } catch (err) {
          setPending(true)
        }
      }
    } else {

    }
  }, [project, ffHandlers, importLocalhostProject])

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

  // generate TreeViewData from workspace
  const fileTreeViewData = useMemo(() => {
    let data: TreeViewData = {}
    for (const uid in ffTree) {
      const node: FFNode = ffTree[uid]
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
  }, [ffTree])

  // cb
  const cb_focusFFNode = useCallback((uid: TUid) => {
    // for key-nav
    addRunningActions(['fileTreeView-focus'])

    // validate
    if (focusedItem === uid || ffTree[uid] === undefined) {
      removeRunningActions(['fileTreeView-focus'], false)
      return
    }

    dispatch(focusFFNode(uid))

    removeRunningActions(['fileTreeView-focus'])
  }, [focusedItem, ffTree])
  const cb_selectFFNode = useCallback((uids: TUid[]) => {
    // for key-nav
    addRunningActions(['fileTreeView-select'])

    // validate
    let _uids = [...uids]
    _uids = validateUids(_uids)
    _uids = _uids.filter((_uid) => {
      return !(ffTree[_uid] === undefined)
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
        removeRunningActions(['fileTreeView-select'], false)
        return
      }
    }

    dispatch(selectFFNode(_uids))

    removeRunningActions(['fileTreeView-select'])
  }, [ffTree, selectedItems, selectedItemsObj])
  const cb_expandFFNode = useCallback(async (uid: TUid) => {
    // for key-nav
    addRunningActions(['fileTreeView-expand'])

    // validate
    const node = ffTree[uid]
    if (node === undefined || node.isEntity || expandedItemsObj[uid] === true) {
      removeRunningActions(['fileTreeView-expand'], false)
      return
    }

    dispatch(expandFFNode([uid]))

    removeRunningActions(['fileTreeView-expand'])
  }, [ffTree, expandedItemsObj])
  const cb_collapseFFNode = useCallback((uid: TUid) => {
    // for key-nav
    addRunningActions(['fileTreeView-collapse'])

    // validate
    const node = ffTree[uid]
    if (node === undefined || node.isEntity || expandedItemsObj[uid] === undefined) {
      removeRunningActions(['fileTreeView-collapse'], false)
      return
    }

    dispatch(collapseFFNode([uid]))
    removeRunningActions(['fileTreeView-collapse'])
  }, [ffTree, expandedItemsObj])

  // create directory/file dialog handle
  const [createFFModalOpen, setCreateFFModalOpen] = useState<boolean>(false)
  const [creatingFFType, setCreatingFFType] = useState<FFNodeType>()
  const [newFFName, setNewFFName] = useState<string>('')
  const openCreateFFNodeModal = useCallback((ffNodeType: FFNodeType) => {
    // validate
    const node = ffTree[focusedItem]
    if (node === undefined || node.isEntity) return

    setCreatingFFType(ffNodeType)
    setNewFFName('')
    setCreateFFModalOpen(true)
  }, [ffTree, focusedItem])

  // create folder/file api
  const createFFNode = useCallback(async () => {
    // close name input modal
    setCreateFFModalOpen(false)

    addRunningActions(['fileTreeView-create'])

    // verify handler permission
    const focusedItemHandler = ffHandlers[focusedItem] as FileSystemDirectoryHandle
    if (!(await verifyPermission(focusedItemHandler))) {
      addMessage({
        type: 'error',
        message: `Invalid target directory. Check if you have "write" permission for the directory.`,
      })
      removeRunningActions(['fileTreeView-create'], false)
      return
    }

    // new name
    let newName: string = ''

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

      newName = folderName

      // create the directory with generated name
      try {
        await focusedItemHandler.getDirectoryHandle(folderName, { create: true })
      } catch (err) {
        addMessage({
          type: 'error',
          message: 'Error occurred while creating a new folder.',
        })
        removeRunningActions(['fileTreeView-create'], false)
        return
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

      newName = fileName

      // create the file with generated name
      try {
        await focusedItemHandler.getFileHandle(fileName, { create: true })
      } catch (err) {
        addMessage({
          type: 'error',
          message: 'Error occurred while creating a new file.',
        })
        removeRunningActions(['fileTreeView-create'], false)
        return
      }
    }

    const action: FFAction = {
      name: 'create',
      param1: `${focusedItem}_${newName}`,
      param2: creatingFFType,
    }
    dispatch(setFFAction(action))

    removeRunningActions(['fileTreeView-create'])
  }, [ffHandlers, focusedItem, creatingFFType, newFFName])

  // delete folder/file api
  const deleteFFNode = useCallback(async () => {
    // validate selected uids
    const uids = selectedItems
    if (uids.length === 0) return

    addRunningActions(['fileTreeView-delete'])

    let allDone = true
    for (const uid of uids) {
      // validate node and parentNode
      const node: FFNode = ffTree[uid]
      if (node === undefined) {
        allDone = false
        continue
      }
      const parentNode: FFNode = ffTree[node.p_uid as TUid]
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
      addMessage({
        type: 'warning',
        message: 'Some directory/file couldn\'t be deleted.',
      })
    }

    removeRunningActions(['fileTreeView-delete'], false)
  }, [selectedItems, ffTree, ffHandlers])

  // read file content call back
  const cb_readFFNode = useCallback(async (uid: TUid) => {
    // for key-nav
    addRunningActions(['fileTreeView-read'])

    // validate
    const node = ffTree[uid]
    if (node === undefined || !node.isEntity) {
      removeRunningActions(['fileTreeView-read'], false)
      return
    }

    // verify handler permission
    const handler = ffHandlers[uid] as FileSystemFileHandle
    if (!(await verifyPermission(handler))) {
      addMessage({
        type: 'error',
        message: 'Invalid file. Check if you have "read" permission for the file.',
      })
      removeRunningActions(['fileTreeView-read'], false)
      return
    }

    // get file type (extension)
    let fileType = getFileExtension(handler.name)
    if (fileType !== '') fileType = fileType.slice(1)
    fileType = validFileType[fileType] === true ? fileType : 'unknown'

    // read the file content and set to global state
    try {
      const fileEntry = await handler.getFile()
      const content = await fileEntry.text()
      const file: OpenedFile = {
        uid,
        name: handler.name,
        type: fileType as TFileType,
        content: content,
        saved: true,
      }

      // initial format code
      if (fileType === 'html') {
        const { content: formattedContent, tree } = parseHtml(content)
        if (content !== formattedContent) {
          file.content = formattedContent
          file.saved = false
        }
        setUpdateOpt({ parse: null, from: 'fs' })

        addRunningActions(['processor-validNodeTree'])
        setNodeTree(tree)
      }

      dispatch(clearFNState())

      setTimeout(() => dispatch(setCurrentFile(file)), 0)
    } catch (err) {
      addMessage({
        type: 'error',
        message: 'Error occurred while reading the file content.',
      })
    }

    removeRunningActions(['fileTreeView-read'])
  }, [ffTree, ffHandlers])

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
        showWarning && addMessage({
          type: 'error',
          message: 'Folder with the same name already exists.',
        })
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
        showWarning && addMessage({
          type: 'error',
          message: 'File with the same name already exists.',
        })
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
    const node = ffTree[uid]
    if (node === undefined || node.name === newName) return
    const parentNode = ffTree[node.p_uid as TUid]
    if (parentNode === undefined) return

    addRunningActions(['fileTreeView-rename'])

    /* verify handler permission */
    const handler = ffHandlers[uid] as FileSystemHandle
    const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
    if (!(await verifyPermission(handler)) || !(await verifyPermission(parentHandler))) {
      addMessage({
        type: 'error',
        message: `Invalid directory/file. Check if you have "write" permission for the directory/file.`,
      })
      removeRunningActions(['fileTreeView-rename'], false)
      return
    }

    // rename using moveFF api
    try {
      await moveFF(handler, parentHandler, parentHandler, newName, false, true)
    } catch (err) {
      addMessage({
        type: 'error',
        message: 'Error occurred while renaming ...',
      })
      removeRunningActions(['fileTreeView-rename'], false)
      return
    }

    const action: FFAction = {
      name: 'rename',
      param1: { uid, p_uid: parentNode.uid },
      param2: { orgName: node.name, newName },
    }
    dispatch(setFFAction(action))

    removeRunningActions(['fileTreeView-rename'])
  }, [ffTree, ffHandlers])

  // dnd fole/file call back - multiple
  const cb_dropFFNode = useCallback(async (uids: TUid[], targetUid: TUid) => {
    // validate
    if (ffTree[targetUid] === undefined) return
    let validatedUids: TUid[] = validateUids(uids, targetUid)
    if (validatedUids.length == 0) return

    addRunningActions(['fileTreeView-move'])

    /* verify target handler permission */
    const targetHandler = ffHandlers[targetUid] as FileSystemDirectoryHandle
    if (!(await verifyPermission(targetHandler))) {
      addMessage({
        type: 'error',
        message: `Invalid target directory. Check if you have "write" permission for the directory.`,
      })
      removeRunningActions(['fileTreeView-move'], false)
      return
    }

    let allDone = true
    const _uids: TUid[] = []
    for (const uid of validatedUids) {
      // validate
      const node = ffTree[uid]
      if (node === undefined) {
        allDone = false
        continue
      }
      const parentNode = ffTree[node.p_uid as TUid]
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
        _uids.push(uid)
      } catch (err) {
        // error occurred
      }
    }
    if (!allDone) {/* toast error message */
      addMessage({
        type: 'warning',
        message: 'Some directory/file couldn\'t be moved.',
      })
    }

    const action: FFAction = {
      name: 'move',
      param1: _uids,
      param2: _uids.map(() => targetUid),
    }
    dispatch(setFFAction(action))

    removeRunningActions(['fileTreeView-move'])
  }, [ffTree, ffHandlers])

  // duplicate directory/file api
  const duplicateFFNode = useCallback(async () => {
    // validate
    if (focusedItem === 'ROOT') return
    const node = ffTree[focusedItem]
    if (node === undefined) return
    const parentNode = ffTree[node.p_uid as TUid]
    if (parentNode === undefined) return

    addRunningActions(['fileTreeView-duplicate'])

    // verify handler permission
    const handler = ffHandlers[node.uid] as FileSystemHandle
    const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
    if (!(await verifyPermission(handler)) || !(await verifyPermission(parentHandler))) {
      addMessage({
        type: 'error',
        message: `Invalid directory/file. Check if you have "write" permission for the directory/file.`,
      })
      removeRunningActions(['fileTreeView-duplicate'], false)
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
      addMessage({
        type: 'error',
        message: 'Error occurred while duplicating ...',
      })
      removeRunningActions(['fileTreeView-duplicate'], false)
      return
    }

    const action: FFAction = {
      name: 'duplicate',
      param1: focusedItem,
      param2: newName,
    }
    dispatch(setFFAction(action))

    removeRunningActions(['fileTreeView-duplicate'])
  }, [selectedItems, ffTree, ffHandlers])

  // command detect & do actions
  useEffect(() => {
    if (command.action === '') return

    switch (command.action) {
      case 'OpenProject':
        onImportProject()
        break
    }
  }, [command.changed])

  return <>
    <div className="panel">
      <div className="border-bottom" style={{ height: "calc(50vh - 22px)", overflow: "auto" }}>
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
          data={fileTreeViewData}
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
                      // if (!noRunningAction()) return

                      addRunningActions(['fileTreeView-select'])
                      !props.context.isFocused && addRunningActions(['fileTreeView-focus'])
                      !e.shiftKey && !e.ctrlKey && addRunningActions(props.item.isFolder ? [props.context.isExpanded ? 'fileTreeView-collapse' : 'fileTreeView-expand'] : ['fileTreeView-read'])

                      // call back
                      !props.context.isFocused && props.context.focusItem()
                      e.shiftKey ? props.context.selectUpTo() :
                        e.ctrlKey ? (props.context.isSelected ? props.context.unselectItem() : props.context.addToSelectedItems()) : [
                          props.context.selectItem(),
                          props.item.isFolder ? props.context.toggleExpandedState() : props.context.primaryAction(),
                        ]
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
  </>
}
