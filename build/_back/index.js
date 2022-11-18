"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("http"));
const WebSocket = __importStar(require("ws"));
const socket_1 = require("./socket");
const express = require('express');
const path = require('path');
const open = require('open');
// react app render
const app = express();
app.use(express.static(path.join(__dirname, "..", "public")));
// initialize a simple http server
const server = http.createServer(app);
// initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });
// add web socket event handlers
(0, socket_1.addWebSocketServerEventHandlers)(wss);
// when the server is upgraded, connect again
/* server.on("upgrade", (request, socket, head) =>
  wss.handleUpgrade(request, socket, head, (ws) =>
    wss.emit("connection", ws, request)
  )
) */
//start our server
server.listen(process.env.PORT || 8080, () => {
    const port = server.address().port;
    console.log(`Server started on port ${port}`);
    if (process.env.OPEN) {
        open("http://localhost:" + port);
    }
});
//# sourceMappingURL=index.js.map