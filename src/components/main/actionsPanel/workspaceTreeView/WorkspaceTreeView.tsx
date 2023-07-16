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
  DraggingPositionItem,
  TreeItem,
} from 'react-complex-tree';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import {
  SVGIconI,
  SVGIconII,
  TreeView,
} from '@_components/common';
import { TreeViewData } from '@_components/common/treeView/types';
import {
  AddFileActionPrefix,
  DefaultProjectPath,
  HmsClearActionType,
  LogAllow,
  ParsableFileTypes,
  RootNodeUid,
  TmpNodeUid,
} from '@_constants/main';
import { getValidNodeUids } from '@_node/apis';
import {
  _path,
  createDirectory,
  getNormalizedPath,
  getStat,
  readDir,
  readFile,
  reloadIDBProject,
  reloadLocalProject,
  removeFileSystem,
  TFileHandlerCollection,
  TFileNodeData,
  TFilesReference,
  writeFile,
} from '@_node/file';
import {
  TNode,
  TNodeTreeData,
  TNodeUid,
  TNormalNodeData,
} from '@_node/types';
import {
  collapseFFNode,
  expandFFNode,
  ffSelector,
  focusFFNode,
  globalSelector,
  hmsInfoSelector,
  MainContext,
  navigatorSelector,
  removeCurrentFile,
  selectFFNode,
  setCurrentFile,
  setFileAction,
  updateFFTreeViewState,
} from '@_redux/main';
import {
  addClass,
  generateQuerySelector,
  removeClass,
  verifyFileHandlerPermission,
} from '@_services/main';
import {
  TFileAction,
  TFileNodeType,
} from '@_types/main';

import { WorkspaceTreeViewProps } from './types';

const AutoExpandDelay = 1 * 1000
export default function WorkspaceTreeView(props: WorkspaceTreeViewProps) {
  const dispatch = useDispatch()
  // -------------------------------------------------------------- global state --------------------------------------------------------------
  const { file } = useSelector(navigatorSelector)
  const { fileAction } = useSelector(globalSelector)
  const { futureLength, pastLength } = useSelector(hmsInfoSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(ffSelector)
  const {
    // global action
    addRunningActions, removeRunningActions,
    // navigator
    workspace,
    project,
    navigatorDropDownType, setNavigatorDropDownType,
    // node actions
    activePanel, setActivePanel,
    clipboardData, setClipboardData,
    event, setEvent,
    // actions panel
    showActionsPanel,
    // file tree view
    initialFileToOpen, setInitialFileToOpen,
    fsPending, setFSPending,
    ffTree, setFFTree, setFFNode,
    ffHandlers, setFFHandlers,
    ffHoveredItem, setFFHoveredItem,
    isHms, setIsHms,
    ffAction, setFFAction,
    currentFileUid, setCurrentFileUid,
    // node tree view
    fnHoveredItem, setFNHoveredItem,
    nodeTree, setNodeTree,
    validNodeTree, setValidNodeTree,
    nodeMaxUid, setNodeMaxUid,
    // stage view
    iframeLoading, setIFrameLoading,
    iframeSrc, setIFrameSrc,
    fileInfo, setFileInfo,
    needToReloadIFrame, setNeedToReloadIFrame,
    linkToOpen, setLinkToOpen,
    // code view
    codeEditing, setCodeEditing,
    codeChanges, setCodeChanges,
    tabSize, setTabSize,
    newFocusedNodeUid, setNewFocusedNodeUid,
    showCodeView, setShowCodeView,
    // processor
    updateOpt, setUpdateOpt,
    // references
    filesReferenceData, htmlReferenceData, cmdkReferenceData,
    // cmdk
    currentCommand, setCurrentCommand,
    cmdkOpen, setCmdkOpen,
    cmdkPages, setCmdkPages, cmdkPage,
    // other
    osType,
    theme,
    // toasts
    addMessage, removeMessage,

    // non-parse file
    parseFileFlag, setParseFile,
    prevFileUid, setPrevFileUid
  } = useContext(MainContext)
  // -------------------------------------------------------------- node status --------------------------------------------------------------
  //  invalid - can't do any actions on the nodes
  const [invalidNodes, _setInvalidNodes] = useState<{ [uid: TNodeUid]: boolean }>({})
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
  // temporary - don't display the nodes
  const [temporaryNodes, _setTemporaryNodes] = useState<{ [uid: TNodeUid]: boolean }>({})
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
  // -------------------------------------------------------------- project load cb for side effect --------------------------------------------------------------
  const ffTreeRef = useRef<TNodeTreeData>({})
  const cb_reloadProject = useCallback(async (_uid?: TNodeUid) => {
    const treeViewData: TNodeTreeData = {}
    const ffHandlerObj: TFileHandlerCollection = {}
    let _deletedUids: TNodeUid[] = []

    if (project.context === 'local') {
      try {
        const { handlerObj, deletedUids } = await reloadLocalProject(ffHandlers[RootNodeUid] as FileSystemDirectoryHandle, ffTree, osType)
        _deletedUids = deletedUids

        // sort by ASC directory/file
        Object.keys(handlerObj).map(uid => {
          const handler = handlerObj[uid]
          handler.children = handler.children.sort((a, b) => {
            return handlerObj[a].kind === 'file' && handlerObj[b].kind === 'directory' ? 1 :
              handlerObj[a].kind === 'directory' && handlerObj[b].kind === 'file' ? -1 :
                handlerObj[a].name > handlerObj[b].name ? 1 : -1
          })
        })

        // set ff-tree, ff-handlers
        Object.keys(handlerObj).map(uid => {
          const { parentUid, children, path, kind, name, ext, content, handler } = handlerObj[uid]
          const type = ParsableFileTypes[ext || ''] ? ext?.slice(1) : 'unknown'
          treeViewData[uid] = {
            uid,
            parentUid: parentUid,
            name: name,
            isEntity: kind === 'file',
            children: [...children],
            data: {
              valid: true,
              path: path,
              kind: kind,
              name: name,
              ext: ext,
              type,
              orgContent: type !== 'unknown' ? (ffTree[uid] ? (ffTree[uid].data as TFileNodeData).orgContent : content?.toString()) : '',
              content: type !== 'unknown' ? (ffTree[uid] ? (ffTree[uid].data as TFileNodeData).content : content?.toString()) : '',
              changed: ffTree[uid] ? (ffTree[uid].data as TFileNodeData).changed : false,
            } as TFileNodeData,
          } as TNode

          ffHandlerObj[uid] = handler
        })
      } catch (err) {
        LogAllow && console.log('failed to reload local project')
      }
    } else if (project.context === 'idb') {
      try {
        const { handlerObj, deletedUids } = await reloadIDBProject(DefaultProjectPath, ffTree)
        _deletedUids = deletedUids

        // sort by ASC directory/file
        Object.keys(handlerObj).map(uid => {
          const handler = handlerObj[uid]
          handler.children = handler.children.sort((a, b) => {
            return handlerObj[a].kind === 'file' && handlerObj[b].kind === 'directory' ? 1 :
              handlerObj[a].kind === 'directory' && handlerObj[b].kind === 'file' ? -1 :
                handlerObj[a].name > handlerObj[b].name ? 1 : -1
          })
        })

        // set ff-tree, ff-handlers
        Object.keys(handlerObj).map(uid => {
          const { parentUid, children, path, kind, name, ext, content } = handlerObj[uid]
          const type = ParsableFileTypes[ext || ''] ? ext?.slice(1) : 'unknown'
          treeViewData[uid] = {
            uid,
            parentUid: parentUid,
            name: name,
            isEntity: kind === 'file',
            children: [...children],
            data: {
              valid: true,
              path: path,
              kind: kind,
              name: name,
              ext: ext,
              type,
              orgContent: type !== 'unknown' ? content?.toString() : '',
              content: type !== 'unknown' ? content?.toString() : '',
              changed: false,
            } as TFileNodeData,
          } as TNode
        })
      } catch (err) {
        LogAllow && console.log('failed to reload welcome project')
      }
    }

    dispatch(updateFFTreeViewState({ deletedUids: _deletedUids }))
    if (_uid && !treeViewData[_uid]) {
      setIFrameSrc(null)
      setNodeTree({})
      setValidNodeTree({})
      setCurrentFileUid('')
      dispatch(removeCurrentFile())
    }
    ffTreeRef.current = treeViewData
    setFFTree(treeViewData)
    setFFHandlers(ffHandlerObj)
  }, [project.context, ffHandlers, ffTree, osType])
  // -------------------------------------------------------------- hms --------------------------------------------------------------
  useEffect(() => {
    if (isHms === null) return

    // isHms === true ? undo : redo
    if (isHms === true) {
      const { type, param1, param2 } = fileAction
      if (type === 'create') {
        _delete([param1])
      } else if (type === 'rename') {
        const { uid, parentUid } = param1
        const { orgName, newName } = param2
        const currentUid = `${parentUid}/${newName}`;
        (async () => {
          setTemporaryNodes(currentUid)
          await _rename(currentUid, orgName)
          removeTemporaryNodes(currentUid)
        })()
      } else if (type === 'cut') {
        const _uids: { uid: TNodeUid, parentUid: TNodeUid, name: string }[] = param1
        const _targetUids: TNodeUid[] = param2

        const uids: TNodeUid[] = []
        const targetUids: TNodeUid[] = []

        _targetUids.map((targetUid, index) => {
          const { uid, parentUid, name } = _uids[index]
          uids.push(`${targetUid}/${name}`)
          targetUids.push(parentUid)
        })
        _cut(uids, targetUids)
      } else if (type === 'copy') {
        const _uids: { uid: TNodeUid, name: string }[] = param1
        const _targetUids: TNodeUid[] = param2

        const uids: TNodeUid[] = []
        _targetUids.map((targetUid, index) => {
          const { uid, name } = _uids[index]
          uids.push(`${targetUid}/${name}`)
        })
        _delete(uids)
      } else if (type === 'delete') {
      }
    } else {
      const { type, param1, param2 } = ffAction
      if (type === 'create') {
        _create(param2)
      } else if (type === 'rename') {
        const { uid, parentUid } = param1
        const { orgName, newName } = param2;
        (async () => {
          setTemporaryNodes(uid)
          await _rename(uid, newName)
          removeTemporaryNodes(uid)
        })()
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
  }, [isHms])
  const _create = useCallback(async (params: { parentUid: TNodeUid, name: string, type: TFileNodeType }) => {
    addRunningActions(['fileTreeView-create'])

    const { parentUid, name, type } = params
    try {
      // validate
      const parentNode = ffTree[parentUid]
      if (parentNode === undefined) throw 'error'
      const parentNodeData = parentNode.data as TFileNodeData

      if (project.context === 'local') {
        // verify handler permission
        const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
        if (!(await verifyFileHandlerPermission(parentHandler))) throw 'error'

        // create
        if (type === '*folder') {
          await parentHandler.getDirectoryHandle(name, { create: true })
        } else { // file
          await parentHandler.getFileHandle(name, { create: true })
        }
      } else if (project.context === 'idb') {
        // create
        if (type === '*folder') {
          await createDirectory(`${parentNodeData.path}/${name}`)
        } else {
          await writeFile(`${parentNodeData.path}/${name}`, '')
        }
      }
    } catch (err) {
    }

    await cb_reloadProject()
    removeRunningActions(['fileTreeView-create'], false)
  }, [addRunningActions, removeRunningActions, project.context, ffTree, ffHandlers, cb_reloadProject])
  const _delete = useCallback(async (uids: TNodeUid[]) => {
    addRunningActions(['fileTreeView-delete'])
    setInvalidNodes(...uids)

    await Promise.all(
      uids.map(async (uid) => {
        try {
          // validate
          const node = ffTree[uid]
          if (node === undefined) throw 'error'
          const nodeData = node.data as TFileNodeData
          const parentNode = ffTree[node.parentUid as TNodeUid]
          if (parentNode === undefined) throw 'error'
          const parentNodeData = parentNode.data as TFileNodeData

          if (project.context === 'local') {
            const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
            if (!(await verifyFileHandlerPermission(parentHandler))) throw 'error'

            // delete
            try {
              const entryName = nodeData.kind === 'directory' ? nodeData.name : `${nodeData.name}${nodeData.ext}`
              await parentHandler.removeEntry(entryName, { recursive: true })
            } catch (err) {
            }
          } else if (project.context === 'idb') {
            // delete
            try {
              const entryName = nodeData.kind === 'directory' ? nodeData.name : `${nodeData.name}${nodeData.ext}`
              await removeFileSystem(`${parentNodeData.path}/${entryName}`)
            } catch (err) {
            }
          }
        } catch (err) {
        }
      })
    )

    removeInvalidNodes(...uids)
    await cb_reloadProject()
    removeRunningActions(['fileTreeView-delete'], false)
  }, [addRunningActions, removeRunningActions, project.context, setInvalidNodes, removeInvalidNodes, ffTree, ffHandlers, cb_reloadProject])
  const _rename = useCallback(async (uid: TNodeUid, newName: string) => {
    addRunningActions(['fileTreeView-rename'])

    try {
      // validate
      const node = ffTree[uid]
      if (node === undefined || node.name === newName) throw 'error'
      const nodeData = node.data as TFileNodeData
      const parentNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) throw 'error'
      const parentNodeData = parentNode.data as TFileNodeData

      const newUid = `${parentNode.uid}/${newName}`
      setTemporaryNodes(uid)
      setInvalidNodes(newUid)

      if (project.context === 'local') {
        const handler = ffHandlers[uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
        if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler))) throw 'error'

        await moveLocalFF(handler, parentHandler, parentHandler, newName)
      } else if (project.context === 'idb') {
        await moveIDBFF(nodeData, parentNodeData, newName)
      }

      removeInvalidNodes(newUid)
      removeTemporaryNodes(uid)
    } catch (err) {
    }

    await cb_reloadProject()
    removeRunningActions(['fileTreeView-rename'], false)
  }, [addRunningActions, removeRunningActions, project.context, setTemporaryNodes, removeTemporaryNodes, setInvalidNodes, removeInvalidNodes, ffTree, ffHandlers, cb_reloadProject])
  const _cut = useCallback(async (uids: TNodeUid[], targetUids: TNodeUid[]) => {
    addRunningActions(['fileTreeView-move'])

    const _invalidNodes = { ...invalidNodes }

    await Promise.all(uids.map(async (uid, index) => {
      const targetUid = targetUids[index]

      // validate
      const node = ffTree[uid]
      if (node === undefined) return
      const nodeData = node.data as TFileNodeData
      const parentNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) return
      const targetNode = ffTree[targetUid]
      if (targetNode === undefined) return
      const targetNodeData = targetNode.data as TFileNodeData

      const newUid = `${targetUid}/${nodeData.name}`
      _invalidNodes[uid] = true
      _invalidNodes[newUid] = true
      setInvalidNodes(...Object.keys(_invalidNodes))

      if (project.context === 'local') {
        const handler = ffHandlers[uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle, targetHandler = ffHandlers[targetUid] as FileSystemDirectoryHandle
        if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler)) || !(await verifyFileHandlerPermission(targetHandler))) return

        try {
          await moveLocalFF(handler, parentHandler, targetHandler, nodeData.name)
        } catch (err) {
        }
      } else if (project.context === 'idb') {
        await moveIDBFF(nodeData, targetNodeData, nodeData.name)
      }

      delete _invalidNodes[uid]
      delete _invalidNodes[newUid]
      setInvalidNodes(...Object.keys(_invalidNodes))
    }))

    await cb_reloadProject()
    removeRunningActions(['fileTreeView-move'], false)
  }, [addRunningActions, removeRunningActions, project.context, invalidNodes, setInvalidNodes, ffTree, ffHandlers, cb_reloadProject])
  const _copy = useCallback(async (uids: TNodeUid[], names: string[], targetUids: TNodeUid[]) => {
    addRunningActions(['fileTreeView-duplicate'])

    const _invalidNodes = { ...invalidNodes }

    await Promise.all(uids.map(async (uid, index) => {
      const name = names[index]
      const targetUid = targetUids[index]

      // validate
      const node = ffTree[uid]
      if (node === undefined) return
      const nodeData = node.data as TFileNodeData
      const parentNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) return
      const targetNode = ffTree[targetUid]
      if (targetNode === undefined) return
      const targetNodeData = targetNode.data as TFileNodeData

      const newUid = `${targetUid}/${name}`
      _invalidNodes[uid] = true
      _invalidNodes[newUid] = true
      setInvalidNodes(...Object.keys(_invalidNodes))

      if (project.context === 'local') {
        const handler = ffHandlers[uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle, targetHandler = ffHandlers[targetUid] as FileSystemDirectoryHandle
        if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler)) || !(await verifyFileHandlerPermission(targetHandler))) return

        try {
          await moveLocalFF(handler, parentHandler, targetHandler, name, true)
        } catch (err) {
        }
      } else if (project.context === 'idb') {
        await moveIDBFF(nodeData, targetNodeData, nodeData.name, true)
      }

      delete _invalidNodes[uid]
      delete _invalidNodes[newUid]
      setInvalidNodes(...Object.keys(_invalidNodes))
    }))

    await cb_reloadProject()
    removeRunningActions(['fileTreeView-duplicate'], false)
  }, [addRunningActions, removeRunningActions, project.context, invalidNodes, setInvalidNodes, ffTree, ffHandlers, cb_reloadProject])
  // -------------------------------------------------------------- sync --------------------------------------------------------------
  // outline the hovered item
  const hoveredItemRef = useRef<TNodeUid>(ffHoveredItem)
  useEffect(() => {
    if (hoveredItemRef.current === ffHoveredItem) return

    const curHoveredElement = document.querySelector(`#FileTreeView-${generateQuerySelector(hoveredItemRef.current)}`)
    curHoveredElement?.setAttribute('class', removeClass(curHoveredElement.getAttribute('class') || '', 'outline'))
    const newHoveredElement = document.querySelector(`#FileTreeView-${generateQuerySelector(ffHoveredItem)}`)
    newHoveredElement?.setAttribute('class', addClass(newHoveredElement.getAttribute('class') || '', 'outline'))

    hoveredItemRef.current = ffHoveredItem
  }, [ffHoveredItem])
  // scroll to the focused item
  const focusedItemRef = useRef<TNodeUid>(focusedItem)
  useEffect(() => {
    if (focusedItemRef.current === focusedItem) return

    const focusedElement = document.querySelector(`#FileTreeView-${generateQuerySelector(focusedItem)}`)
    setTimeout(() => focusedElement?.scrollIntoView({ block: 'nearest', inline: 'start', behavior: 'auto' }), 30)

    focusedItemRef.current = focusedItem
  }, [focusedItem])
  // build fileTreeViewData
  const fileTreeViewData = useMemo(() => {
    const data: TreeViewData = {}
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
  // -------------------------------------------------------------- node view state handlers --------------------------------------------------------------
  const cb_focusNode = useCallback((uid: TNodeUid) => {
    // validate
    if (invalidNodes[uid] || focusedItem === uid || ffTree[uid] === undefined) {
      removeRunningActions(['fileTreeView-focus'], false)
      return
    }

    addRunningActions(['fileTreeView-focus'])
    dispatch(focusFFNode(uid))
    removeRunningActions(['fileTreeView-focus'])
  }, [addRunningActions, removeRunningActions, invalidNodes, focusedItem, ffTree])
  const cb_selectNode = useCallback((uids: TNodeUid[]) => {
    // validate
    let _uids = [...uids]
    _uids = _uids.filter((_uid) => {
      return !(ffTree[_uid] === undefined)
    })
    if (_uids.length === 0) {
      removeRunningActions(['fileTreeView-select'], false)
      return
    }
    _uids = getValidNodeUids(ffTree, _uids)
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
    if (project && file) {
      // remove exist script
      const exist = document.head.querySelector('#custom-plausible')
      if (exist !== null) {
        document.head.removeChild(exist)
      }
      // plausible analytics 
      var script = document.createElement('script')
      script.id = 'custom-plausible'
      script.textContent = `
        plausible('pageview', { u: '` + "rnbw.dev/" + project.name + "/" + file.uid.replace('ROOT/', '') +`' + window.location.search });
      `
      document.head.appendChild(script)
    }
    addRunningActions(['fileTreeView-select'])
    dispatch(selectFFNode(_uids))
    removeRunningActions(['fileTreeView-select'])
  }, [addRunningActions, removeRunningActions, ffTree, invalidNodes, selectedItems, selectedItemsObj])
  const cb_expandNode = useCallback((uid: TNodeUid) => {
    // validate
    if (invalidNodes[uid] || ffTree[uid] === undefined || ffTree[uid].isEntity || expandedItemsObj[uid]) {
      removeRunningActions(['fileTreeView-expand'], false)
      return
    }

    addRunningActions(['fileTreeView-expand'])
    dispatch(expandFFNode([uid]))
    removeRunningActions(['fileTreeView-expand'])
  }, [addRunningActions, removeRunningActions, invalidNodes, ffTree, expandedItemsObj])
  const cb_collapseNode = useCallback((uid: TNodeUid) => {
    // validate
    if (invalidNodes[uid] || ffTree[uid] === undefined || ffTree[uid].isEntity || !expandedItemsObj[uid]) {
      removeRunningActions(['fileTreeView-collapse'], false)
      return
    }

    addRunningActions(['fileTreeView-collapse'])
    dispatch(collapseFFNode([uid]))
    removeRunningActions(['fileTreeView-collapse'])
  }, [addRunningActions, removeRunningActions, invalidNodes, ffTree, expandedItemsObj])
  // -------------------------------------------------------------- project --------------------------------------------------------------
  // open default initial html file
  useEffect(() => {
    if (initialFileToOpen !== '' && ffTree[initialFileToOpen] !== undefined) {
      setInitialFileToOpen('')
      // focus/select/read the initial file
      addRunningActions(['fileTreeView-focus', 'fileTreeView-select', 'fileTreeView-read'])
      cb_focusNode(initialFileToOpen)
      cb_selectNode([initialFileToOpen])
      cb_readNode(initialFileToOpen)
      if (project && file) {
        // remove exist script
        const exist = document.head.querySelector('#custom-plausible')
        if (exist !== null) {
          document.head.removeChild(exist)
        }
        // plausible analytics 
        var script = document.createElement('script')
        script.id = 'custom-plausible'
        script.textContent = `
          plausible('pageview', { u: '` + "rnbw.dev/" + project.name + "/" + file.uid.replace('ROOT/', '') +`' + window.location.search });
        `
        document.head.appendChild(script)
      }
    }
  }, [initialFileToOpen])
  // -------------------------------------------------------------- node actions handlers --------------------------------------------------------------
  const moveLocalFF = async (handler: FileSystemHandle, parentHandler: FileSystemDirectoryHandle, targetHandler: FileSystemDirectoryHandle, newName: string, copy: boolean = false, showWarning: boolean = false) => {
    if (handler.kind === 'directory') {
      // validate if the new name exists
      let exists = true
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
        const newDirHandlers = [newHandler]
        const dirHandlers = [handler as FileSystemDirectoryHandle]
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
      let exists = true
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
        const writableStream = await newFile.createWritable()
        await writableStream.write(content)
        await writableStream.close()

        // handle copy(optional)
        !copy && await parentHandler.removeEntry(handler.name, { recursive: true })
      } catch (err) {
        throw 'error'
      }
    }
  }
  const moveIDBFF = async (nodeData: TFileNodeData, targetNodeData: TFileNodeData, newName: string, copy: boolean = false, showWarning: boolean = false) => {
    if (nodeData.kind === 'directory') {
      // validate if the new name exists
      let exists = true
      try {
        await getStat(`${targetNodeData.path}/${newName}`)
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
        const dirs = [{ orgPath: nodeData.path, newPath: `${targetNodeData.path}/${newName}` }]
        while (dirs.length) {
          const { orgPath, newPath } = dirs.shift() as {
            orgPath: string,
            newPath: string,
          }
          await createDirectory(newPath)

          const entries = await readDir(orgPath)
          await Promise.all(entries.map(async (entry) => {
            const c_orgPath = `${orgPath}/${entry}`
            const c_newPath = `${newPath}/${entry}`
            const stats = await getStat(c_orgPath)
            const c_kind = stats.type === 'DIRECTORY' ? 'directory' : 'file'
            if (c_kind === 'directory') {
              dirs.push({ orgPath: c_orgPath, newPath: c_newPath })
            } else {
              await writeFile(c_newPath, await readFile(c_orgPath))
            }
          }))
        }

        // handle copy(optional)
        !copy && await removeFileSystem(nodeData.path)
      } catch (err) {
        throw 'error'
      }
    } else {
      // validate if the new name exists
      let exists = true
      try {
        await getStat(`${targetNodeData.path}/${newName}`)
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
        await writeFile(`${targetNodeData.path}/${newName}`, await readFile(nodeData.path))

        // handle copy(optional)
        !copy && await removeFileSystem(nodeData.path)
      } catch (err) {
        throw 'error'
      }
    }
  }

  const createFFNode = useCallback(async (parentUid: TNodeUid, ffType: TFileNodeType, ffName: string) => {
    addRunningActions(['fileTreeView-create'])

    let newName: string = ''

    if (project.context === 'local') {
      // validate
      const parentHandler = ffHandlers[parentUid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(parentHandler))) {
        addMessage({
          type: 'error',
          content: `Invalid target directory. Check if you have "write" permission for the directory.`,
        })
        removeRunningActions(['fileTreeView-create'], false)
        return
      }

      if (ffType === '*folder') {
        // generate new folder name - ex: {aaa - copy}...
        let folderName = ffName
        let exists = true
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
        let fileName = `${ffName}.${ffType}`
        let exists = true
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
    } else if (project.context === 'idb') {
      const parentNode = ffTree[parentUid]
      const parentNodeData = parentNode.data as TFileNodeData
      if (ffType === '*folder') {
        // generate new folder name - ex: {aaa - copy}...
        let folderName = ''
        let exists = true
        try {
          folderName = ffName
          await getStat(`${parentNodeData.path}/${folderName}`)
          exists = true
        } catch (err) {
          exists = false
        }
        if (exists) {
          let index = 0
          while (exists) {
            try {
              folderName = `${ffName} (${++index})`
              await getStat(`${parentNodeData.path}/${folderName}`)
              exists = true
            } catch (err) {
              exists = false
            }
          }
        }
        newName = folderName

        // create the directory with generated name
        try {
          await createDirectory(`${parentNodeData.path}/${folderName}`)
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
        let fileName = ''
        let exists = true
        try {
          fileName = `${ffName}.${ffType}`
          await getStat(`${parentNodeData.path}/${fileName}`)
          exists = true
        } catch (err) {
          exists = false
        }
        if (exists) {
          let index = 0
          while (exists) {
            try {
              fileName = `${ffName} (${++index}).${ffType}`
              await getStat(`${parentNodeData.path}/${fileName}`)
              exists = true
            } catch (err) {
              exists = false
            }
          }
        }
        newName = fileName

        // create the file with generated name
        try {
          await writeFile(`${parentNodeData.path}/${fileName}`, '')   
        } catch (err) {
          addMessage({
            type: 'error',
            content: 'Error occurred while creating a new file.',
          })
          removeRunningActions(['fileTreeView-create'], false)
          return
        }
      }
    }

    const action: TFileAction = {
      type: 'create',
      param1: `${parentUid}/${newName}`,
      param2: { parentUid, name: newName, type: ffType },
    }
    dispatch(setFileAction(action))

    await cb_reloadProject()
    removeRunningActions(['fileTreeView-create'])
  }, [addRunningActions, removeRunningActions, project.context, ffHandlers, cb_reloadProject])

  const openFileUid = useRef<TNodeUid>('')
  const createTmpFFNode = useCallback(async (ffNodeType: TFileNodeType) => {
    const tmpTree = JSON.parse(JSON.stringify(ffTree)) as TNodeTreeData

    // validate
    let node = tmpTree[focusedItem]
    if (node === undefined) return
    if (node.isEntity) {
      node = tmpTree[node.parentUid as TNodeUid]
    }

    // expand the focusedItem
    node.uid !== RootNodeUid && expandedItemsObj[node.uid] === undefined && dispatch(expandFFNode([node.uid]))

    // add tmp node
    const tmpNode: TNode = {
      uid: `${node.uid}/${TmpNodeUid}`,
      parentUid: node.uid,
      name: ffNodeType === '*folder' ? 'Untitled' : ffNodeType === 'html' ? 'Untitled' : 'Untitled',
      isEntity: ffNodeType !== '*folder',
      children: [],
      data: {
        valid: false,
        type: ffNodeType,
      },
    }

    node.children.unshift(tmpNode.uid)
    tmpTree[tmpNode.uid] = tmpNode
    // setFFTree(tmpTree)

    setInvalidNodes(tmpNode.uid)
    await createFFNode(node.uid as TNodeUid, tmpNode.data.type, tmpNode.name)
    removeInvalidNodes(tmpNode.uid)
    setNavigatorDropDownType('project')
    
    if (ffNodeType !== '*folder'){
      openFileUid.current = `${node.uid}/${tmpNode.name}.${ffNodeType}`
      setCurrentFileUid(openFileUid.current)
    }
  }, [ffTree, focusedItem, expandedItemsObj, setInvalidNodes, createFFNode, setNavigatorDropDownType, removeInvalidNodes, setFFTree])
  useEffect(() => {
    if (ffTree[openFileUid.current] !== undefined && currentFileUid === openFileUid.current) {
      openFile(openFileUid.current)
    }
  }, [ffTree, currentFileUid])
  const cb_startRenamingNode = useCallback((uid: TNodeUid) => {
    // validate
    if (invalidNodes[uid]) {
      removeInvalidNodes(uid)
      return
    }
    setInvalidNodes(uid)
  }, [invalidNodes, setInvalidNodes, removeInvalidNodes])
  const cb_abortRenamingNode = useCallback((item: TreeItem) => {
    const node = item.data as TNode
    const nodeData = node.data as TFileNodeData
    if (!nodeData.valid) {
      const tmpTree = JSON.parse(JSON.stringify(ffTree))
      tmpTree[node.parentUid as TNodeUid].children = tmpTree[node.parentUid as TNodeUid].children.filter((c_uid: TNodeUid) => c_uid !== node.uid)
      delete tmpTree[item.data.uid]
      setFFTree(tmpTree)
    }
    removeInvalidNodes(node.uid)
  }, [ffTree, removeInvalidNodes])
  const _cb_renameNode = useCallback(async (uid: TNodeUid, newName: string, ext: string) => {
    // validate
    const node = ffTree[uid]
    if (node === undefined || node.name === newName) return
    const nodeData = node.data as TFileNodeData
    const parentNode = ffTree[node.parentUid as TNodeUid]
    if (parentNode === undefined) return
    const parentNodeData = parentNode.data as TFileNodeData

    addRunningActions(['fileTreeView-rename'])

    const _orgName = ext === '*folder' ? `${nodeData.name}` : `${nodeData.name}${nodeData.ext}`
    const _newName = ext === '*folder' ? `${newName}` : `${newName}${ext}`
    const newUid = `${parentNode.uid}/${_newName}`

    if (project.context === 'local') {
      // verify handler permission
      const handler = ffHandlers[uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler))) {
        addMessage({
          type: 'error',
          content: `Invalid directory/file. Check if you have "write" permission for the directory/file.`,
        })

        removeRunningActions(['fileTreeView-rename'], false)
        return
      }

      setInvalidNodes(newUid)

      try {
        await moveLocalFF(handler, parentHandler, parentHandler, _newName, false, true)
        removeInvalidNodes(newUid)
      } catch (err) {
        addMessage({
          type: 'error',
          content: 'Error occurred while renaming ...',
        })

        removeInvalidNodes(newUid)
        removeRunningActions(['fileTreeView-rename'], false)
        return
      }
    } else if (project.context === 'idb') {
      setInvalidNodes(newUid)

      try {
        await moveIDBFF(nodeData, parentNodeData, _newName, false, true)
        removeInvalidNodes(newUid)
      } catch (err) {
        addMessage({
          type: 'error',
          content: 'Error occurred while renaming ...',
        })

        removeInvalidNodes(newUid)
        removeRunningActions(['fileTreeView-rename'], false)
        return
      }
    }

    const action: TFileAction = {
      type: 'rename',
      param1: { uid, parentUid: parentNode.uid },
      param2: { orgName: _orgName, newName: _newName },
    }
    dispatch(setFileAction(action))

    // update redux
    dispatch(setCurrentFile({ uid: newUid, parentUid: parentNode.uid, name: nodeData.name, content: nodeData.contentInApp as string }))
    dispatch(updateFFTreeViewState({ convertedUids: [[uid, newUid]] }))

    await cb_reloadProject()
    removeRunningActions(['fileTreeView-rename'])
  }, [addRunningActions, removeRunningActions, project.context, setInvalidNodes, removeInvalidNodes, ffTree, ffHandlers, cb_reloadProject])
  const cb_renameNode = useCallback(async (item: TreeItem, newName: string) => {
    const node = item.data as TNode
    const nodeData = node.data as TNormalNodeData
    if (!invalidNodes[node.uid]) return

    if (nodeData.valid) {
      const _file = ffTree[node.uid]
      const _fileData = _file.data as TFileNodeData

      if (_file && _fileData.changed) {
        // confirm
        const message = `Your changes will be lost if you don't save them. Are you sure you want to continue without saving?`
        if (!window.confirm(message)) {
          removeInvalidNodes(node.uid)
          return
        }
      }

      setTemporaryNodes(_file.uid)
      await _cb_renameNode(_file.uid, newName, _fileData.kind === 'directory' ? '*folder' : _fileData.ext)
      removeTemporaryNodes(_file.uid)
    } else {
      await createFFNode(node.parentUid as TNodeUid, nodeData.type, newName)
    }
    removeInvalidNodes(node.uid)
  }, [invalidNodes, _cb_renameNode, setTemporaryNodes, removeTemporaryNodes, ffTree, ffHandlers, osType, createFFNode, removeInvalidNodes])

  const cb_deleteNode = useCallback(async () => {
    // validate
    const uids = selectedItems.filter(uid => !invalidNodes[uid])
    if (uids.length === 0) return

    // confirm msgbox
    const message = `Are you sure you want to delete them? This action cannot be undone!`
    if (!window.confirm(message)) return

    addRunningActions(['fileTreeView-delete'])
    setInvalidNodes(...uids)

    if (project.context === 'local') {
      let allDone = true
      await Promise.all(uids.map(async (uid) => {
        // validate
        const node = ffTree[uid]
        if (node === undefined) {
          allDone = false
          return
        }
        const nodeData = node.data as TFileNodeData
        const parentNode = ffTree[node.parentUid as TNodeUid]
        if (parentNode === undefined) {
          allDone = false
          return
        }
        const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
        if (!(await verifyFileHandlerPermission(parentHandler))) {
          allDone = false
          return
        }

        // delete
        try {
          const entryName = nodeData.kind === 'directory' ? nodeData.name : `${nodeData.name}${nodeData.ext}`
          await parentHandler.removeEntry(entryName, { recursive: true })
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
    } else if (project.context === 'idb') {
      let allDone = true
      await Promise.all(uids.map(async (uid) => {
        // validate
        const node = ffTree[uid]
        if (node === undefined) {
          allDone = false
          return
        }
        const nodeData = node.data as TFileNodeData

        // delete
        try {
          await removeFileSystem(nodeData.path)
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
    }

    removeInvalidNodes(...uids)
    await cb_reloadProject(file.uid)
    removeRunningActions(['fileTreeView-delete'], false)
  }, [addRunningActions, removeRunningActions, project.context, invalidNodes, setInvalidNodes, removeInvalidNodes, selectedItems, ffTree, ffHandlers, cb_reloadProject, file.uid])
  const cb_moveNode = useCallback(async (uids: TNodeUid[], targetUid: TNodeUid, copy: boolean = false) => {
    // validate
    const targetNode = ffTree[targetUid]
    if (targetNode === undefined) return
    const validatedUids = getValidNodeUids(ffTree, uids, targetUid)
    if (validatedUids.length === 0) return

    // confirm files' changes
    let hasChangedFile = false
    validatedUids.map(uid => {
      const _file = ffTree[uid]
      const _fileData = _file.data as TFileNodeData
      if (_file && _fileData.changed) {
        hasChangedFile = true
      }
    })
    if (hasChangedFile) {
      const message = `Your changes will be lost if you don't save them. Are you sure you want to continue without saving?`
      if (!window.confirm(message)) {
        return
      }
    }

    addRunningActions(['fileTreeView-move'])

    const _uids: { uid: TNodeUid, parentUid: TNodeUid, name: string }[] = []
    const _invalidNodes = { ...invalidNodes }

    if (project.context === 'local') {
      // verify target handler permission
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
      await Promise.all(validatedUids.map(async (uid) => {
        // validate
        const node = ffTree[uid]
        if (node === undefined) {
          allDone = false
          return
        }
        const nodeData = node.data as TFileNodeData
        const parentNode = ffTree[node.parentUid as TNodeUid]
        if (parentNode === undefined) {
          allDone = false
          return
        }
        const handler = ffHandlers[uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
        if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler))) {
          allDone = false
          return
        }

        // generate new name
        let newName = nodeData.kind === 'directory' ? nodeData.name : `${nodeData.name}${nodeData.ext}`
        if (copy) {
          if (nodeData.kind === 'directory') {
            let folderName = ''
            let exists = false
            try {
              folderName = nodeData.name
              await targetHandler.getDirectoryHandle(folderName, { create: false })
              exists = true
            } catch (err) {
              exists = false
            }
            if (exists) {
              try {
                folderName = `${nodeData.name} copy`
                await targetHandler.getDirectoryHandle(folderName, { create: false })
                exists = true
              } catch (err) {
                exists = false
              }
              if (exists) {
                let index = 0
                while (exists) {
                  try {
                    folderName = `${nodeData.name} copy (${++index})`
                    await targetHandler.getDirectoryHandle(folderName, { create: false })
                    exists = true
                  } catch (err) {
                    exists = false
                  }
                }
              }
            }
            newName = folderName
          } else {
            let fileName = ''
            let exists = false
            try {
              fileName = `${nodeData.name}${nodeData.ext}`
              await targetHandler.getFileHandle(fileName, { create: false })
              exists = true
            } catch (err) {
              exists = false
            }
            if (exists) {
              try {
                fileName = `${nodeData.name} copy${nodeData.ext}`
                await targetHandler.getFileHandle(fileName, { create: false })
                exists = true
              } catch (err) {
                exists = false
              }
              if (exists) {
                let index = 0
                while (exists) {
                  try {
                    fileName = `${nodeData.name} copy (${++index})${nodeData.ext}`
                    await targetHandler.getFileHandle(fileName, { create: false })
                    exists = true
                  } catch (err) {
                    exists = false
                  }
                }
              }
              newName = fileName
            }
          }
        }

        // update invalidNodes
        const newUid = `${targetUid}/${newName}`
        _invalidNodes[uid] = true
        _invalidNodes[newUid] = true
        setInvalidNodes(...Object.keys(_invalidNodes))

        // move
        try {
          await moveLocalFF(handler, parentHandler, targetHandler, newName, copy)
          _uids.push({ uid, parentUid: parentNode.uid, name: newName })
        } catch (err) {
          allDone = false
        }

        // update invalidNodes
        delete _invalidNodes[uid]
        delete _invalidNodes[newUid]
        setInvalidNodes(...Object.keys(_invalidNodes))
      }))
      if (!allDone) {
        addMessage({
          type: 'warning',
          content: 'Some directory/file couldn\'t be moved.',
        })
      }
    } else if (project.context === 'idb') {
      const targetNodeData = targetNode.data as TFileNodeData

      let allDone = true
      await Promise.all(validatedUids.map(async (uid) => {
        // validate
        const node = ffTree[uid]
        if (node === undefined) {
          allDone = false
          return
        }
        const nodeData = node.data as TFileNodeData

        // generate new name
        let newName = nodeData.kind === 'directory' ? nodeData.name : `${nodeData.name}${nodeData.ext}`
        if (copy) {
          if (nodeData.kind === 'directory') {
            let folderName = ''
            let exists = false
            try {
              folderName = nodeData.name
              await getStat(`${targetNodeData.path}/${folderName}`)
              exists = true
            } catch (err) {
              exists = false
            }
            if (exists) {
              try {
                folderName = `${nodeData.name} copy`
                await getStat(`${targetNodeData.path}/${folderName}`)
                exists = true
              } catch (err) {
                exists = false
              }
              if (exists) {
                let index = 0
                while (exists) {
                  try {
                    folderName = `${nodeData.name} copy (${++index})`
                    await getStat(`${targetNodeData.path}/${folderName}`)
                    exists = true
                  } catch (err) {
                    exists = false
                  }
                }
              }
            }
            newName = folderName
          } else {
            let fileName = ''
            let exists = false
            try {
              fileName = `${nodeData.name}${nodeData.ext}`
              await getStat(`${targetNodeData.path}/${fileName}`)
              exists = true
            } catch (err) {
              exists = false
            }
            if (exists) {
              try {
                fileName = `${nodeData.name} copy${nodeData.ext}`
                await getStat(`${targetNodeData.path}/${fileName}`)
                exists = true
              } catch (err) {
                exists = false
              }
              if (exists) {
                let index = 0
                while (exists) {
                  try {
                    fileName = `${nodeData.name} copy (${++index})${nodeData.ext}`
                    await getStat(`${targetNodeData.path}/${fileName}`)
                    exists = true
                  } catch (err) {
                    exists = false
                  }
                }
              }
            }
            newName = fileName
          }
        }

        // update invalidNodes
        const newUid = `${targetUid}/${newName}`
        _invalidNodes[uid] = true
        _invalidNodes[newUid] = true
        setInvalidNodes(...Object.keys(_invalidNodes))

        // move
        try {
          await moveIDBFF(nodeData, targetNodeData, newName, copy)
          _uids.push({ uid, parentUid: node.parentUid as TNodeUid, name: newName })
        } catch (err) {
          allDone = false
        }

        // update invalidNodes
        delete _invalidNodes[uid]
        delete _invalidNodes[newUid]
        setInvalidNodes(...Object.keys(_invalidNodes))
      }))
      if (!allDone) {
        addMessage({
          type: 'warning',
          content: 'Some directory/file couldn\'t be moved.',
        })
      }
    }

    const action: TFileAction = {
      type: copy ? 'copy' : 'cut',
      param1: _uids,
      param2: _uids.map(() => targetUid),
    }
    dispatch(setFileAction(action))

    await cb_reloadProject()
    removeRunningActions(['fileTreeView-move'])
  }, [addRunningActions, removeRunningActions, project.context, invalidNodes, setInvalidNodes, ffTree, ffHandlers, , cb_reloadProject])
  const cb_duplicateNode = useCallback(async () => {
    // validate
    const uids = selectedItems.filter(uid => !invalidNodes[uid])
    if (uids.length === 0) return

    // confirm files' changes
    let hasChangedFile = false
    uids.map(uid => {
      const _file = ffTree[uid]
      const _fileData = _file.data as TFileNodeData
      if (_file && _fileData.changed) {
        hasChangedFile = true
      }
    })
    if (hasChangedFile) {
      const message = `Your changes will be lost if you don't save them. Are you sure you want to continue without saving?`
      if (!window.confirm(message)) {
        return
      }
    }

    addRunningActions(['fileTreeView-duplicate'])

    const _uids: { uid: TNodeUid, name: string }[] = []
    const _targetUids: TNodeUid[] = []
    const _invalidNodes = { ...invalidNodes }

    if (project.context === 'local') {
      let allDone = true
      await Promise.all(uids.map(async (uid) => {
        // validate
        const node = ffTree[uid]
        if (node === undefined) {
          allDone = false
          return
        }
        const nodeData = node.data as TFileNodeData
        const parentNode = ffTree[node.parentUid as TNodeUid]
        if (parentNode === undefined) {
          allDone = false
          return
        }
        const handler = ffHandlers[node.uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
        if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler))) {
          allDone = false
          return
        }

        // generate new name
        let newName = nodeData.kind === 'directory' ? `${nodeData.name} copy` : `${nodeData.name} copy${nodeData.ext}`
        if (nodeData.kind === 'directory') {
          let folderName = ''
          let exists = false
          try {
            folderName = `${nodeData.name} copy`
            await parentHandler.getDirectoryHandle(folderName, { create: false })
            exists = true
          } catch (err) {
            exists = false
          }
          if (exists) {
            let index = 0
            while (exists) {
              try {
                folderName = `${nodeData.name} copy (${++index})`
                await parentHandler.getDirectoryHandle(folderName, { create: false })
                exists = true
              } catch (err) {
                exists = false
              }
            }
          }
          newName = folderName
        } else {
          let fileName = ''
          let exists = true
          try {
            fileName = `${nodeData.name} copy${nodeData.ext}`
            await parentHandler.getFileHandle(fileName, { create: false })
            exists = true
          } catch (err) {
            exists = false
          }
          if (exists) {
            let index = 0
            while (exists) {
              try {
                fileName = `${nodeData.name} copy (${++index})${nodeData.ext}`
                await parentHandler.getFileHandle(fileName, { create: false })
                exists = true
              } catch (err) {
                exists = false
              }
            }
          }
          newName = fileName
        }

        // update invalidNodes
        const newUid = `${node.parentUid}/${newName}`
        _invalidNodes[uid] = true
        _invalidNodes[newUid] = true
        setInvalidNodes(...Object.keys(_invalidNodes))

        // duplicate
        try {
          await moveLocalFF(handler, parentHandler, parentHandler, newName, true)
          _uids.push({ uid, name: newName })
          _targetUids.push(parentNode.uid)
        } catch (err) {
          allDone = false
        }

        // set invalid nodes
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
    } else if (project.context === 'idb') {
      let allDone = true
      await Promise.all(uids.map(async (uid) => {
        // validate
        const node = ffTree[uid]
        if (node === undefined) {
          allDone = false
          return
        }
        const nodeData = node.data as TFileNodeData
        const parentNode = ffTree[node.parentUid as TNodeUid]
        if (parentNode === undefined) {
          allDone = false
          return
        }
        const parentNodeData = parentNode.data as TFileNodeData

        // generate new name
        let newName = nodeData.kind === 'directory' ? `${nodeData.name} copy` : `${nodeData.name} copy${nodeData.ext}`
        if (nodeData.kind === 'directory') {
          let folderName = ''
          let exists = false
          try {
            folderName = `${nodeData.name} copy`
            await getStat(`${parentNodeData.path}/${folderName}`)
            exists = true
          } catch (err) {
            exists = false
          }
          if (exists) {
            let index = 0
            while (exists) {
              try {
                folderName = `${nodeData.name} copy (${++index})`
                await getStat(`${parentNodeData.path}/${folderName}`)
                exists = true
              } catch (err) {
                exists = false
              }
            }
          }
          newName = folderName
        } else {
          let fileName = ''
          let exists = false
          try {
            fileName = `${nodeData.name} copy${nodeData.ext}`
            await getStat(`${parentNodeData.path}/${fileName}`)
            exists = true
          } catch (err) {
            exists = false
          }
          if (exists) {
            let index = 0
            while (exists) {
              try {
                fileName = `${nodeData.name} copy (${++index})${nodeData.ext}`
                await getStat(`${parentNodeData.path}/${fileName}`)
                exists = true
              } catch (err) {
                exists = false
              }
            }
          }
          newName = fileName
        }

        // update invalidNodes
        const newUid = `${node.parentUid}/${newName}`
        _invalidNodes[uid] = true
        _invalidNodes[newUid] = true
        setInvalidNodes(...Object.keys(_invalidNodes))

        // duplicate
        try {
          await moveIDBFF(nodeData, parentNodeData, newName, true)
          _uids.push({ uid, name: newName })
          _targetUids.push(parentNode.uid)
        } catch (err) {
          allDone = false
        }

        // set invalid nodes
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
    }

    const action: TFileAction = {
      type: 'copy',
      param1: _uids,
      param2: _targetUids,
    }
    dispatch(setFileAction(action))

    await cb_reloadProject()
    removeRunningActions(['fileTreeView-duplicate'])
  }, [addRunningActions, removeRunningActions, project.context, invalidNodes, setInvalidNodes, selectedItems, ffTree, ffHandlers, cb_reloadProject])

  const cb_readNode = useCallback((uid: TNodeUid) => {
    addRunningActions(['fileTreeView-read'])
    dispatch({ type: HmsClearActionType })
    // validate
    if (invalidNodes[uid]) {
      removeRunningActions(['fileTreeView-read'], false)
      return
    }
    const node = ffTree[uid]
    if (node === undefined || !node.isEntity || file.uid === uid) {
      removeRunningActions(['fileTreeView-read'], false)
      return
    }
    const nodeData = node.data as TFileNodeData
    if (nodeData.type === 'html') {
      setPrevFileUid(file.uid)
    }
    if (nodeData.type === 'unknown') {
      dispatch(setCurrentFile({ uid, parentUid: node.parentUid as TNodeUid, name: nodeData.name, content: nodeData.content }))
      removeRunningActions(['fileTreeView-read'])
      setParseFile(false)
      showCodeView === false && setShowCodeView(true)
    }
    else {
      // set initial content of the html
      let initialContent = ''
      if (nodeData.type === 'html' && nodeData.kind === 'file' && nodeData.content === '') {
        let doctype = '<!DOCTYPE html>\n';
        let html = htmlReferenceData['elements']['html'].Content ? `<html>\n` + htmlReferenceData['elements']['html'].Content + `\n</html>` : '';
        initialContent = doctype + html
       nodeData.content = initialContent
      }
     addRunningActions(['processor-updateOpt'])
     dispatch(setCurrentFile({ uid, parentUid: node.parentUid as TNodeUid, name: nodeData.name, content: nodeData.content }))
     setUpdateOpt({ parse: true, from: 'file' })
     setParseFile(true)
     removeRunningActions(['fileTreeView-read'])
     setPrevFileUid(uid)
    }
  }, [addRunningActions, removeRunningActions, invalidNodes, ffTree, file.uid, showCodeView])

  // handlle links-open
  const openFile = useCallback((uid: TNodeUid) => {
    if (file.uid === uid) return
    dispatch({ type: HmsClearActionType })
    // focus/select/read the file
    addRunningActions(['fileTreeView-focus', 'fileTreeView-select', 'fileTreeView-read'])
    cb_focusNode(uid)
    cb_selectNode([uid])
    cb_readNode(uid)
  }, [ffTree, addRunningActions, cb_focusNode, cb_selectNode, cb_readNode])
  useEffect(() => {
    if (linkToOpen === '') return

    const node = ffTree[file.uid]
    if (node === undefined) return
    const parentNode = ffTree[node.parentUid as TNodeUid]
    if (parentNode === undefined) return

    const { isAbsolutePath, normalizedPath } = getNormalizedPath(linkToOpen)
    if (isAbsolutePath) {
      window.open(normalizedPath, '_blank')?.focus()
    } else {
      const fileUidToOpen = _path.join(parentNode.uid, normalizedPath)
      openFile(fileUidToOpen)
    }
  }, [linkToOpen])
  // -------------------------------------------------------------- cmdk --------------------------------------------------------------
  useEffect(() => {
    if (isAddFileAction(currentCommand.action)) {
      onAddNode(currentCommand.action)
      return
    }

    if (activePanel !== 'file') return

    switch (currentCommand.action) {
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
        break
    }
  }, [currentCommand])
  const onDelete = useCallback(() => {
    cb_deleteNode()
  }, [cb_deleteNode])
  const onCut = useCallback(() => {
    setClipboardData({ panel: 'file', type: 'cut', uids: selectedItems, fileType: ffTree[file.uid].data.type, data: [], fileUid: file.uid, prevNodeTree: nodeTree })
  }, [selectedItems, ffTree[file.uid], nodeTree])
  const onCopy = useCallback(() => {
    setClipboardData({ panel: 'file', type: 'copy', uids: selectedItems, fileType: ffTree[file.uid].data.type, data: [], fileUid: file.uid, prevNodeTree: nodeTree })
  }, [selectedItems, ffTree[file.uid], nodeTree])
  const onPaste = useCallback(() => {
    if (clipboardData.panel !== 'file') return

    // validate
    if (invalidNodes[focusedItem]) return
    const uids = clipboardData.uids.filter(uid => !invalidNodes[uid])
    if (uids.length === 0) return

    if (clipboardData.type === 'cut') {
      setClipboardData({ panel: 'file', type: 'cut', uids: [], fileType: 'html', data: [], fileUid: '', prevNodeTree: {} })
      cb_moveNode(uids, focusedItem)
    } else if (clipboardData.type === 'copy') {
      cb_moveNode(uids, focusedItem, true)
    }
  }, [clipboardData, invalidNodes, focusedItem, cb_moveNode])
  const onDuplicate = useCallback(() => {
    cb_duplicateNode()
  }, [cb_duplicateNode])
  const isAddFileAction = (actionName: string): boolean => {
    return actionName.startsWith(AddFileActionPrefix) ? true : false
  }
  const onAddNode = useCallback((actionName: string) => {
    const nodeType = actionName.slice(AddFileActionPrefix.length + 1)
    createTmpFFNode(nodeType === 'folder' ? '*folder' : nodeType as TFileNodeType)
  }, [createTmpFFNode])
  // -------------------------------------------------------------- own --------------------------------------------------------------
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    setActivePanel('file')
  }, [])

  return useMemo(() => {
    return (file.uid === '' || navigatorDropDownType === 'project') ? <>
      <div
        id="FileTreeView"
        style={{
          position: 'relative',
          top: 0,
          left: 0,
          width: '100%',
          maxHeight: 'calc(50vh - 50px)',
          height: 'auto',

          overflow: 'auto',

          ...(navigatorDropDownType ? { zIndex: 2 } : {})
        }}
        className={navigatorDropDownType ? 'border-bottom background-primary' : ''}
        onClick={onPanelClick}
      >
        <TreeView
          width={'100%'}
          height={'auto'}

          info={{ id: 'file-tree-view' }}

          data={fileTreeViewData}
          focusedItem={focusedItem}
          expandedItems={expandedItems}
          selectedItems={selectedItems}

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
                const node = props.item.data as TNode
                if (!node.data.valid) {
                  props.context.selectItem()
                  props.context.startRenamingItem()
                }
              }, [])
              const fileReferenceData = useMemo<TFilesReference>(() => {
                const node = props.item.data as TNode
                const nodeData = node.data as TFileNodeData
                const refData = filesReferenceData[nodeData.kind === 'directory' ? 'folder' : (nodeData.ext ? nodeData.ext.slice(1) : nodeData.type)]
                return refData
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
                  <div
                    id={`FileTreeView-${generateQuerySelector(props.item.index.toString())}`}
                    className={cx(
                      'justify-stretch',
                      'padding-xs',
                      'outline-default',
                      'gap-s',

                      props.context.isSelected && 'background-tertiary outline-none',
                      !props.context.isSelected && props.context.isFocused && 'outline',

                      props.context.isDraggingOver && 'outline',
                      props.context.isDraggingOverParent && '',

                      invalidNodes[props.item.data.uid] && 'opacity-m',
                    )}
                    style={{
                      flexWrap: "nowrap",
                      paddingLeft: `${props.depth * 18}px`,
                    }}
                    {...props.context.itemContainerWithoutChildrenProps}
                    {...props.context.interactiveElementProps}
                    onClick={(e) => {
                      e.stopPropagation()
                      openFileUid.current = props.item.data.uid
                      // skip click-event from an inline rename input
                      const targetId = e.target && (e.target as HTMLElement).id
                      if (targetId === 'FileTreeView-RenameInput') {
                        return
                      }

                      addRunningActions(['fileTreeView-select'])
                      !props.context.isFocused && addRunningActions(['fileTreeView-focus'])
                      !e.shiftKey && !e.ctrlKey && addRunningActions(props.item.isFolder ? [props.context.isExpanded ? 'fileTreeView-collapse' : 'fileTreeView-expand'] : ['fileTreeView-read'])

                      if (!props.context.isFocused) {
                        props.context.focusItem()
                        focusedItemRef.current = props.item.index as TNodeUid
                      }
                      e.shiftKey ? props.context.selectUpTo() :
                        e.ctrlKey ? (props.context.isSelected ? props.context.unselectItem() : props.context.addToSelectedItems()) : [
                          props.context.selectItem(),
                          props.item.isFolder ? props.context.toggleExpandedState() : props.context.primaryAction(),
                        ]

                      setActivePanel('file')
                    }}
                    onFocus={() => { }}
                    onMouseEnter={() => setFFHoveredItem(props.item.index as TNodeUid)}
                    onMouseLeave={() => setFFHoveredItem('' as TNodeUid)}
                    onDragStart={(e: React.DragEvent) => {
                      const target = e.target as HTMLElement
                      e.dataTransfer.setDragImage(target, window.outerWidth, window.outerHeight)
                      props.context.startDragging()
                    }}
                    onDragEnter={() => {
                      if (!props.context.isExpanded) {
                        setTimeout(() => cb_expandNode(props.item.index as TNodeUid), AutoExpandDelay)
                      }
                    }}
                  >
                    <div
                      className="gap-s padding-xs"
                      style={{
                        width: 'fit-content',
                        paddingRight: `0px`,
                      }}>
                      {props.arrow}

                      {fileReferenceData ?
                        <SVGIconI {...{ "class": "icon-xs" }}>{props.item.data?.data.kind === 'file' && props.item.data?.data.name === 'index' && props.item.data?.data.type === 'html' && props.item.data?.parentUid === 'ROOT' ? 'home' :  fileReferenceData && fileReferenceData['Icon'] && fileReferenceData['Icon'] !== 'md' ? fileReferenceData['Icon'] : 'page'}</SVGIconI>
                        : <div className='icon-xs'><SVGIconI {...{ "class": "icon-xs" }}>{props.item.data?.data.kind === 'file' ? 'page' : 'folder'}</SVGIconI></div>}
                    </div>

                    {props.title}
                  </div>

                  {props.context.isExpanded ? <>
                    <div>
                      {props.children}
                    </div>
                  </> : null}
                </li>
              </>
            },
            renderItemArrow: (props) => {
              return <>
                {props.item.isFolder ?
                  props.context.isExpanded ? <SVGIconI {...{ "class": "icon-xs" }}>down</SVGIconI> : <SVGIconII {...{ "class": "icon-xs" }}>right</SVGIconII>
                  : <div className='icon-xs'></div>}
              </>
            },
            renderItemTitle: (props) => {
              return <>
                <span
                  className='text-s justify-start gap-s align-center'
                  style={{
                    width: "100%",
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}>
                  {props.title + props.item?.data?.data?.ext}
                  {ffTree[props.item.data.uid] && (ffTree[props.item.data.uid].data as TFileNodeData).changed &&
                    <div className="radius-s foreground-primary" title='unsaved file' style={{ width: "6px", height: "6px" }}></div>}
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
          props={{
            canDragAndDrop: true,
            canDropOnFolder: true,
            canDropOnNonFolder: false,
            canReorderItems: false,

            canSearch: false,
            canSearchByStartingTyping: false,
            canRename: true,
          }}
          callbacks={{
            onStartRenamingItem: (item) => {
              cb_startRenamingNode(item.index as TNodeUid)
            },
            onAbortRenamingItem: (item) => {
              cb_abortRenamingNode(item)
            },
            onRenameItem: (item, name) => {
              cb_renameNode(item, name)
            },

            onSelectItems: (items) => {
              cb_selectNode(items as TNodeUid[])
            },
            onFocusItem: (item) => {
              cb_focusNode(item.index as TNodeUid)
            },
            onExpandItem: (item) => {
              cb_expandNode(item.index as TNodeUid)
            },
            onCollapseItem: (item) => {
              cb_collapseNode(item.index as TNodeUid)
            },

            onPrimaryAction: (item) => {
              item.data.data.valid ? cb_readNode(item.index as TNodeUid) : removeRunningActions(['fileTreeView-read'], false)
            },

            onDrop: (items, target) => {
              const targetUid = (target as DraggingPositionItem).targetItem as TNodeUid
              if (invalidNodes[targetUid]) return
              const uids = items.map(item => item.index as TNodeUid).filter(uid => !invalidNodes[uid])
              if (uids.length === 0) return

              cb_moveNode(uids, targetUid)
            }
          }}
        />
      </div>
    </> : <>
    </>
  }, [
    onPanelClick, showActionsPanel, navigatorDropDownType,
    ffTree, fileTreeViewData, file,
    focusedItem, selectedItems, expandedItems,
    addRunningActions, removeRunningActions,
    cb_startRenamingNode, cb_abortRenamingNode, cb_renameNode,
    cb_selectNode, cb_focusNode, cb_expandNode, cb_collapseNode, cb_readNode, cb_moveNode, parseFileFlag, setParseFile, prevFileUid, SVGIconI
  ])
}