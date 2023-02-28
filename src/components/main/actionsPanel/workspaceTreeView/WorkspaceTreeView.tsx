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
} from 'file-system-access';
import {
  CustomDirectoryPickerOptions,
} from 'file-system-access/lib/showDirectoryPicker';
import {
  DraggingPositionItem,
  TreeItem,
} from 'react-complex-tree';
import {
  useDispatch,
  useSelector,
} from 'react-redux';
import { Panel } from 'react-resizable-panels';

import {
  SVGIconI,
  SVGIconII,
  SVGIconIII,
  TreeView,
} from '@_components/common';
import { TreeViewData } from '@_components/common/treeView/types';
import {
  HmsClearActionType,
  NodeUidSplitter,
  ParsableFileTypes,
  RootNodeUid,
  TmpNodeUid,
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
  getTemporaryFileExtension,
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
    (async () => {
      if (isHms === null) return

      /**
       * undo if isHms = true
       * redo if isHms = false
       */
      if (isHms === true) {
        const { type, param1, param2 } = ffAction
        if (type === 'create') {
          _delete([param1])
        } else if (type === 'rename') {
          const { uid, parentUid } = param1
          const { orgName, newName } = param2
          const currentUid = generateNodeUid(parentUid, newName)
          setTemporaryNodes(currentUid)
          await _rename(currentUid, orgName)
          removeTemporaryNodes(currentUid)
        } else if (type === 'cut') {
          const _uids: { uid: TNodeUid, name: string }[] = param1
          const _targetUids: TNodeUid[] = param2

          const uids: TNodeUid[] = []
          const targetUids: TNodeUid[] = []

          _targetUids.map((targetUid, index) => {
            const { uid, name } = _uids[index]
            uids.push(generateNodeUid(targetUid, name))
            targetUids.push(getParentNodeUid(uid))
          })
          _cut(uids, targetUids)
        } else if (type === 'copy') {
          const _uids: { uid: TNodeUid, name: string }[] = param1
          const _targetUids: TNodeUid[] = param2

          const uids: TNodeUid[] = []
          _targetUids.map((targetUid, index) => {
            const { uid, name } = _uids[index]
            uids.push(generateNodeUid(targetUid, name))
          })
          _delete(uids)
        } else if (type === 'delete') {
        }
      } else {
        // wait until dispatch is done
        isRedo.current = !isRedo.current
        if (isRedo.current === true) return

        const { type, param1, param2 } = fileAction
        if (type === 'create') {
          _create(param1, param2)
        } else if (type === 'rename') {
          const { uid, parentUid } = param1
          const { orgName, newName } = param2
          setTemporaryNodes(uid)
          await _rename(uid, newName)
          removeTemporaryNodes(uid)
        } else if (type === 'cut') {
          const _uids: { uid: TNodeUid, name: string }[] = param1
          const targetUids: TNodeUid[] = param2

          const uids: TNodeUid[] = _uids.map((_uid) => _uid.uid)
          _cut(uids, targetUids)
        } else if (type === 'copy') {
          const _uids: { uid: TNodeUid, name: string }[] = param1
          const targetUids: TNodeUid[] = param2

          const uids: TNodeUid[] = []
          const names: string[] = []
          _uids.map((_uid) => {
            uids.push(_uid.uid)
            names.push(_uid.name)
          })
          _copy(uids, names, targetUids)
        } else if (type === 'delete') {
        }
      }

      setIsHms(null)
    })()
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
      if (type === '*folder') {
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
        await parentHandler.removeEntry(getNodeEntryName(uid), { recursive: true })
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

    await Promise.all(uids.map(async (uid, index) => {
      const targetUid = targetUids[index]

      // validate
      const node = ffTree[uid]
      if (node === undefined) return
      const parentNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) return
      if (ffTree[targetUid] === undefined) return

      // validate ff handlers
      const handler = ffHandlers[uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle, targetHandler = ffHandlers[targetUid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler)) || !(await verifyFileHandlerPermission(targetHandler))) return

      // move using moveFF api
      try {
        await moveFF(handler, parentHandler, targetHandler, handler.name)
      } catch (err) {
      }
    }))

    removeRunningActions(['fileTreeView-move'], false)
  }, [ffTree, ffHandlers])
  const _copy = useCallback(async (uids: TNodeUid[], names: string[], targetUids: TNodeUid[]) => {
    addRunningActions(['fileTreeView-duplicate'])

    await Promise.all(uids.map(async (uid, index) => {
      const name = names[index]
      const targetUid = targetUids[index]

      // validate
      const node = ffTree[uid]
      if (node === undefined) return
      const parentNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) return
      if (ffTree[targetUid] === undefined) return

      // validate ff handlers
      const handler = ffHandlers[uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle, targetHandler = ffHandlers[targetUid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler)) || !(await verifyFileHandlerPermission(targetHandler))) return

      // move using moveFF api
      try {
        await moveFF(handler, parentHandler, targetHandler, name, true)
      } catch (err) {
      }
    }))

    removeRunningActions(['fileTreeView-duplicate'], false)
  }, [ffTree, ffHandlers])
  // -------------------------------------------------------------- folder/file hms --------------------------------------------------------------

  const [invalidNodes, _setInvalidNodes] = useState<{ [uid: TNodeUid]: boolean }>({})
  const [temporaryNodes, _setTemporaryNodes] = useState<{ [uid: TNodeUid]: boolean }>({})

  // -------------------------------------------------------------- Sync --------------------------------------------------------------
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
  const cb_expandFFNode = useCallback((uid: TNodeUid) => {
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

    // expand the focusedItem
    node.uid !== RootNodeUid && expandedItemsObj[node.uid] === undefined && dispatch(expandFFNode([node.uid]))

    // add tmp node
    const tmpNode: TNode = {
      uid: `${node.uid}${NodeUidSplitter}${TmpNodeUid}`,
      parentUid: node.uid,
      name: '',
      isEntity: ffNodeType !== '*folder',
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

  /*
  - invalid - can't do any actions on the nodes
  false - update it's children
  true - don't update it's children
  - temporary - don't display the nodes
  */
  const setInvalidNodes = useCallback((...uids: TNodeUid[]) => {
    const _invalidNodes = { ...invalidNodes }
    uids.map(uid => _invalidNodes[uid] = true)
    _setInvalidNodes(_invalidNodes)
  }, [invalidNodes])
  const removeInvalidNodes = useCallback((...uids: TNodeUid[]) => {
    const _invalidNodes = { ...invalidNodes }
    uids.map(uid => delete _invalidNodes[uid])
    _setInvalidNodes(_invalidNodes)
  }, [invalidNodes])
  const setTemporaryNodes = useCallback((...uids: TNodeUid[]) => {
    const _temporaryNodes = { ...temporaryNodes }
    uids.map(uid => _temporaryNodes[uid] = true)
    _setTemporaryNodes(_temporaryNodes)
  }, [temporaryNodes])
  const removeTemporaryNodes = useCallback((...uids: TNodeUid[]) => {
    const _temporaryNodes = { ...temporaryNodes }
    uids.map(uid => delete _temporaryNodes[uid])
    _setTemporaryNodes(_temporaryNodes)
  }, [temporaryNodes])

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
      return
    }

    // new name
    let newName: string = ''

    if (ffType === '*folder') {
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
        return
      }
    } else { // file
      // generate new file name - ex: {aaa - copy}...
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
          const _fileName = `${ffName} (${++index}).${ffType}`
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
  }, [ffHandlers])

  // read file content call back
  const cb_readFFNode = useCallback(async (uid: TNodeUid) => {
    // for key-nav
    addRunningActions(['fileTreeView-read'])

    // validate
    const node = ffTree[uid]
    if (node === undefined || !node.isEntity || file.uid === uid) {
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
      addMessage({
        type: 'error',
        content: 'Error occurred while reading the file content.',
      })
    }

    removeRunningActions(['fileTreeView-read'])
  }, [ffTree, ffHandlers, osType, file.uid])

  /**
   * general move api - for rename, copy/paste(duplicate), cut/paste(move)
   * here, the handler params are already verified ones.
   * @param handler 
   * @param parentHandler 
   * @param targetHandler 
   * @param newName 
   * @param copy 
   * @param showWarning 
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

    // verify handler permission
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
    const _orgName = getNodeEntryName(uid)
    const _newName = ffNodeType === '*folder' ? `${newName}` :
      ffNodeType !== '' ? `${newName}.${ffNodeType}` : `${newName}`
    try {
      await moveFF(handler, parentHandler, parentHandler, _newName, false, true)
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
      param2: { orgName: _orgName, newName: _newName },
    }
    dispatch(setFileAction(action))

    removeRunningActions(['fileTreeView-rename'])
  }, [ffTree, ffHandlers])

  // dnd fole/file call back - multiple
  const cb_dropFFNode = useCallback(async (uids: TNodeUid[], targetUid: TNodeUid, copy: boolean = false) => {
    // validate
    if (ffTree[targetUid] === undefined) return
    const validatedUids: TNodeUid[] = validateNodeUidCollection(uids, targetUid)
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
    await Promise.all(validatedUids.map(async (uid) => {
      // validate
      const node = ffTree[uid]
      if (node === undefined) {
        allDone = false
        return
      }
      const parentNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) {
        allDone = false
        return
      }

      // validate node handler
      const handler = ffHandlers[uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler))) {
        allDone = false
        return
      }

      // generate new name
      let newName = handler.name
      if (copy) {
        if (handler.kind === 'directory') {
          const ffName = `${handler.name} copy`
          let folderName: string = ffName
          let exists: boolean

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
          const nodeData = node.data as TNormalNodeData
          const ext: string = nodeData.type !== '' ? '.' + nodeData.type : nodeData.type
          let name: string = node.name
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
        allDone = false
      }
    }))

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

  // open default file when opening a new project
  const [initialFileToOpen, setInitialFileToOpen] = useState<TNodeUid>()
  useEffect(() => {
    // validate
    if (initialFileToOpen && ffTree[initialFileToOpen] !== undefined) {
      setInitialFileToOpen(undefined)

      // focus and read the initial file
      cb_focusFFNode(initialFileToOpen)
      cb_readFFNode(initialFileToOpen)
    }
  }, [initialFileToOpen])

  // import project from localhost using filesystemdirectoryhandle
  const importLocalhostProject = useCallback(async (projectHandle: FileSystemDirectoryHandle, newOpen: boolean = false): Promise<void | null | TNodeUid> => {
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

    // store index and first met html file
    let indexHtmlUid: TNodeUid | null = null
    let firstHtmlUid: TNodeUid | null = null

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
          type: '*folder',
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
          if (temporaryNodes[childNodeUid]) continue

          childrenExists[childNodeUid] = true
          handlers[childNodeUid] = entry

          const childNodeChildren = childrenObj[childNodeUid] ? ffTree[childNodeUid].children : []

          let name = entry.name
          let type = '*folder'
          let ext = ''
          if (entry.kind !== 'directory') {
            ext = getFileExtension(name)
            type = ext.slice(1)
            name = name.slice(0, name.length - ext.length)
          }

          // hide temporary files - .crswap
          const temporaryFileExt = getTemporaryFileExtension(osType)
          if (ext === temporaryFileExt) continue

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

          dirNode.uid === RootNodeUid && newOpen && firstHtmlUid === null && type === 'html' ? firstHtmlUid = childNodeUid : null
          dirNode.uid === RootNodeUid && newOpen && name === 'index' && type === 'html' ? indexHtmlUid = childNodeUid : null

          _subNodes.push(_subNode)
          expandedItemsObj[childNodeUid] === true && dirHandlers.push({ node: _subNode, handler: entry as FileSystemDirectoryHandle })
        }
      } catch (err) {
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
        if (!childrenExists[c_uid] && ffTree[c_uid].data.valid) {
          deletedUids[c_uid] = true
        }
      })
      dirNode.children = dirNode.children.filter(c_uid => !ffTree[c_uid].data.valid)
      subNodes.map((subNode) => {
        nodes[subNode.uid] = subNode
        dirNode.children.push(subNode.uid)
      })
      nodes[dirNode.uid] = dirNode
    }

    // update the state
    updateFF(deletedUids, nodes, handlers)
    dispatch(updateFFTreeViewState({ deletedUids: Object.keys(deletedUids) }))

    if (newOpen) {
      const nodeUidToOpen: TNodeUid | null = indexHtmlUid || firstHtmlUid
      return nodeUidToOpen
    }
  }, [ffTree, temporaryNodes, expandedItemsObj, osType])

  // open project button handler
  const onImportProject = useCallback(async (fsType: TFileSystemType = 'local'): Promise<void> => {
    if (fsType === 'local') {
      // open directory picker and get the project folde handle
      let projectHandle: FileSystemHandle
      try {
        projectHandle = await showDirectoryPicker({ _preferPolyfill: false, mode: 'readwrite' } as CustomDirectoryPickerOptions)
      } catch (err) {
        addMessage({
          type: 'info',
          content: 'You canceled importing project.',
        })
        return
      }

      dispatch(clearMainState())
      dispatch({ type: HmsClearActionType })

      // import localhost project
      try {
        const nodeUidToOpen = await importLocalhostProject(projectHandle as FileSystemDirectoryHandle, true)
        if (nodeUidToOpen === null) {
          addMessage({
            type: 'info',
            content: 'There\'s no html file in the root directory.',
          })
        } else {
          setInitialFileToOpen(nodeUidToOpen as TNodeUid)
        }
      } catch (err) {
        // err occurred
      }
    } else if (fsType === '') {

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
        }
      }
    } else {
      // tmp
    }
  }, [project.context, ffHandlers, importLocalhostProject])

  // set file system watch timer
  useEffect(() => {
    // create a fs watch interval and get the id
    const fsWatchInterval = setInterval(watchFileSystem, getFileSystemWatchInterval(project.context))

    // clear out the fs watch interval using the id when unmounting the component
    return () => clearInterval(fsWatchInterval)
  }, [watchFileSystem])
  // -------------------------------------------------------------- Sync --------------------------------------------------------------

  // -------------------------------------------------------------- Cmdk --------------------------------------------------------------
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

    let allDone = true
    await Promise.all(uids.map(async (uid) => {
      // validate node and parentNode
      const node: TNode = ffTree[uid]
      if (node === undefined) {
        allDone = false
        return
      }
      const parentNode: TNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) {
        allDone = false
        return
      }

      // verify handler permission
      const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(parentHandler))) {
        allDone = false
        return
      }

      // remove the entry
      try {
        await parentHandler.removeEntry(getNodeEntryName(uid), { recursive: true })
      } catch (err) {
        allDone = false
      }
    }))

    if (!allDone) {
      addMessage({
        type: 'warning',
        content: 'Some directory/file couldn\'t be deleted.',
      })
    }

    removeRunningActions(['fileTreeView-delete'], false)
  }, [selectedItems, ffTree, ffHandlers])
  const onDuplicate = useCallback(async () => {
    // validate selected uids
    const uids = selectedItems
    if (uids.length === 0) return

    addRunningActions(['fileTreeView-duplicate'])

    let allDone = true
    const _uids: { uid: TNodeUid, name: string }[] = []
    const _targetUids: TNodeUid[] = []
    await Promise.all(uids.map(async (uid) => {
      // validate node and parentNode
      const node: TNode = ffTree[uid]
      if (node === undefined) {
        allDone = false
        return
      }
      const parentNode: TNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) {
        allDone = false
        return
      }

      // verify handler permission
      const handler = ffHandlers[node.uid] as FileSystemHandle
      const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler))) {
        allDone = false
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
        const nodeData = node.data as TNormalNodeData
        const ext: string = nodeData.type !== '' ? '.' + nodeData.type : nodeData.type
        let name: string = node.name
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
        _uids.push({ uid, name: newName })
        _targetUids.push(parentNode.uid)
      } catch (err) {
        allDone = false
      }
    }))

    if (!allDone) {
      addMessage({
        type: 'warning',
        content: 'Some directory/file couldn\'t be duplicated.',
      })
    }

    const action: TFileAction = {
      type: 'copy',
      param1: _uids,
      param2: _targetUids,
    }
    dispatch(setFileAction(action))

    removeRunningActions(['fileTreeView-duplicate'])
  }, [selectedItems, ffTree, ffHandlers])
  const onAddNode = useCallback((actionName: string) => {
    if (actionName.startsWith('AddNode-') === false) return

    const nodeType = actionName.slice(8)

    createTmpFFNode(nodeType === 'folder' ? '*folder' : nodeType as TFileNodeType)
  }, [createTmpFFNode])
  // -------------------------------------------------------------- Cmdk --------------------------------------------------------------

  // -------------------------------------------------------------- other --------------------------------------------------------------
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
  // -------------------------------------------------------------- other --------------------------------------------------------------

  return <>
    <Panel defaultSize={45} minSize={30}>
      <div
        id="FileTreeView"
        className={cx(
          'scrollable',
          (activePanel === 'file' && focusedItem === RootNodeUid) ? "outline outline-primary" : "",
        )}
        style={{ padding: '1px 1px 1rem' }}
        onClick={onPanelClick}
      >
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
              useEffect(() => {
                const node: TNode = props.item.data
                if (!node.data.valid) {
                  setInvalidNodes(node.uid, node.parentUid as TNodeUid)
                  props.context.selectItem()
                  props.context.startRenamingItem()
                }
              }, [])

              return <>
                <li
                  className={cx(
                    props.context.isSelected && '',
                    props.context.isDraggingOver && 'background-secondary',
                    props.context.isDraggingOverParent && '',
                    props.context.isFocused && '',
                    invalidNodes[props.item.data.uid] && 'opacity-m',
                  )}
                  {...props.context.itemContainerWithChildrenProps}
                >
                  {/* self */}
                  <div
                    id={`FileTreeView-${props.item.index}`}
                    className={cx(
                      'justify-stretch',
                      'padding-xs',
                      'outline-default',
                      props.item.index === ffHoveredItem ? 'outline' : '',
                      props.context.isSelected && 'background-secondary outline-none',
                      props.context.isDraggingOver && '',
                      props.context.isDraggingOverParent && '',
                      !props.context.isSelected && props.context.isFocused && 'outline',
                    )}
                    style={{
                      flexWrap: "nowrap",
                      paddingLeft: `${props.depth * 10}px`,
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
                    <div className="gap-xs padding-xs" style={{ width: 'fit-content' }}>
                      {/* render arrow */}
                      {props.arrow}

                      {/* render icon */}
                      {props.item.isFolder ?
                        props.context.isExpanded ? <SVGIconI {...{ "class": "icon-xs" }}>folder</SVGIconI> : <SVGIconII {...{ "class": "icon-xs" }}>folder</SVGIconII> :
                        <SVGIconIII {...{ "class": "icon-xs" }}>page</SVGIconIII>}
                    </div>

                    {/* render title */}
                    {props.title}
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
                <span
                  className='text-s justify-stretch inline-label'
                  style={{
                    width: "calc(100% - 32px)"
                  }}
                >
                  {props.title}
                </span>
              </>
            },
            renderRenameInput: (props) => {
              return <>
                <form
                  {...props.formProps}
                  className={'box'}
                >
                  <input
                    id={'FileTreeView-RenameInput'}
                    {...props.inputProps}
                    ref={props.inputRef}
                    className={cx(
                      'text-s',
                      'background-primary',
                      'no-frame',
                    )}
                    onChange={(e) => {
                      props.inputProps.onChange && props.inputProps.onChange(e)
                    }}
                    onBlur={(e) => {
                      props.inputProps.onBlur && props.inputProps.onBlur(e)
                      props.formProps.onSubmit && props.formProps.onSubmit(new Event('') as unknown as React.FormEvent<HTMLFormElement>)
                    }}
                  />
                  <button ref={props.submitButtonRef} className={'hidden'}></button>
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
            canRename: true,
          }}

          /* cb */
          callbacks={{
            /* RENAME CALLBACK */
            onStartRenamingItem: useCallback((item: TreeItem, treeId: string) => {
              setInvalidNodes(item.data.uid, item.data.parentUid)
            }, [setInvalidNodes]),
            onAbortRenamingItem: useCallback((item: TreeItem, treeId: string) => {
              if (!item.data.data.valid) {
                const tmpTree = JSON.parse(JSON.stringify(ffTree))
                tmpTree[item.data.parentUid].children = tmpTree[item.data.parentUid].children.filter((c_uid: TNodeUid) => c_uid !== item.data.uid)
                delete tmpTree[item.data.uid]
                setFFTree(tmpTree)
              }

              removeInvalidNodes(item.data.uid, item.data.parentUid)
            }, [ffTree, removeInvalidNodes]),
            onRenameItem: useCallback(async (item: TreeItem, name: string, treeId: string) => {
              if (item.data.data.valid) {
                // const tmpFileUid = getTemporaryFileNodeUid(ffTree[item.data.uid], name, osType)
                // setTemporaryNodes(...(item.data.data.type === '*folder' || ffTree[tmpFileUid] !== undefined ? [item.data.uid] : [item.data.uid, tmpFileUid]))

                setTemporaryNodes(item.data.uid)
                await cb_renameFFNode(item.index as TNodeUid, name, item.data.data.type)
                removeTemporaryNodes(item.data.uid)
              } else {
                await createFFNode(item.data.parentUid, item.data.data.type, name)

                const tmpTree = JSON.parse(JSON.stringify(ffTree))
                tmpTree[item.data.parentUid].children = tmpTree[item.data.parentUid].children.filter((c_uid: TNodeUid) => c_uid !== item.data.uid)
                delete tmpTree[item.data.uid]
                setFFTree(tmpTree)
              }
              removeInvalidNodes(item.data.uid, item.data.parentUid)
            }, [cb_renameFFNode, createFFNode, setTemporaryNodes, removeTemporaryNodes, removeInvalidNodes, ffTree, osType]),

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
              item.data.data.valid ? cb_readFFNode(item.index as TNodeUid) : removeRunningActions(['fileTreeView-read'], false)
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
    </Panel>
  </>
}
