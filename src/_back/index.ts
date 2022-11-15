import * as http from 'http';
import * as WebSocket from 'ws';

import { addWebSocketServerEventHandlers } from './socket';

const express = require('express')
const path = require('path')
const open = require('open')

// react app render
const app = express()
app.use(express.static(path.join(__dirname, "..", "public")))

// initialize a simple http server
const server = http.createServer(app)

// initialize the WebSocket server instance
const wss = new WebSocket.Server({ server })

// add web socket event handlers
addWebSocketServerEventHandlers(wss)

// when the server is upgraded, connect again
/* server.on("upgrade", (request, socket, head) =>
  wss.handleUpgrade(request, socket, head, (ws) =>
    wss.emit("connection", ws, request)
  )
) */

//start our server
server.listen(process.env.PORT || 8080, () => {
  const port = (server.address() as WebSocket.AddressInfo).port
  console.log(`Server started on port ${port}`)
  if (process.env.OPEN) {
    open("http://localhost:" + port);
  }
})
