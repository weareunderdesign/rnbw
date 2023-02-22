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
  SVGIconI,
  SVGIconII,
  SVGIconIII,
  TreeView,
} from '@_components/common';
import { TreeViewData } from '@_components/common/treeView/types';
import {
  HmsClearActionType,
  LogAllow,
  NodeUidSplitter,
  ParsableFileTypes,
  RootNodeUid,
} from '@_constants/main';
import {
  generateNodeUid,
  getNodeEntryName,
  getParentNodeUid,
  sortNodesByContext,
  validateNodeUidCollection,
} from '@_node/apis';
import { parseHtml } from '@_node/html';
import {
  TNode,
  TNodeTreeData,
  TNodeUid,
  TNormalNodeData,
} from '@_node/types';
import {
  clearFNState,
  clearMainState,
  collapseFFNode,
  expandFFNode,
  ffSelector,
  focusFFNode,
  getActionGroupIndexSelector,
  globalSelector,
  hmsInfoSelector,
  MainContext,
  navigatorSelector,
  selectFFNode,
  setCurrentFile,
  setFileAction,
  updateFFTreeViewState,
} from '@_redux/main';
import { getFileExtension } from '@_services/global';
import {
  getFileSystemWatchInterval,
  verifyFileHandlerPermission,
} from '@_services/main';
import {
  TFile,
  TFileAction,
  TFileNodeType,
  TFileSystemType,
  TFileType,
} from '@_types/main';

import { WorkspaceTreeViewProps } from './types';

export default function WorkspaceTreeView(props: WorkspaceTreeViewProps) {
  const dispatch = useDispatch()

  // main context
  const {
    // groupping action
    addRunningActions, removeRunningActions,

    // file tree view
    ffHoveredItem, setFFHoveredItem, ffHandlers, ffTree, setFFTree, updateFF,

    // ndoe tree view
    fnHoveredItem, setFNHoveredItem, nodeTree, setNodeTree, validNodeTree, setValidNodeTree,

    // update opt
    updateOpt, setUpdateOpt,

    // ff hms
    isHms, setIsHms, ffAction, setFFAction,

    // cmdk
    currentCommand, setCurrentCommand, cmdkOpen, setCmdkOpen, cmdkPages, setCmdkPages, cmdkPage,

    // global
    pending, setPending, messages, addMessage, removeMessage,

    // reference
    htmlReferenceData, cmdkReferenceData, cmdkReferenceJumpstart, cmdkReferenceActions, cmdkReferenceAdd,

    // active panel/clipboard
    activePanel, setActivePanel, clipboardData, setClipboardData,

    // os
    osType,

    // code view
    tabSize, setTabSize,
  } = useContext(MainContext)

  // redux state
  const actionGroupIndex = useSelector(getActionGroupIndexSelector)
  const { workspace, project, file, changedFiles } = useSelector(navigatorSelector)
  const { fileAction } = useSelector(globalSelector)
  const { futureLength, pastLength } = useSelector(hmsInfoSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(ffSelector)
  // const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(fnSelector)

  // -------------------------------------------------------------- folder/file hms --------------------------------------------------------------
  // handler
  const isRedo = useRef<boolean>(false)
  useEffect(() => {
    if (isHms === null) return

    /**
     * undo if isHms = true
     * redo if isHms = false
     */
    if (isHms === true) {
      // console.log('UNDO', ffAction)

      const { type, param1, param2 } = ffAction
      if (type === 'create') {
        _delete([param1])
      } else if (type === 'rename') {
        const { uid, parentUid } = param1
        const { orgName, newName } = param2
        _rename(generateNodeUid(parentUid, newName), orgName)
      } else if (type === 'cut') {
        const _uids: { uid: TNodeUid, name: string }[] = param1
        const _targetUids: TNodeUid[] = param2
        const uids: TNodeUid[] = []
        const targetUids: TNodeUid[] = []
        for (let index = 0; index < _targetUids.length; ++index) {
          const { uid, name } = _uids[index]
          const targetUid = _targetUids[index]
          uids.push(generateNodeUid(targetUid, name))
          targetUids.push(getParentNodeUid(uid))
        }
        _cut(uids, targetUids)
      } else if (type === 'copy') {
        const _uids: { uid: TNodeUid, name: string }[] = param1
        const _targetUids: TNodeUid[] = param2
        const uids: TNodeUid[] = []
        for (let index = 0; index < _targetUids.length; ++index) {
          const { uid, name } = _uids[index]
          const targetUid = _targetUids[index]
          uids.push(generateNodeUid(targetUid, name))
        }
        _delete(uids)
      } else if (type === 'delete') {
        // skip - do nothing
      }
    } else {
      // wait until dispatch is done
      isRedo.current = !isRedo.current
      if (isRedo.current === true) return

      // console.log('REDO', action)

      const { type, param1, param2 } = fileAction
      if (type === 'create') {
        _create(param1, param2)
      } else if (type === 'rename') {
        const { uid, parentUid } = param1
        const { orgName, newName } = param2
        _rename(uid, newName)
      } else if (type === 'cut') {
        const _uids: { uid: TNodeUid, name: string }[] = param1
        const targetUids: TNodeUid[] = param2
        const uids: TNodeUid[] = []
        _uids.map((_uid: { uid: TNodeUid, name: string }) => {
          uids.push(_uid.uid)
        })
        _cut(uids, targetUids)
      } else if (type === 'copy') {
        const _uids: { uid: TNodeUid, name: string }[] = param1
        const targetUids: TNodeUid[] = param2
        const uids: TNodeUid[] = []
        const names: string[] = []
        _uids.map((_uid: { uid: TNodeUid, name: string }) => {
          uids.push(_uid.uid)
          names.push(_uid.name)
        })
        _copy(uids, names, targetUids)
      } else if (type === 'delete') {
        // skip - do nothing
      }
    }

    setIsHms(null)
  }, [isHms, fileAction])

  // hms folder/file node-action apis
  const _create = useCallback(async (uid: TNodeUid, type: TFileNodeType) => {
    addRunningActions(['fileTreeView-create'])

    try {
      // validate parentNode
      const parentUid = getParentNodeUid(uid)
      const parentNode = ffTree[parentUid]
      if (parentNode === undefined) throw 'error'

      // verify handler permission
      const parentHandler = ffHandlers[parentUid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(parentHandler))) throw 'error'

      // create
      const entryName = getNodeEntryName(uid)
      if (type === 'folder') {
        await parentHandler.getDirectoryHandle(entryName, { create: true })
      } else { // file
        await parentHandler.getFileHandle(entryName, { create: true })
      }
    } catch (err) {
    }

    removeRunningActions(['fileTreeView-create'], false)
  }, [ffTree, ffHandlers])
  const _delete = useCallback(async (uids: TNodeUid[]) => {
    addRunningActions(['fileTreeView_delete'])

    for (const uid of uids) {
      // validate node and parentNode
      const node: TNode = ffTree[uid]
      if (node === undefined) continue
      const parentNode: TNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) continue

      // verify handler permission
      const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(parentHandler))) continue

      // remove the entry
      try {
        const ffType = (node.data as TNormalNodeData).type
        const ffName = ffType === 'folder' ? node.name : node.name + '.' + ffType
        await parentHandler.removeEntry(ffName, { recursive: true })
      } catch (err) {
      }
    }

    removeRunningActions(['fileTreeView_delete'], false)
  }, [ffTree, ffHandlers])
  const _rename = useCallback(async (uid: TNodeUid, newName: string) => {
    addRunningActions(['fileTreeView-rename'])

    try {
      // validate
      const node = ffTree[uid]
      if (node === undefined || node.name === newName) throw 'error'
      const parentNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) throw 'error'

      /* verify handler permission */
      const handler = ffHandlers[uid] as FileSystemHandle, parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler))) throw 'error'

      // rename using moveFF api
      await moveFF(handler, parentHandler, parentHandler, newName)
    } catch (err) {

    }

    removeRunningActions(['fileTreeView-rename'], false)
  }, [ffTree, ffHandlers])
  const _cut = useCallback(async (uids: TNodeUid[], targetUids: TNodeUid[]) => {
    addRunningActions(['fileTreeView-move'])

    for (let index = 0; index < uids.length; ++index) {
      const uid = uids[index]
      const targetUid = targetUids[index]

      // validate
      const node = ffTree[uid]
      if (node === undefined) continue
      const parentNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) continue
      if (ffTree[targetUid] === undefined) continue

      // validate ff handlers
      const handler = ffHandlers[uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle, targetHandler = ffHandlers[targetUid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler)) || !(await verifyFileHandlerPermission(targetHandler))) continue

      // move using moveFF api
      try {
        await moveFF(handler, parentHandler, targetHandler, handler.name)
      } catch (err) {

      }
    }

    removeRunningActions(['fileTreeView-move'], false)
  }, [ffTree, ffHandlers])
  const _copy = useCallback(async (uids: TNodeUid[], names: string[], targetUids: TNodeUid[]) => {
    addRunningActions(['fileTreeView-duplicate'])

    for (let index = 0; index < uids.length; ++index) {
      const uid = uids[index]
      const name = names[index]
      const targetUid = targetUids[index]

      // validate
      const node = ffTree[uid]
      if (node === undefined) continue
      const parentNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) continue
      if (ffTree[targetUid] === undefined) continue

      // validate ff handlers
      const handler = ffHandlers[uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle, targetHandler = ffHandlers[targetUid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler)) || !(await verifyFileHandlerPermission(targetHandler))) continue

      // move using moveFF api
      try {
        await moveFF(handler, parentHandler, targetHandler, name, true)
      } catch (err) {

      }
    }

    removeRunningActions(['fileTreeView-duplicate'], false)
  }, [ffTree, ffHandlers])
  // -------------------------------------------------------------- folder/file hms --------------------------------------------------------------

  const [temporary, setTemporary] = useState<boolean>(false)

  // -------------------------------------------------------------- Sync --------------------------------------------------------------
  // import project from localhost using filesystemdirectoryhandle
  const importLocalhostProject = useCallback(async (projectHandle: FileSystemDirectoryHandle) => {
    // verify handler permission
    if (!(await verifyFileHandlerPermission(projectHandle))) {
      addMessage({
        type: 'error',
        content: 'Project folder is not valid. Please import valid project.',
      })
      throw 'error'
    }

    const deletedUids: { [uid: TNodeUid]: boolean } = {}
    const nodes: TNodeTreeData = {}
    const handlers: { [uid: TNodeUid]: FileSystemHandle } = { [RootNodeUid]: projectHandle }

    // import all of the sub nodes
    const dirHandlers: { node: TNode, handler: FileSystemDirectoryHandle }[] = [{
      node: {
        uid: RootNodeUid,
        parentUid: null,
        name: projectHandle.name,
        isEntity: false,
        children: ffTree[RootNodeUid] ? ffTree[RootNodeUid].children : [],
        data: {
          valid: true,
          type: 'folder',
        },
      },
      handler: projectHandle,
    }]
    while (dirHandlers.length) {
      const { node: dirNode, handler: dirHandler } = dirHandlers.shift() as { node: TNode, handler: FileSystemDirectoryHandle }

      const childrenObj: { [uid: TNodeUid]: boolean } = {}
      dirNode.children.map((c_uid) => {
        childrenObj[c_uid] = true
      })

      const _subNodes: TNode[] = []
      const childrenExists: { [uid: TNodeUid]: boolean } = {}
      try {
        for await (const entry of dirHandler.values()) {
          const childNodeUid = generateNodeUid(dirNode.uid, entry.name)
          childrenExists[childNodeUid] = true
          const entryExists = (childrenObj[childNodeUid] === true)
          const childNodeChildren = entryExists ? ffTree[childNodeUid].children : []
          handlers[childNodeUid] = entry

          let name = entry.name
          let type = 'folder'
          if (entry.kind !== 'directory') {
            const ext = getFileExtension(name)
            type = ext.slice(1)
            name = name.slice(0, name.length - ext.length)
          }

          const _subNode: TNode = {
            uid: childNodeUid,
            parentUid: dirNode.uid,
            name,
            isEntity: entry.kind !== "directory",
            children: childNodeChildren,
            data: {
              valid: true,
              type,
            },
          }
          _subNodes.push(_subNode)
          expandedItemsObj[childNodeUid] === true && dirHandlers.push({ node: _subNode, handler: entry as FileSystemDirectoryHandle })
        }
      } catch (err) {
        LogAllow && console.log(err)
        addMessage({
          type: 'error',
          content: 'Error occurred during importing project.',
        })
        throw 'error'
      }

      // sort the sub nodes by folder/file asc
      const subNodes = sortNodesByContext(_subNodes, project.context)

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
  const onImportProject = useCallback(async (fsType: TFileSystemType = 'local') => {
    if (fsType === 'local') {
      setPending(true)

      // open directory picker and get the project folde handle
      let projectHandle: FileSystemHandle
      try {
        projectHandle = await showDirectoryPicker({ _preferPolyfill: false, mode: 'readwrite' } as CustomDirectoryPickerOptions)
      } catch (err) {
        addMessage({
          type: 'info',
          content: 'You canceled importing project.',
        })

        setPending(false)
        return
      }

      dispatch(clearMainState())
      dispatch({ type: HmsClearActionType })

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
    if (project.context === 'local') {
      if (ffHandlers[RootNodeUid] === undefined || ffTree[RootNodeUid] === undefined) {
        // do nothing
      } else {
        try {
          await importLocalhostProject(ffHandlers[RootNodeUid] as FileSystemDirectoryHandle)
        } catch (err) {
          setPending(true)
        }
      }
    } else {

    }
  }, [project.context, ffHandlers, importLocalhostProject])

  // set file system watch timer
  useEffect(() => {
    let fsWatchInterval: NodeJS.Timer

    // stop if pending is true
    if (!pending && !temporary) {
      // create a fs watch interval and get the id
      fsWatchInterval = setInterval(watchFileSystem, getFileSystemWatchInterval(project.context))
    }

    // clear out the fs watch interval using the id when unmounting the component
    return () => clearInterval(fsWatchInterval)
  }, [pending, watchFileSystem, temporary])

  // generate TreeViewData from workspace
  const fileTreeViewData = useMemo(() => {
    let data: TreeViewData = {}
    for (const uid in ffTree) {
      const node: TNode = ffTree[uid]
      data[uid] = {
        index: uid,
        data: node,
        children: node.children,
        isFolder: !node.isEntity,
        canMove: uid !== RootNodeUid,
        canRename: uid !== RootNodeUid,
      }
    }
    return data
  }, [ffTree])

  // cb
  const cb_focusFFNode = useCallback((uid: TNodeUid) => {
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
  const cb_selectFFNode = useCallback((uids: TNodeUid[]) => {
    // for key-nav
    addRunningActions(['fileTreeView-select'])

    // validate
    let _uids = [...uids]
    _uids = validateNodeUidCollection(_uids)
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
  const cb_expandFFNode = useCallback(async (uid: TNodeUid) => {
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
  const cb_collapseFFNode = useCallback((uid: TNodeUid) => {
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

  // creating ff node handle
  const createTmpFFNode = useCallback((ffNodeType: TFileNodeType) => {
    // validate
    const node = ffTree[focusedItem]
    if (node === undefined || node.isEntity) return

    setTemporary(true)

    // expand the path to the focusedItem
    const _expandedItems: TNodeUid[] = []
    let _node = ffTree[focusedItem]
    while (_node.uid !== RootNodeUid) {
      _expandedItems.push(_node.uid)
      _node = ffTree[_node.parentUid as TNodeUid]
    }
    dispatch(expandFFNode(_expandedItems))

    // add tmp node
    const tmpNodeUid = 'tmpNodeUid'
    const tmpNode: TNode = {
      uid: `${node.uid}${NodeUidSplitter}${tmpNodeUid}`,
      parentUid: node.uid,
      name: '',
      isEntity: ffNodeType !== 'folder',
      children: [],
      data: {
        valid: false,
        type: ffNodeType,
      },
    }

    node.children.unshift(tmpNode.uid)

    const tmpTree = JSON.parse(JSON.stringify(ffTree))
    tmpTree[tmpNode.uid] = tmpNode

    setFFTree(tmpTree)
  }, [ffTree, focusedItem])

  // create folder/file api
  const createFFNode = useCallback(async (parentUid: TNodeUid, ffType: TFileNodeType, ffName: string) => {
    addRunningActions(['fileTreeView-create'])

    // verify handler permission
    const parentHandler = ffHandlers[parentUid] as FileSystemDirectoryHandle
    if (!(await verifyFileHandlerPermission(parentHandler))) {
      addMessage({
        type: 'error',
        content: `Invalid target directory. Check if you have "write" permission for the directory.`,
      })
      removeRunningActions(['fileTreeView-create'], false)
      setTemporary(false)
      return
    }

    // new name
    let newName: string = ''

    if (ffType === 'folder') {
      // generate new folder name - ex: {aaa - copy}...
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

      // create the directory with generated name
      try {
        await parentHandler.getDirectoryHandle(folderName, { create: true })
      } catch (err) {
        addMessage({
          type: 'error',
          content: 'Error occurred while creating a new folder.',
        })
        removeRunningActions(['fileTreeView-create'], false)
        setTemporary(false)
        return
      }
    } else { // file
      // generate new file name - ex: {aaa - copy}...
      let ext: string = ffType
      let name: string = ffName

      let fileName: string = `${ffName}.${ffType}`
      let exists: boolean = true
      try {
        await parentHandler.getFileHandle(`${ffName}.${ffType}`, { create: false })
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

      // create the file with generated name
      try {
        await parentHandler.getFileHandle(fileName, { create: true })
      } catch (err) {
        addMessage({
          type: 'error',
          content: 'Error occurred while creating a new file.',
        })
        removeRunningActions(['fileTreeView-create'], false)
        setTemporary(false)
        return
      }
    }

    const action: TFileAction = {
      type: 'create',
      param1: `${parentUid}?${newName}`,
      param2: ffType,
    }
    dispatch(setFileAction(action))

    removeRunningActions(['fileTreeView-create'])
    setTemporary(false)
  }, [ffHandlers])

  // read file content call back
  const cb_readFFNode = useCallback(async (uid: TNodeUid) => {
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
    if (!(await verifyFileHandlerPermission(handler))) {
      addMessage({
        type: 'error',
        content: 'Invalid file. Check if you have "read" permission for the file.',
      })
      removeRunningActions(['fileTreeView-read'], false)
      return
    }

    // get file type (extension)
    let fileType = getFileExtension(handler.name)
    if (fileType !== '') fileType = fileType.slice(1)
    fileType = ParsableFileTypes[fileType] ? fileType : 'unknown'

    // read the file content and set to global state
    try {
      const fileEntry = await handler.getFile()
      const content = await fileEntry.text()
      const file: TFile = {
        uid,
        name: handler.name,
        type: fileType as TFileType,
        content: content,
        changed: false,
      }

      // initial format code
      if (fileType === 'html') {
        const { formattedContent, tree } = parseHtml(content, htmlReferenceData, osType)
        if (content !== formattedContent) {
          file.content = formattedContent
          file.changed = true
        }
        setUpdateOpt({ parse: null, from: 'file' })

        addRunningActions(['processor-validNodeTree'])
        setNodeTree(tree)
      }

      dispatch(clearFNState())

      setTimeout(() => dispatch(setCurrentFile(file)), 0)
    } catch (err) {
      LogAllow && console.log(err)
      addMessage({
        type: 'error',
        content: 'Error occurred while reading the file content.',
      })
    }

    removeRunningActions(['fileTreeView-read'])
  }, [ffTree, ffHandlers, osType])

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
          content: 'Folder with the same name already exists.',
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
          content: 'File with the same name already exists.',
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
  const cb_renameFFNode = useCallback(async (uid: TNodeUid, newName: string, ffNodeType: TFileNodeType) => {
    // validate
    const node = ffTree[uid]
    if (node === undefined || node.name === newName) return
    const parentNode = ffTree[node.parentUid as TNodeUid]
    if (parentNode === undefined) return

    addRunningActions(['fileTreeView-rename'])

    /* verify handler permission */
    const handler = ffHandlers[uid] as FileSystemHandle
    const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
    if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler))) {
      addMessage({
        type: 'error',
        content: `Invalid directory/file. Check if you have "write" permission for the directory/file.`,
      })
      removeRunningActions(['fileTreeView-rename'], false)
      return
    }

    // rename using moveFF api
    try {
      await moveFF(handler, parentHandler, parentHandler, `${newName}.${ffNodeType}`, false, true)
    } catch (err) {
      addMessage({
        type: 'error',
        content: 'Error occurred while renaming ...',
      })
      removeRunningActions(['fileTreeView-rename'], false)
      return
    }

    const action: TFileAction = {
      type: 'rename',
      param1: { uid, parentUid: parentNode.uid },
      param2: { orgName: `${node.name}.${ffNodeType}`, newName: `${newName}.${ffNodeType}` },
    }
    dispatch(setFileAction(action))

    removeRunningActions(['fileTreeView-rename'])
  }, [ffTree, ffHandlers])

  // dnd fole/file call back - multiple
  const cb_dropFFNode = useCallback(async (uids: TNodeUid[], targetUid: TNodeUid, copy: boolean = false) => {
    // validate
    if (ffTree[targetUid] === undefined) return
    let validatedUids: TNodeUid[] = validateNodeUidCollection(uids, targetUid)
    if (validatedUids.length == 0) return

    addRunningActions(['fileTreeView-move'])

    /* verify target handler permission */
    const targetHandler = ffHandlers[targetUid] as FileSystemDirectoryHandle
    if (!(await verifyFileHandlerPermission(targetHandler))) {
      addMessage({
        type: 'error',
        content: `Invalid target directory. Check if you have "write" permission for the directory.`,
      })
      removeRunningActions(['fileTreeView-move'], false)
      return
    }

    let allDone = true
    const _uids: { uid: TNodeUid, name: string }[] = []
    for (const uid of validatedUids) {
      // validate
      const node = ffTree[uid]
      if (node === undefined) {
        allDone = false
        continue
      }
      const parentNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) {
        allDone = false
        continue
      }

      // validate node handler
      const handler = ffHandlers[uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler))) {
        allDone = false
        continue
      }

      // generate new name
      let newName = handler.name
      if (copy) {
        if (handler.kind === 'directory') {
          const ffName = `${handler.name} copy`
          let folderName: string = ffName
          let exists: boolean = true

          try {
            await targetHandler.getDirectoryHandle(handler.name, { create: false })
            exists = true
          } catch (err) {
            exists = false
          }

          if (exists) {
            try {
              await targetHandler.getDirectoryHandle(ffName, { create: false })
              exists = true
            } catch (err) {
              exists = false
            }

            if (exists) {
              let index = 0
              while (exists) {
                const _folderName = `${ffName} (${++index})`
                try {
                  await targetHandler.getDirectoryHandle(_folderName, { create: false })
                  exists = true
                } catch (err) {
                  folderName = _folderName
                  exists = false
                }
              }
            }
            newName = folderName
          }
        } else {
          let ext: string = getFileExtension(handler.name)
          let name: string = handler.name.slice(0, handler.name.length - ext.length)
          name = `${name} copy`
          const ffName = `${name}${ext}`

          let fileName: string = ffName
          let exists: boolean = true

          try {
            await targetHandler.getFileHandle(handler.name, { create: false })
            exists = true
          } catch (err) {
            exists = false
          }

          if (exists) {
            try {
              await targetHandler.getFileHandle(ffName, { create: false })
              exists = true
            } catch (err) {
              exists = false
            }

            if (exists) {
              let index = 0
              while (exists) {
                const _fileName = `${name} (${++index})${ext}`
                try {
                  await targetHandler.getFileHandle(_fileName, { create: false })
                  exists = true
                } catch (err) {
                  fileName = _fileName
                  exists = false
                }
              }
            }
            newName = fileName
          }

        }
      }

      // move using moveFF api
      try {
        await moveFF(handler, parentHandler, targetHandler, newName, copy)
        _uids.push({ uid, name: newName })
      } catch (err) {
        // error occurred
      }
    }
    if (!allDone) {/* toast error message */
      addMessage({
        type: 'warning',
        content: 'Some directory/file couldn\'t be moved.',
      })
    }

    const action: TFileAction = {
      type: copy ? 'copy' : 'cut',
      param1: _uids,
      param2: _uids.map(() => targetUid),
    }
    dispatch(setFileAction(action))

    removeRunningActions(['fileTreeView-move'])
  }, [ffTree, ffHandlers])
  // -------------------------------------------------------------- Sync --------------------------------------------------------------

  // -------------------------------------------------------------- Cmdk --------------------------------------------------------------
  // panel focus handler
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    addRunningActions(['fileTreeView-focus'])

    setActivePanel('file')

    const uid = RootNodeUid

    // validate
    if (focusedItem === uid || ffTree[uid] === undefined) {
      removeRunningActions(['fileTreeView-focus'], false)
      return
    }

    dispatch(selectFFNode([]))
    dispatch(focusFFNode(uid))

    removeRunningActions(['fileTreeView-focus'])
  }, [focusedItem, ffTree])

  // command detect & do actions
  useEffect(() => {
    if (currentCommand.action === '') return

    if (currentCommand.action === 'Open') {
      onImportProject()
    } else {
      if (activePanel !== 'file') return

      switch (currentCommand.action) {
        case 'Actions':
          onActions()
          break
        case 'Add':
          onAdd()
          break
        case 'Cut':
          onCut()
          break
        case 'Copy':
          onCopy()
          break
        case 'Paste':
          onPaste()
          break
        case 'Delete':
          onDelete()
          break
        case 'Duplicate':
          onDuplicate()
          break
        case 'Rename':
          onRename()
          break
        default:
          onAddNode(currentCommand.action)
          break
      }
    }
  }, [currentCommand.changed])

  // handlers
  const onActions = useCallback(() => {
    if (cmdkOpen) return
    setCmdkPages(['Actions'])
    setCmdkOpen(true)
  }, [cmdkOpen])
  const onAdd = useCallback(() => {
    setCmdkPages([...cmdkPages, 'Add'])
    setCmdkOpen(true)
  }, [cmdkOpen, cmdkPages])
  const onCut = useCallback(() => {
    setClipboardData({ panel: 'file', type: 'cut', uids: selectedItems })
  }, [selectedItems])
  const onCopy = useCallback(() => {
    setClipboardData({ panel: 'file', type: 'copy', uids: selectedItems })
  }, [selectedItems])
  const onPaste = useCallback(() => {
    if (clipboardData.panel !== 'file') return

    if (clipboardData.type === 'cut') {
      setClipboardData({ panel: 'file', type: 'cut', uids: [] })
      cb_dropFFNode(clipboardData.uids, focusedItem)
    } else if (clipboardData.type === 'copy') {
      cb_dropFFNode(clipboardData.uids, focusedItem, true)
    }
  }, [clipboardData, cb_dropFFNode, focusedItem])
  const onDelete = useCallback(async () => {
    // validate selected uids
    const uids = selectedItems
    if (uids.length === 0) return

    // confirm
    if (!window.confirm("Are you sure you want to delete them? This action cannot be undone!")) return

    addRunningActions(['fileTreeView-delete'])
    setTemporary(true)

    let allDone = true
    for (const uid of uids) {
      // validate node and parentNode
      const node: TNode = ffTree[uid]
      if (node === undefined) {
        allDone = false
        continue
      }
      const parentNode: TNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) {
        allDone = false
        continue
      }

      // verify handler permission
      const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(parentHandler))) {
        allDone = false
        continue
      }

      // remove the entry
      try {
        const ffType = (node.data as TNormalNodeData).type
        const ffName = ffType === 'folder' ? node.name : node.name + '.' + ffType
        await parentHandler.removeEntry(ffName, { recursive: true })
      } catch (err) {
        allDone = false
      }
    }

    if (!allDone) {
      addMessage({
        type: 'warning',
        content: 'Some directory/file couldn\'t be deleted.',
      })
    }

    removeRunningActions(['fileTreeView-delete'], false)
    setTemporary(false)
  }, [selectedItems, ffTree, ffHandlers])
  const onDuplicate = useCallback(async () => {
    // validate
    if (focusedItem === RootNodeUid) return
    const node = ffTree[focusedItem]
    if (node === undefined) return
    const parentNode = ffTree[node.parentUid as TNodeUid]
    if (parentNode === undefined) return

    addRunningActions(['fileTreeView-duplicate'])

    // verify handler permission
    const handler = ffHandlers[node.uid] as FileSystemHandle
    const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
    if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler))) {
      addMessage({
        type: 'error',
        content: `Invalid directory/file. Check if you have "write" permission for the directory/file.`,
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
        content: 'Error occurred while duplicating ...',
      })
      removeRunningActions(['fileTreeView-duplicate'], false)
      return
    }

    const action: TFileAction = {
      type: 'copy',
      param1: [{ uid: focusedItem, name: newName }],
      param2: [parentNode.uid],
    }
    dispatch(setFileAction(action))

    removeRunningActions(['fileTreeView-duplicate'])
  }, [focusedItem, ffTree, ffHandlers])
  const onRename = useCallback(() => {
  }, [])
  const onAddNode = useCallback((actionName: string) => {
    if (actionName.startsWith('AddNode-') === false) return

    const nodeType = actionName.slice(8) as TFileNodeType

    createTmpFFNode(nodeType)
  }, [createTmpFFNode])
  // -------------------------------------------------------------- Cmdk --------------------------------------------------------------

  // -------------------------------------------------------------- other --------------------------------------------------------------
  // -------------------------------------------------------------- other --------------------------------------------------------------

  return <>
    <div className="panel">
      <div
        className="border-bottom"
        style={{
          height: 'calc(50vh)',
          overflow: "auto",
          background: (focusedItem === RootNodeUid && ffTree[RootNodeUid] !== undefined) ? "rgba(0, 0, 0, 0.02)" : "none",
        }}
        onClick={onPanelClick}
      >
        {/* Nav Bar */}
        <div className="sticky direction-column padding-s box-l justify-stretch border-bottom background-primary">
          <div className="gap-s box justify-start">
            {/* label */}
            <span className="text-s">Workspace</span>
          </div>
          <div className="gap-s justify-end box">
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
              const node: TNode = props.item.data
              !node?.data?.valid && setTimeout(() => {
                props.context.selectItem()
                props.context.startRenamingItem()
              }, 0)

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
                    id={`FileTreeView-${props.item.index}`}
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

                      // skip click-event from an inline rename input
                      const targetId = e.target && (e.target as HTMLElement).id
                      if (targetId === 'FileTreeView-RenameInput') {
                        return
                      }

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
                    onMouseEnter={() => setFFHoveredItem(props.item.index as TNodeUid)}
                    onMouseLeave={() => setFFHoveredItem('')}
                  >
                    <div className="gap-xs padding-xs" style={{ width: "100%" }}>
                      {/* render arrow */}
                      {props.arrow}

                      {/* render icon */}
                      {props.item.isFolder ?
                        props.context.isExpanded ? <SVGIconI {...{ "class": "icon-xs" }}>folder</SVGIconI> : <SVGIconII {...{ "class": "icon-xs" }}>folder</SVGIconII> :
                        <SVGIconIII {...{ "class": "icon-xs" }}>page</SVGIconIII>}

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
                {props.item.isFolder ?
                  props.context.isExpanded ? <SVGIconI {...{ "class": "icon-xs" }}>down</SVGIconI> : <SVGIconII {...{ "class": "icon-xs" }}>right</SVGIconII> :
                  <div className='icon-xs'></div>}
              </>
            },
            renderItemTitle: (props) => {
              return <>
                <span className='text-s justify-stretch' style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "calc(100% - 32px)" }}>
                  {props.title}
                </span>
              </>
            },
            renderRenameInput: (props) => {
              const node: TNode = props.item.data
              return <>
                <form {...props.formProps}>
                  <input
                    id={'FileTreeView-RenameInput'}
                    {...props.inputProps}
                    ref={props.inputRef}
                    className={cx(
                      'justify-start',
                      'padding-s',
                      'gap-s',
                      'text-s',
                      'background-primary',
                    )}
                    onKeyUp={(e) => {
                      props.inputProps.onKeyUp && props.inputProps.onKeyUp(e)
                      e.code === 'Escape' && !node.data.valid && setTemporary(false)
                    }}
                    onChange={(e) => {
                      props.inputProps.onChange && props.inputProps.onChange(e)
                    }}
                    onBlur={(e) => {
                      props.inputProps.onBlur && props.inputProps.onBlur(e)
                      !node.data.valid && setTemporary(false)
                    }}
                  />
                </form>
              </>
            },
          }}

          /* possibilities */
          props={{
            canDragAndDrop: true,
            canDropOnFolder: true,
            canDropOnNonFolder: false,

            canSearch: false,
            canSearchByStartingTyping: false,
          }}

          /* cb */
          callbacks={{
            /* RENAME CALLBACK */
            onRenameItem: (item, name, treeId) => {
              if (item.data.data.valid) {
                cb_renameFFNode(item.index as TNodeUid, name, item.data.data.type)
              } else {
                createFFNode(item.data.parentUid, item.data.data.type, name)
              }
            },

            /* SELECT, FOCUS, EXPAND, COLLAPSE CALLBACK */
            onSelectItems: (items, treeId) => {
              cb_selectFFNode(items as TNodeUid[])
            },
            onFocusItem: (item, treeId) => {
              cb_focusFFNode(item.index as TNodeUid)
            },
            onExpandItem: (item, treeId) => {
              cb_expandFFNode(item.index as TNodeUid)
            },
            onCollapseItem: (item, treeId) => {
              cb_collapseFFNode(item.index as TNodeUid)
            },

            /* READ CALLBACK */
            onPrimaryAction: (item, treeId) => {
              cb_readFFNode(item.index as TNodeUid)
            },

            // DnD CALLBACK
            onDrop: (items, target) => {
              const uids: TNodeUid[] = items.map(item => item.index as TNodeUid)
              const targetUid: TNodeUid = (target as DraggingPositionItem).targetItem as TNodeUid
              cb_dropFFNode(uids, targetUid)
            }
          }}
        />
      </div>
    </div>
  </>
}
