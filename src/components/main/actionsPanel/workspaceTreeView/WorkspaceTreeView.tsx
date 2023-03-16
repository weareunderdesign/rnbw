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
  DraggingPosition,
  DraggingPositionItem,
  TreeItem,
  TreeItemIndex,
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
  LogAllow,
  NodeUidSplitter,
  ParsableFileTypes,
  RootNodeUid,
  TmpNodeUid,
} from '@_constants/main';
import {
  generateNodeUid,
  getNodeEntryName,
  getParentNodeUid,
  validateNodeUidCollection,
} from '@_node/apis';
import {
  _path,
  configProject,
  TFileHandlerInfo,
  TFileNodeData,
} from '@_node/file';
import {
  TNode,
  TNodeTreeData,
  TNodeUid,
  TNormalNodeData,
} from '@_node/types';
import {
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
  TFileHandlerCollection,
} from '@_redux/main';
import { verifyFileHandlerPermission } from '@_services/main';
import {
  TFileAction,
  TFileNodeType,
  TFileSystemType,
} from '@_types/main';

import { WorkspaceTreeViewProps } from './types';

export default function WorkspaceTreeView(props: WorkspaceTreeViewProps) {
  const dispatch = useDispatch()

  // main context
  const {
    // groupping action
    addRunningActions, removeRunningActions,

    // file tree view
    ffHoveredItem, setFFHoveredItem, ffHandlers, setFFHandlers, ffTree, setFFTree,

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

    // panel-resize
    panelResizing,

    // stage-view
    fileInfo, setFileInfo,
  } = useContext(MainContext)

  // redux state
  const actionGroupIndex = useSelector(getActionGroupIndexSelector)
  const { workspace, project, file } = useSelector(navigatorSelector)
  const { fileAction } = useSelector(globalSelector)
  const { futureLength, pastLength } = useSelector(hmsInfoSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(ffSelector)
  // const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(fnSelector)

  /*
    - invalid - can't do any actions on the nodes
    - temporary - don't display the nodes
  */
  const [invalidNodes, _setInvalidNodes] = useState<{ [uid: TNodeUid]: boolean }>({})
  const [temporaryNodes, _setTemporaryNodes] = useState<{ [uid: TNodeUid]: boolean }>({})
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
    setInvalidNodes(...uids)

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

    removeInvalidNodes(...uids)
    removeRunningActions(['fileTreeView_delete'], false)
  }, [setInvalidNodes, removeInvalidNodes, ffTree, ffHandlers])
  const _rename = useCallback(async (uid: TNodeUid, newName: string) => {
    addRunningActions(['fileTreeView-rename'])
    const newUid = generateNodeUid(getParentNodeUid(uid), newName)
    setTemporaryNodes(uid)
    setInvalidNodes(newUid)

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

    removeInvalidNodes(newUid)
    removeTemporaryNodes(uid)
    removeRunningActions(['fileTreeView-rename'], false)
  }, [setTemporaryNodes, removeTemporaryNodes, setInvalidNodes, removeInvalidNodes, ffTree, ffHandlers])
  const _cut = useCallback(async (uids: TNodeUid[], targetUids: TNodeUid[]) => {
    addRunningActions(['fileTreeView-move'])

    const _invalidNodes = { ...invalidNodes }

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
      const newUid = generateNodeUid(targetUid, handler.name)
      _invalidNodes[uid] = true
      _invalidNodes[newUid] = true
      setInvalidNodes(...Object.keys(_invalidNodes))
      try {
        await moveFF(handler, parentHandler, targetHandler, handler.name)
      } catch (err) {
      }
      delete _invalidNodes[uid]
      delete _invalidNodes[newUid]
      setInvalidNodes(...Object.keys(_invalidNodes))
    }))

    removeRunningActions(['fileTreeView-move'], false)
  }, [invalidNodes, setInvalidNodes, ffTree, ffHandlers])
  const _copy = useCallback(async (uids: TNodeUid[], names: string[], targetUids: TNodeUid[]) => {
    addRunningActions(['fileTreeView-duplicate'])

    const _invalidNodes = { ...invalidNodes }

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
      const newUid = generateNodeUid(targetUid, name)
      _invalidNodes[uid] = true
      _invalidNodes[newUid] = true
      setInvalidNodes(...Object.keys(_invalidNodes))
      try {
        await moveFF(handler, parentHandler, targetHandler, name, true)
      } catch (err) {
      }
      delete _invalidNodes[uid]
      delete _invalidNodes[newUid]
      setInvalidNodes(...Object.keys(_invalidNodes))
    }))

    removeRunningActions(['fileTreeView-duplicate'], false)
  }, [invalidNodes, setInvalidNodes, ffTree, ffHandlers])
  // -------------------------------------------------------------- folder/file hms --------------------------------------------------------------

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

    if (invalidNodes[uid]) {
      removeRunningActions(['fileTreeView-focus'], false)
      return
    }

    // validate
    if (focusedItem === uid || ffTree[uid] === undefined) {
      removeRunningActions(['fileTreeView-focus'], false)
      return
    }

    dispatch(focusFFNode(uid))

    removeRunningActions(['fileTreeView-focus'])
  }, [invalidNodes, focusedItem, ffTree])
  const cb_selectFFNode = useCallback((uids: TNodeUid[]) => {
    // for key-nav
    addRunningActions(['fileTreeView-select'])

    // validate
    let _uids = [...uids]
    _uids = validateNodeUidCollection(_uids)
    _uids = _uids.filter((_uid) => {
      return !(ffTree[_uid] === undefined || invalidNodes[_uid])
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
  }, [ffTree, invalidNodes, selectedItems, selectedItemsObj])
  const cb_expandFFNode = useCallback((uid: TNodeUid) => {
    // for key-nav
    addRunningActions(['fileTreeView-expand'])

    if (invalidNodes[uid]) {
      removeRunningActions(['fileTreeView-expand'], false)
      return
    }

    // validate
    const node = ffTree[uid]
    if (node === undefined || node.isEntity || expandedItemsObj[uid] === true) {
      removeRunningActions(['fileTreeView-expand'], false)
      return
    }

    dispatch(expandFFNode([uid]))

    removeRunningActions(['fileTreeView-expand'])
  }, [invalidNodes, ffTree, expandedItemsObj])
  const cb_collapseFFNode = useCallback((uid: TNodeUid) => {
    // for key-nav
    addRunningActions(['fileTreeView-collapse'])

    if (invalidNodes[uid]) {
      removeRunningActions(['fileTreeView-collapse'], false)
      return
    }

    // validate
    const node = ffTree[uid]
    if (node === undefined || node.isEntity || expandedItemsObj[uid] === undefined) {
      removeRunningActions(['fileTreeView-collapse'], false)
      return
    }

    dispatch(collapseFFNode([uid]))
    removeRunningActions(['fileTreeView-collapse'])
  }, [invalidNodes, ffTree, expandedItemsObj])

  // creating ff node handle
  const createTmpFFNode = useCallback((ffNodeType: TFileNodeType) => {
    // validate
    const node = ffTree[focusedItem]
    if (node === undefined || node.isEntity) return

    // expand the focusedItem
    node.uid !== RootNodeUid && expandedItemsObj[node.uid] === undefined && dispatch(expandFFNode([node.uid]))

    setTimeout(() => {
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
    }, 0)
  }, [ffTree, focusedItem, expandedItemsObj])

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

    const newUid = generateNodeUid(parentNode.uid, _newName)
    setInvalidNodes(newUid)

    try {
      await moveFF(handler, parentHandler, parentHandler, _newName, false, true)
    } catch (err) {
      addMessage({
        type: 'error',
        content: 'Error occurred while renaming ...',
      })

      removeInvalidNodes(newUid)
      removeRunningActions(['fileTreeView-rename'], false)
      return
    }
    removeInvalidNodes(newUid)

    const action: TFileAction = {
      type: 'rename',
      param1: { uid, parentUid: parentNode.uid },
      param2: { orgName: _orgName, newName: _newName },
    }
    dispatch(setFileAction(action))

    removeRunningActions(['fileTreeView-rename'])
  }, [setInvalidNodes, removeInvalidNodes, ffTree, ffHandlers])

  // dnd fole/file call back - multiple
  const cb_dropFFNode = useCallback(async (uids: TNodeUid[], targetUid: TNodeUid, copy: boolean = false) => {
    // validate
    if (ffTree[targetUid] === undefined) return
    const validatedUids: TNodeUid[] = validateNodeUidCollection(uids, targetUid)
    if (validatedUids.length == 0) return

    addRunningActions(['fileTreeView-move'])

    const _invalidNodes = { ...invalidNodes }

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
      const newUid = generateNodeUid(targetUid, newName)
      _invalidNodes[uid] = true
      _invalidNodes[newUid] = true
      setInvalidNodes(...Object.keys(_invalidNodes))
      try {
        await moveFF(handler, parentHandler, targetHandler, newName, copy)
        _uids.push({ uid, name: newName })
      } catch (err) {
        allDone = false
      }
      delete _invalidNodes[uid]
      delete _invalidNodes[newUid]
      setInvalidNodes(...Object.keys(_invalidNodes))
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
  }, [invalidNodes, setInvalidNodes, ffTree, ffHandlers])




  const cb_readFFNode = useCallback((uid: TNodeUid) => {
    // for key-nav
    addRunningActions(['fileTreeView-read'])

    // if (invalidNodes[uid]) {
    //   removeRunningActions(['fileTreeView-read'], false)
    //   return
    // }

    // validate
    const node = ffTree[uid]
    if (node === undefined || !node.isEntity || file.uid === uid) {
      removeRunningActions(['fileTreeView-read'], false)
      return
    }
    const nodeData = node.data as TFileNodeData
    if (nodeData.type === 'unknown') {
      removeRunningActions(['fileTreeView-read'], false)
      return
    }

    // set redux-file and process
    addRunningActions(['processor-updateOpt'])
    dispatch(setCurrentFile({ uid, content: nodeData.content }))
    setUpdateOpt({ parse: true, from: 'file' })

    removeRunningActions(['fileTreeView-read'])
  }, [/* invalidNodes, */ffTree, file.uid])
  const [initialFileToOpen, setInitialFileToOpen] = useState<TNodeUid>()
  useEffect(() => {
    if (initialFileToOpen && ffTree[initialFileToOpen] !== undefined) {
      setInitialFileToOpen(undefined)

      // focus/select/read the initial file
      addRunningActions(['fileTreeView-focus', 'fileTreeView-select', 'fileTreeView-read'])
      cb_focusFFNode(initialFileToOpen)
      cb_selectFFNode([initialFileToOpen])
      cb_readFFNode(initialFileToOpen)
    }
  }, [initialFileToOpen])
  const clearSession = useCallback(() => {
    dispatch(clearMainState())
    dispatch({ type: HmsClearActionType })
  }, [])
  const onImportProject = useCallback(async (fsType: TFileSystemType = 'local'): Promise<void> => {
    if (fsType === 'local') {
      // open directory picker and get the project directory handle
      let projectHandle: FileSystemHandle
      try {
        projectHandle = await showDirectoryPicker({ _preferPolyfill: false, mode: 'readwrite' } as CustomDirectoryPickerOptions)
      } catch (err) {
        return
      }

      setPending(true)

      // clear session
      clearSession()

      try {
        // configure idb on nohost
        const handlerObj = await configProject(projectHandle as FileSystemDirectoryHandle, osType, () => {
          // sort by ASC directory/file
          Object.keys(handlerObj).map(uid => {
            const handler = handlerObj[uid]
            handler.children = handler.children.sort((a, b) => {
              return handlerObj[a].kind === 'file' && handlerObj[b].kind === 'directory' ? 1 :
                handlerObj[a].kind === 'directory' && handlerObj[b].kind === 'file' ? -1 :
                  handlerObj[a].name > handlerObj[b].name ? 1 : -1
            })
          })

          // get/set the index/first html to be opened by default
          let firstHtmlUid: TNodeUid = '', indexHtmlUid: TNodeUid = ''
          handlerObj[RootNodeUid].children.map(uid => {
            const handler = handlerObj[uid]
            if (handler.kind === 'file' && handler.ext === '.html') {
              firstHtmlUid === '' ? firstHtmlUid = uid : null
              handler.name === 'index' ? indexHtmlUid = uid : null
            }
          })
          setInitialFileToOpen(indexHtmlUid !== '' ? indexHtmlUid : firstHtmlUid !== '' ? firstHtmlUid : undefined)

          // set ff tree
          const treeViewData: TNodeTreeData = {}
          Object.keys(handlerObj).map(uid => {
            const handler = handlerObj[uid] as TFileHandlerInfo

            treeViewData[uid] = {
              uid,
              parentUid: handler.parentUid,
              name: handler.name,
              isEntity: handler.kind === 'file',
              children: handler.children.map(c_uid => String(c_uid)),
              data: {
                valid: true,
                path: handler.path,
                kind: handler.kind,
                name: handler.name,
                ext: handler.ext,
                type: ParsableFileTypes[handler.ext || ''] ? handler.ext?.slice(1) : 'unknown',
                orgContent: handler.content,
                content: handler.content,
                changed: false,
              } as TFileNodeData,
            } as TNode
          })
          setFFTree(treeViewData)

          // set ff handlers
          const ffHandlerObj: TFileHandlerCollection = {}
          Object.keys(handlerObj).map(uid => {
            ffHandlerObj[uid] = handlerObj[uid].handler
          })
          setFFHandlers(ffHandlerObj)

          setPending(false)
        })

      } catch (err) {
        LogAllow && console.log('import project err', err)
      }
    } else if (fsType === '') {
      // do nothing
    }
  }, [clearSession, osType])


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
  }, [currentCommand])

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

    // validate focusedItem and selected uids
    if (invalidNodes[focusedItem]) return
    const uids = clipboardData.uids.filter(uid => !invalidNodes[uid])
    if (uids.length === 0) return

    if (clipboardData.type === 'cut') {
      setClipboardData({ panel: 'file', type: 'cut', uids: [] })
      cb_dropFFNode(uids, focusedItem)
    } else if (clipboardData.type === 'copy') {
      cb_dropFFNode(uids, focusedItem, true)
    }
  }, [invalidNodes, clipboardData, cb_dropFFNode, focusedItem])
  const onDelete = useCallback(async () => {
    // validate selected uids
    const uids = selectedItems.filter(uid => !invalidNodes[uid])
    if (uids.length === 0) return

    // confirm
    const message = `Are you sure you want to delete them?
This action cannot be undone!`
    if (!window.confirm(message)) return

    addRunningActions(['fileTreeView-delete'])
    setInvalidNodes(...uids)

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

    removeInvalidNodes(...uids)
    removeRunningActions(['fileTreeView-delete'], false)
  }, [invalidNodes, setInvalidNodes, removeInvalidNodes, selectedItems, ffTree, ffHandlers])
  const onDuplicate = useCallback(async () => {
    // validate selected uids
    const uids = selectedItems.filter(uid => !invalidNodes[uid])
    if (uids.length === 0) return

    addRunningActions(['fileTreeView-duplicate'])

    const _invalidNodes = { ...invalidNodes }

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
      const newUid = generateNodeUid(getParentNodeUid(uid), newName)
      _invalidNodes[uid] = true
      _invalidNodes[newUid] = true
      setInvalidNodes(...Object.keys(_invalidNodes))
      try {
        await moveFF(handler, parentHandler, parentHandler, newName, true)
        _uids.push({ uid, name: newName })
        _targetUids.push(parentNode.uid)
      } catch (err) {
        allDone = false
      }
      delete _invalidNodes[uid]
      delete _invalidNodes[newUid]
      setInvalidNodes(...Object.keys(_invalidNodes))
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
  }, [invalidNodes, setInvalidNodes, selectedItems, ffTree, ffHandlers])
  const onAddNode = useCallback((actionName: string) => {
    if (actionName.startsWith('AddNode-') === false) return

    const nodeType = actionName.slice(8)

    createTmpFFNode(nodeType === 'folder' ? '*folder' : nodeType as TFileNodeType)
  }, [createTmpFFNode])
  // -------------------------------------------------------------- Cmdk --------------------------------------------------------------

  // -------------------------------------------------------------- other --------------------------------------------------------------
  // panel focus handler
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    setActivePanel('file')
  }, [])

  // panel size handler
  const [panelSize, setPanelSize] = useState(200 / window.innerHeight * 100)
  useEffect(() => {
    const windowResizeHandler = () => {
      setPanelSize(200 / window.innerHeight * 100)
    }
    window.addEventListener('resize', windowResizeHandler)

    return () => window.removeEventListener('resize', windowResizeHandler)
  }, [])
  // -------------------------------------------------------------- other --------------------------------------------------------------

  return <>
    <Panel defaultSize={panelSize} minSize={0}>
      <div
        id="FileTreeView"
        className={cx(
          'scrollable',
        )}
        style={{
          pointerEvents: panelResizing ? 'none' : 'auto',
        }}
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
                  setInvalidNodes(node.uid)
                  props.context.selectItem()
                  props.context.startRenamingItem()
                }
              }, [])

              return <>
                <li
                  className={cx(
                    props.context.isSelected && 'background-secondary',

                    props.context.isDraggingOver && '',
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

                      'outline-default',

                      props.item.index === ffHoveredItem ? 'outline' : '',

                      props.context.isExpanded && props.context.isSelected && 'background-tertiary',
                      !props.context.isExpanded && props.context.isSelected && 'background-secondary',

                      props.context.isSelected && 'outline-none',
                      !props.context.isSelected && props.context.isFocused && 'outline',

                      props.context.isDraggingOver && '',
                      props.context.isDraggingOverParent && '',

                      invalidNodes[props.item.data.uid] && 'opacity-m',
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
                  className='text-s justify-start gap-s'
                  style={{
                    width: "100%",
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}>
                  {props.title}
                  {ffTree[props.item.data.uid] && (ffTree[props.item.data.uid].data as TNormalNodeData).changed &&
                    <div className="radius-s foreground-primary" style={{ width: "6px", height: "6px" }}></div>}
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
                    )}
                    style={{
                      outline: 'none',
                      margin: '0',
                      border: 'none',
                      padding: '0',
                      background: 'transparent',
                    }}
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
            onStartRenamingItem: useCallback(async (item: TreeItem, treeId: string) => {
              if (invalidNodes[item.data.uid]) {
                removeInvalidNodes(item.data.uid)
                return
              }
              setInvalidNodes(item.data.uid)
            }, [invalidNodes, setInvalidNodes, removeInvalidNodes]),
            onAbortRenamingItem: useCallback((item: TreeItem, treeId: string) => {
              if (!item.data.data.valid) {
                const tmpTree = JSON.parse(JSON.stringify(ffTree))
                tmpTree[item.data.parentUid].children = tmpTree[item.data.parentUid].children.filter((c_uid: TNodeUid) => c_uid !== item.data.uid)
                delete tmpTree[item.data.uid]
                setFFTree(tmpTree)
              }

              removeInvalidNodes(item.data.uid)
            }, [ffTree, removeInvalidNodes]),
            onRenameItem: useCallback(async (item: TreeItem, name: string, treeId: string) => {
              if (!invalidNodes[item.data.uid]) return

              if (item.data.data.valid) {
                // confirm changed file before renaming
                const _file = ffTree[item.data.uid]
                if (_file && (ffTree[_file.uid].data as TFileNodeData).changed) {
                  // confirm
                  const message = `Do you want to save the changes you made to ${(ffTree[_file.uid].data as TFileNodeData).name} before renaming?
Your changes will be lost if you don't save them.`
                  if (window.confirm(message)) {
                    await (async () => {
                      setPending(true)

                      // get the current file handler
                      const handler = ffHandlers[_file.uid]
                      if (handler === undefined) {
                        setPending(false)
                        return
                      }

                      // verify permission
                      if (await verifyFileHandlerPermission(handler) === false) {
                        addMessage({
                          type: 'error',
                          content: 'save failed cause of invalid handler',
                        })
                        setPending(false)
                        return
                      }

                      // update file content
                      try {
                        const writableStream = await (handler as FileSystemFileHandle).createWritable()
                        await writableStream.write((ffTree[_file.uid].data as TFileNodeData).content)
                        await writableStream.close()

                        addMessage({
                          type: 'success',
                          content: 'Saved successfully',
                        })

                        // update context files store
                        // setOpenedFiles({ ..._file, orgContent: _file.content, changed: false })
                      } catch (err) {
                        addMessage({
                          type: 'error',
                          content: 'error occurred while saving',
                        })
                      }

                      setPending(false)
                    })()
                  }
                }

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
              removeInvalidNodes(item.data.uid)
            }, [invalidNodes, cb_renameFFNode, createFFNode, setTemporaryNodes, removeTemporaryNodes, removeInvalidNodes, ffTree, osType, ffHandlers]),

            /* SELECT, FOCUS, EXPAND, COLLAPSE CALLBACK */
            onSelectItems: useCallback((items: TreeItemIndex[], treeId: string) => {
              cb_selectFFNode(items as TNodeUid[])
            }, [cb_selectFFNode]),
            onFocusItem: useCallback((item: TreeItem, treeId: string) => {
              cb_focusFFNode(item.index as TNodeUid)
            }, [cb_focusFFNode]),
            onExpandItem: useCallback((item: TreeItem, treeId: string) => {
              cb_expandFFNode(item.index as TNodeUid)
            }, [cb_expandFFNode]),
            onCollapseItem: useCallback((item: TreeItem, treeId: string) => {
              cb_collapseFFNode(item.index as TNodeUid)
            }, [cb_collapseFFNode]),

            /* READ CALLBACK */
            onPrimaryAction: useCallback((item: TreeItem, treeId: string) => {
              item.data.data.valid ? cb_readFFNode(item.index as TNodeUid) : removeRunningActions(['fileTreeView-read'], false)
            }, [cb_readFFNode]),

            // DnD CALLBACK
            onDrop: useCallback((items: TreeItem[], target: DraggingPosition) => {
              const targetUid: TNodeUid = (target as DraggingPositionItem).targetItem as TNodeUid
              const uids: TNodeUid[] = items.map(item => item.index as TNodeUid).filter(uid => !invalidNodes[uid])
              if (invalidNodes[targetUid]) return
              if (uids.length === 0) return

              cb_dropFFNode(uids, targetUid)
            }, [invalidNodes, cb_dropFFNode])
          }}
        />
      </div>
    </Panel>
  </>
}
