import * as WebSocket from 'ws';

import {
  FFNode,
  FFNodeAction,
  FFNodeActionAddPayload,
  FFNodeActionAddPayloadRes,
  FFNodeActionClosePayload,
  FFNodeActionClosePayloadRes,
  FFNodeActionCreatePayload,
  FFNodeActionCreatePayloadRes,
  FFNodeActionDeletePayload,
  FFNodeActionDeletePayloadRes,
  FFNodeActionDuplicatePayload,
  FFNodeActionDuplicatePayloadRes,
  FFNodeActionMovePayload,
  FFNodeActionMovePayloadRes,
  FFNodeActionOpenPayload,
  FFNodeActionOpenPayloadRes,
  FFNodeActionReadPayload,
  FFNodeActionReadPayloadRes,
  FFNodeActionRemovePayload,
  FFNodeActionRemovePayloadRes,
  FFNodeActionRenamePayload,
  FFNodeActionRenamePayloadRes,
  FFNodeActionRes,
  FFNodeActionUpdatePayload,
  FFNodeActionUpdatePayloadRes,
  FFNodeType,
} from '@_types/ff';
import {
  Message,
  ResMessage,
} from '@_types/socket';

import {
  readFileContent,
  renameFF,
  writeFileContent,
} from './ffApi';
import FFWatcher from './ffWatcher';
import {
  createResMessage,
  getFFNodeType,
  getFileExtension,
  getName,
  getNormalizedPath,
  getPath,
  joinPath,
  loadFolderStructure,
  selectFolderFromModal,
} from './services';
import { FolderSelectModalResponse } from './types';

// add isAlive property to ExtWebSocket 
interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
}

export const addWebSocketServerEventHandlers = (wss: WebSocket.Server<WebSocket.WebSocket>) => {
  // create Folder/File Watcher
  const ffWatcher = new FFWatcher();

  // event handlers
  wss.on('connection', (ws: WebSocket, req) => {

    const subscriptions = new Map<string, () => void>()

    // set isAlive as true by default
    const extWs = ws as ExtWebSocket
    extWs.isAlive = true

    //send immediatly a feedback to the incoming connection
    const feedbackMessage: ResMessage = {
      header: 'f-message',
    }
    ws.send(createResMessage(feedbackMessage))

    // detect pong reply from ping request and set the isAlive as true
    ws.on('pong', () => {
      extWs.isAlive = true
    })

    // handling the message from the client web sockets
    ws.on('message', async (msg: string) => {
      const message: Message = JSON.parse(msg)

      // if it's broadcasting message, send back the message to the other clients
      /* if (message.options?.isBroadcast === true) {
        wss.clients.forEach((client) => {
          if (client != ws) {
            client.send(createResMessage(message as ResMessage))
          }
        })
      } */

      /*
      analysis the message and reply
      1. ff-message // folder file message
      */
      if (message.header === 'ff-message') {/* Folder File Message */
        const { type } = message.body as FFNodeAction

        if (type === 'add') {
          console.log('ff add begin')

          let resPayload: FFNodeActionAddPayloadRes
          const payload = message.body?.payload as FFNodeActionAddPayload

          const res: FolderSelectModalResponse = await selectFolderFromModal()
          if (!res.success) {
            ws.send(createResMessage({
              header: 'ff-message',
              body: {
                type: 'no-effect',
                errorMessage: res.error
              },
            }))
            return
          }

          const fullPath = getNormalizedPath(res.path as string)
          const folderName = getName(fullPath)
          resPayload = {
            uid: fullPath,
            p_uid: null,
            name: folderName,
            isEntity: false,
            children: [],
            data: {},
          }
          console.log('ff add end')

          ws.send(createResMessage({
            header: 'ff-message',
            body: {
              type: 'add',
              payload: resPayload,
            },
          }))
        } else if (type === 'open') {
          console.log('ff open begin')

          let resPayload: FFNodeActionOpenPayloadRes
          const payload = message.body?.payload as FFNodeActionOpenPayload
          const fullPath = payload.uid

          // Check if it's a valid folder
          const nodeType: FFNodeType = await getFFNodeType(fullPath)
          if (nodeType !== "folder") {
            ws.send(createResMessage({
              header: 'e-message',
              body: {
                errorMessage: nodeType === 'unlink' ? 'It doesn\'t exist' : 'It\'s a file, not a folder!',
              },
            }))
            return
          }

          // set the subscription for the pathName
          if (!subscriptions.get(fullPath)) {
            subscriptions.set(fullPath, ffWatcher.subscribe(fullPath, (action: FFNodeActionRes) => {
              ws.send(createResMessage({
                header: 'ff-watch-message',
                body: action,
              }))
            }))

            // return the project structure
            resPayload = await loadFolderStructure(payload)
            console.log('ff open end')

            ws.send(createResMessage({
              header: 'ff-message',
              body: {
                type: 'open',
                payload: resPayload,
              },
            }))
          }
        } else if (type === 'close') {
          console.log('ff close begin')

          let resPayload: FFNodeActionClosePayloadRes
          const payload = message.body?.payload as FFNodeActionClosePayload

          for (const uid of payload) {
            // Check if it's a valid folder
            const nodeType: FFNodeType = await getFFNodeType(uid)
            if (nodeType !== "folder") {
              continue
            }

            // unsubscribe the watchers
            const unsub = subscriptions.get(uid)
            if (!unsub) continue
            subscriptions.delete(uid)
            unsub()
          }

          resPayload = payload

          console.log('ff close end')

          ws.send(createResMessage({
            header: 'ff-message',
            body: {
              type: 'close',
              payload: resPayload,
            },
          }))
        } else if (type === 'read') {
          console.log('ff read begin')

          let resPayload: FFNodeActionReadPayloadRes
          const payload = message.body?.payload as FFNodeActionReadPayload
          const fullPath = payload.uid

          // read the file content
          const res = await readFileContent(fullPath)
          if (!res.success) {
            ws.send(createResMessage({
              header: 'e-message',
              body: {
                errorMessage: res.error as string,
              },
            }))
            return
          }

          resPayload = {
            uid: payload.uid,
            type: getFileExtension(payload.name),
            content: res.data as string,
          }
          console.log('ff read end')

          ws.send(createResMessage({
            header: 'ff-message',
            body: {
              type: 'read',
              payload: resPayload,
            },
          }))
        } else if (type === 'rename') {
          console.log('ff rename begin')

          let resPayload: FFNodeActionRenamePayloadRes
          const { nodes, name } = message.body?.payload as FFNodeActionRenamePayload

          // get the main node to rename
          const renameNode = nodes[0]
          const oldUid = renameNode.uid
          const newUid = joinPath(getPath(oldUid), name)
          const newNodes: FFNode[] = []

          for (const node of nodes) {
            // backup new-named nodes
            const p_uid = node.p_uid
            newNodes.push({
              ...node,
              uid: newUid + node.uid.slice(oldUid.length),
              p_uid: (p_uid !== null && p_uid.length >= oldUid.length) ? (newUid + p_uid.slice(oldUid.length)) : p_uid,
              children: node.children.map(childUid => newUid + childUid.slice(oldUid.length)),
              data: node.uid,
            })

            // unsubscribe the watchers it it's a folder
            const fullPath = node.uid
            const nodeType: FFNodeType = await getFFNodeType(fullPath)
            if (nodeType === "folder") {
              const unsub = subscriptions.get(fullPath)
              if (unsub) {
                subscriptions.delete(fullPath)
                unsub()
              }
            }
          }
          newNodes[0].name = name
          console.log(newNodes)

          // rename the ffNode
          const res = await renameFF(renameNode.uid, newUid)
          if (!res.success) {
            // restore the subscribers if failed
            for (const node of nodes) {
              const fullPath = node.uid
              const nodeType: FFNodeType = await getFFNodeType(fullPath)

              // subscribe the watchers it it's a folder
              if (nodeType === "folder") {
                if (!subscriptions.get(fullPath)) {
                  subscriptions.set(fullPath, ffWatcher.subscribe(fullPath, (action: FFNodeActionRes) => {
                    ws.send(createResMessage({
                      header: 'ff-watch-message',
                      body: action,
                    }))
                  }))
                }
              }
            }

            // return error
            ws.send(createResMessage({
              header: 'e-message',
              body: {
                errorMessage: res.error as string,
              },
            }))
            return
          }

          // set the new subscribers if success
          for (const node of newNodes) {
            const fullPath = node.uid
            const nodeType: FFNodeType = await getFFNodeType(fullPath)

            // subscribe the watchers it it's a folder
            if (nodeType === "folder") {
              if (!subscriptions.get(fullPath)) {
                subscriptions.set(fullPath, ffWatcher.subscribe(fullPath, (action: FFNodeActionRes) => {
                  ws.send(createResMessage({
                    header: 'ff-watch-message',
                    body: action,
                  }))
                }))
              }
            }
          }

          console.log('ff rename end')

          resPayload = {
            nodes: newNodes,
            name: name,
          }
          ws.send(createResMessage({
            header: 'ff-message',
            body: {
              type: 'rename',
              payload: resPayload,
            },
          }))
        } else if (type === 'remove') {
          console.log('ff remove begin')

          let resPayload: FFNodeActionRemovePayloadRes = []
          const payload = message.body?.payload as FFNodeActionRemovePayload
          resPayload = payload

          for (const uid of payload) {
            const fullPath = uid
            const nodeType: FFNodeType = await getFFNodeType(fullPath)

            // unsubscribe the watchers it it's a folder
            if (nodeType === "folder") {
              const unsub = subscriptions.get(fullPath)
              if (!unsub) continue
              subscriptions.delete(fullPath)
              unsub()
            }
          }

          console.log('ff remove end')

          ws.send(createResMessage({
            header: 'ff-message',
            body: {
              type: 'remove',
              payload: payload,
            },
          }))
        } else if (type === 'move') {
          console.log('ff move begin')

          let resPayload: FFNodeActionMovePayloadRes
          const payload = message.body?.payload as FFNodeActionMovePayload

          console.log('ff move begin')

        } else if (type === 'duplicate') {
          console.log('ff duplicate begin')

          let resPayload: FFNodeActionDuplicatePayloadRes
          const payload = message.body?.payload as FFNodeActionDuplicatePayload

          console.log('ff duplicate begin')

        } else if (type === 'create') {
          console.log('ff create begin')

          let resPayload: FFNodeActionCreatePayloadRes
          const payload = message.body?.payload as FFNodeActionCreatePayload

          console.log('ff create begin')

        } else if (type === 'delete') {
          console.log('ff delete begin')

          let resPayload: FFNodeActionDeletePayloadRes
          const payload = message.body?.payload as FFNodeActionDeletePayload

          console.log('ff delete begin')

        } else if (type === 'update') {
          console.log('ff update begin')

          let resPayload: FFNodeActionUpdatePayloadRes
          const payload = message.body?.payload as FFNodeActionUpdatePayload

          // write file content
          const res = await writeFileContent(payload)
          if (!res.success) {
            ws.send(createResMessage({
              header: 'e-message',
              body: {
                errorMessage: res.error as string,
              },
            }))
            return
          }

          resPayload = {
            uid: payload.file.uid,
            type: getFileExtension(payload.file.name),
            content: payload.content,
          }
          console.log('ff update end')

          ws.send(createResMessage({
            header: 'ff-message',
            body: {
              type: 'update',
              payload: resPayload,
            },
          }))
        }
      }
    })

    // close event
    ws.on("close", () => {
      // remove all subscriptions
      for (let [pathName, unsub] of subscriptions) {
        unsub()
        subscriptions.delete(pathName)
      }
    })

    // error handling
    ws.on('error', (err) => {
      console.warn(`Error occurred: ${err}`)
    })
  })

  /* 
  check the live status of each client web socket
  1. Ping to the client web socket
  2. If there's no response in the next 10 seconds, terminate the client web socket
  */
  setInterval(() => {
    wss.clients.forEach((client) => {
      const extWs = client as ExtWebSocket

      if (!extWs.isAlive) return client.terminate()

      extWs.isAlive = false
      client.ping(null, undefined)
    })
  }, 10000)
}