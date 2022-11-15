import React, {
  useMemo,
  useState,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import { TreeView } from '@_components/common';
import { TreeViewData } from '@_components/common/treeView/types';
import {
  collapseFNNode,
  expandFNNode,
  fnGetExpandedItemsSelector,
  fnGetFocusedItemSelector,
  fnGetSelectedItemsSelector,
  focusFNNode,
  selectFNNode,
} from '@_redux/fn';
import {
  globalGetCurrentFileSelector,
  globalGetProjectsSelector,
  globalGetWorkspaceSelector,
} from '@_redux/global';
import { socketSendMessage } from '@_redux/socket';
import { generateUID } from '@_services/global';
import {
  FNFile,
  FNHtmlObject,
  FNObject,
} from '@_types/fn';
import {
  NAME,
  UID,
} from '@_types/global';

import {
  addFN,
  moveFN,
  parseFileContent,
  removeFN,
  renameFN,
  serializeFileContent,
} from './api';
import { renderers } from './renderers';

export default function NodeTreeView() {
  const dispatch = useDispatch()

  // fetch global state
  const { uid: fuid, type, content } = useSelector(globalGetCurrentFileSelector)
  const workspace = useSelector(globalGetWorkspaceSelector)
  const projects = useSelector(globalGetProjectsSelector)

  // fetch ff state
  const focusedItem = useSelector(fnGetFocusedItemSelector)
  const expandedItems = useSelector(fnGetExpandedItemsSelector)
  const selectedItems = useSelector(fnGetSelectedItemsSelector)

  // FNFile Data
  const [fnFileData, setFNFileData] = useState<FNFile>({})

  // node tree view data state
  const nodeTreeViewData = useMemo(() => {
    const filedata: FNFile = parseFileContent(type, content)
    setFNFileData(filedata)

    let data: TreeViewData = {}
    for (const uid in filedata) {
      data[uid] = {
        index: filedata[uid].uid,
        data: filedata[uid],
        children: filedata[uid].children,
        hasChildren: (filedata[uid] as FNHtmlObject).nodeType != 'text',
        canMove: true,
        canRename: true,
      }
    }

    return data
  }, [content])

  const updateFFcontent = (data: FNFile) => {
    const content = serializeFileContent(type, data)
    dispatch(socketSendMessage({
      header: 'ff-message',
      body: {
        type: 'update',
        payload: {
          file: workspace[fuid] || projects[fuid],
          content: content,
        },
      },
    }))
  }
  const handleAddFNNode = () => {
    let newNode: FNObject = {
      uid: generateUID(),
      name: 'div',
      parentUID: '',
      children: []
    };
    let PID: string;
    if (selectedItems.length == 0) {
      PID = "root"
    } else {
      PID = selectedItems[0];
    }
    newNode.parentUID = PID
    const data = addFN({ uid: PID, fnNode: newNode, data: fnFileData });
    updateFFcontent(data)
  }

  const handleRemoveFnNode = () => {
    if (selectedItems.length == 0)
      return;
    const uid = selectedItems[0];
    const data = removeFN({ fnNode: fnFileData[uid], data: fnFileData })
    updateFFcontent(data)
  }
  // cb
  const cb_focusFNNode = (uid: UID) => {
    dispatch(focusFNNode(uid))
  }
  const cb_expandFNNode = (uid: UID) => {
    dispatch(expandFNNode(uid))
  }
  const cb_collapseFNNode = (uid: UID) => {
    dispatch(collapseFNNode(uid))
  }
  const cb_selectFNNode = (uids: UID[]) => {
    dispatch(selectFNNode(uids))
  }

  const cb_readFNNode = (uid: UID) => {
  }

  const cb_renameFNNode = (uid: UID, name: NAME) => {
    // call API
    let data = renameFN({ uid, name, data: fnFileData })
    updateFFcontent(data)
  }

  return (<>
    <div
      style={{
        width: "100%",
        height: "400px",
        overflow: "auto",
        borderBottom: "1px solid rgb(10, 10, 10)",
      }}
    >
      {/* Name Bar */}
      <div
        style={{
          zIndex: "1",
          position: "sticky",
          top: "0",
          width: "100%",
          color: "white",
          fontSize: "13px",
          padding: "2px 0px 5px 5px",
          marginBottom: "5px",
          borderBottom: "1px solid black",
          background: "rgb(31, 36, 40)"
        }}
      >
        Node


        <div
          style={{
            zIndex: "2",
            position: "absolute",
            top: "0px",
            right: "0px",
            display: 'flex',
            alignItems: 'center',
            justifyContent: "flex-end",
            width: "100%",
            height: '100%',
          }}
        >
          {/* Create Node Button */}
          <button
            style={{
              zIndex: "2",
              margin: "0 5px",
              background: "rgb(23 111 44)",
              color: "white",
              border: "none",
              font: "normal lighter normal 12px Arial",
            }}
            onClick={handleAddFNNode}
          >
            +
          </button>
          <button
            style={{
              zIndex: "2",
              top: "3px",
              right: "28px",
              background: "rgb(193 22 22)",
              color: "white",
              border: "none",
              margin: "0 5px",
              font: "normal lighter normal 12px Arial",
            }}
            onClick={handleRemoveFnNode}
          >
            x
          </button>
        </div>
      </div>

      {/* Main TreeView */}
      <TreeView
        width={'300px'}
        height={'400px'}
        data={nodeTreeViewData}

        renderers={renderers}

        focusedItem={focusedItem}
        expandedItems={expandedItems}
        selectedItems={selectedItems}

        cb_focusNode={cb_focusFNNode}
        cb_expandNode={cb_expandFNNode}
        cb_collapseNode={cb_collapseFNNode}
        cb_selectNode={cb_selectFNNode}

        cb_readNode={cb_readFNNode}
        cb_renameNode={cb_renameFNNode}
        cb_dropNode={(uids: UID[], targetUID: string) => {
          const data = moveFN({
            uid: targetUID,
            fnNode: fnFileData[uids[0]],
            data: fnFileData
          })
          updateFFcontent(data)
        }}
      />
    </div>
  </>)
}