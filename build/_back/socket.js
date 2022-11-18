"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addWebSocketServerEventHandlers = void 0;
const ffApi_1 = require("./ffApi");
const ffWatcher_1 = __importDefault(require("./ffWatcher"));
const services_1 = require("./services");
const addWebSocketServerEventHandlers = (wss) => {
    // create Folder/File Watcher
    const ffWatcher = new ffWatcher_1.default();
    // event handlers
    wss.on('connection', (ws, req) => {
        const subscriptions = new Map();
        // set isAlive as true by default
        const extWs = ws;
        extWs.isAlive = true;
        //send immediatly a feedback to the incoming connection
        const feedbackMessage = {
            header: 'f-message',
        };
        ws.send((0, services_1.createResMessage)(feedbackMessage));
        // detect pong reply from ping request and set the isAlive as true
        ws.on('pong', () => {
            extWs.isAlive = true;
        });
        // handling the message from the client web sockets
        ws.on('message', (msg) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            const message = JSON.parse(msg);
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
            if (message.header === 'ff-message') { /* Folder File Message */
                const { type } = message.body;
                if (type === 'add') {
                    console.log('ff add begin');
                    let resPayload;
                    const payload = (_a = message.body) === null || _a === void 0 ? void 0 : _a.payload;
                    const res = yield (0, services_1.selectFolderFromModal)();
                    if (!res.success) {
                        ws.send((0, services_1.createResMessage)({
                            header: 'ff-message',
                            body: {
                                type: 'no-effect',
                                errorMessage: res.error
                            },
                        }));
                        return;
                    }
                    const fullPath = (0, services_1.getNormalizedPath)(res.path);
                    const folderName = (0, services_1.getName)(fullPath);
                    resPayload = {
                        uid: fullPath,
                        p_uid: null,
                        name: folderName,
                        isEntity: false,
                        children: [],
                        data: {},
                    };
                    console.log('ff add end');
                    ws.send((0, services_1.createResMessage)({
                        header: 'ff-message',
                        body: {
                            type: 'add',
                            payload: resPayload,
                        },
                    }));
                }
                else if (type === 'open') {
                    console.log('ff open begin');
                    let resPayload;
                    const payload = (_b = message.body) === null || _b === void 0 ? void 0 : _b.payload;
                    const fullPath = payload.uid;
                    // Check if it's a valid folder
                    const nodeType = yield (0, services_1.getFFNodeType)(fullPath);
                    if (nodeType !== "folder") {
                        ws.send((0, services_1.createResMessage)({
                            header: 'e-message',
                            body: {
                                errorMessage: nodeType === 'unlink' ? 'It doesn\'t exist' : 'It\'s a file, not a folder!',
                            },
                        }));
                        return;
                    }
                    // set the subscription for the pathName
                    if (!subscriptions.get(fullPath)) {
                        subscriptions.set(fullPath, ffWatcher.subscribe(fullPath, (action) => {
                            ws.send((0, services_1.createResMessage)({
                                header: 'ff-watch-message',
                                body: action,
                            }));
                        }));
                    }
                    // return the project structure
                    resPayload = yield (0, services_1.loadFolderStructure)(payload);
                    console.log('ff open end');
                    ws.send((0, services_1.createResMessage)({
                        header: 'ff-message',
                        body: {
                            type: 'open',
                            payload: resPayload,
                        },
                    }));
                }
                else if (type === 'close') {
                    console.log('ff close begin');
                    let resPayload;
                    const payload = (_c = message.body) === null || _c === void 0 ? void 0 : _c.payload;
                    for (const uid of payload) {
                        // Check if it's a valid folder
                        const nodeType = yield (0, services_1.getFFNodeType)(uid);
                        if (nodeType !== "folder") {
                            continue;
                        }
                        // unsubscribe the watchers
                        const unsub = subscriptions.get(uid);
                        if (!unsub)
                            continue;
                        subscriptions.delete(uid);
                        unsub();
                    }
                    resPayload = payload;
                    console.log('ff close end');
                    ws.send((0, services_1.createResMessage)({
                        header: 'ff-message',
                        body: {
                            type: 'close',
                            payload: resPayload,
                        },
                    }));
                }
                else if (type === 'read') {
                    console.log('ff read begin');
                    let resPayload;
                    const payload = (_d = message.body) === null || _d === void 0 ? void 0 : _d.payload;
                    const fullPath = payload.uid;
                    // read the file content
                    const res = yield (0, ffApi_1.readFileContent)(fullPath);
                    if (!res.success) {
                        ws.send((0, services_1.createResMessage)({
                            header: 'e-message',
                            body: {
                                errorMessage: res.error,
                            },
                        }));
                        return;
                    }
                    resPayload = {
                        uid: payload.uid,
                        type: (0, services_1.getFileExtension)(payload.name),
                        content: res.data,
                    };
                    console.log('ff read end');
                    ws.send((0, services_1.createResMessage)({
                        header: 'ff-message',
                        body: {
                            type: 'read',
                            payload: resPayload,
                        },
                    }));
                }
                else if (type === 'rename') {
                    console.log('ff rename begin');
                    let resPayload;
                    const { nodes, name } = (_e = message.body) === null || _e === void 0 ? void 0 : _e.payload;
                    // get the main node to rename
                    const renameNode = nodes[0];
                    const oldUid = renameNode.uid;
                    const newUid = (0, services_1.joinPath)((0, services_1.getPath)(oldUid), name);
                    const newNodes = [];
                    const watchers = [];
                    // backup new-named nodes
                    for (let i = 0; i < nodes.length; ++i) {
                        const node = nodes[i];
                        const { uid, p_uid } = node;
                        if (subscriptions.get(uid)) {
                            watchers.push(true);
                        }
                        else {
                            watchers.push(false);
                        }
                        newNodes.push(Object.assign(Object.assign({}, node), { uid: newUid + node.uid.slice(oldUid.length), p_uid: (p_uid !== null && p_uid.length >= oldUid.length) ? (newUid + p_uid.slice(oldUid.length)) : p_uid, children: node.children.map(childUid => newUid + childUid.slice(oldUid.length)), data: node.uid }));
                    }
                    newNodes[0].name = name;
                    // unsubscribe the watchers it it's a folder
                    for (let i = nodes.length - 1; i >= 0; --i) {
                        const fullPath = nodes[i].uid;
                        const unsub = subscriptions.get(fullPath);
                        if (unsub) {
                            subscriptions.delete(fullPath);
                            unsub();
                        }
                    }
                    // rename the ffNode
                    const res = yield (0, ffApi_1.renameFF)(renameNode.uid, newUid);
                    if (!res.success) {
                        // restore the subscribers if failed
                        for (let i = 0; i < nodes.length; ++i) {
                            const node = nodes[i];
                            const fullPath = node.uid;
                            if (watchers[i]) {
                                const nodeType = yield (0, services_1.getFFNodeType)(fullPath);
                                // subscribe the watchers it it's a folder
                                if (nodeType === "folder") {
                                    subscriptions.set(fullPath, ffWatcher.subscribe(fullPath, (action) => {
                                        ws.send((0, services_1.createResMessage)({
                                            header: 'ff-watch-message',
                                            body: action,
                                        }));
                                    }));
                                }
                            }
                        }
                        // return error
                        ws.send((0, services_1.createResMessage)({
                            header: 'e-message',
                            body: {
                                errorMessage: res.error,
                            },
                        }));
                        return;
                    }
                    // set the new subscribers if success
                    for (let i = 0; i < nodes.length; ++i) {
                        const node = nodes[i];
                        const fullPath = node.uid;
                        if (watchers[i]) {
                            const nodeType = yield (0, services_1.getFFNodeType)(fullPath);
                            // subscribe the watchers it it's a folder
                            if (nodeType === "folder") {
                                subscriptions.set(fullPath, ffWatcher.subscribe(fullPath, (action) => {
                                    ws.send((0, services_1.createResMessage)({
                                        header: 'ff-watch-message',
                                        body: action,
                                    }));
                                }));
                            }
                        }
                    }
                    console.log('ff rename end');
                    resPayload = {
                        nodes: newNodes,
                        name: name,
                    };
                    ws.send((0, services_1.createResMessage)({
                        header: 'ff-message',
                        body: {
                            type: 'rename',
                            payload: resPayload,
                        },
                    }));
                }
                else if (type === 'remove') {
                    console.log('ff remove begin');
                    let resPayload = [];
                    const payload = (_f = message.body) === null || _f === void 0 ? void 0 : _f.payload;
                    resPayload = payload;
                    for (const uid of payload) {
                        const fullPath = uid;
                        const nodeType = yield (0, services_1.getFFNodeType)(fullPath);
                        // unsubscribe the watchers it it's a folder
                        if (nodeType === "folder") {
                            const unsub = subscriptions.get(fullPath);
                            if (!unsub)
                                continue;
                            subscriptions.delete(fullPath);
                            unsub();
                        }
                    }
                    console.log('ff remove end');
                    ws.send((0, services_1.createResMessage)({
                        header: 'ff-message',
                        body: {
                            type: 'remove',
                            payload: payload,
                        },
                    }));
                }
                else if (type === 'move') {
                    console.log('ff move begin');
                    let resPayload;
                    const payload = (_g = message.body) === null || _g === void 0 ? void 0 : _g.payload;
                    console.log('ff move begin');
                }
                else if (type === 'duplicate') {
                    console.log('ff duplicate begin');
                    let resPayload;
                    const payload = (_h = message.body) === null || _h === void 0 ? void 0 : _h.payload;
                    console.log('ff duplicate begin');
                }
                else if (type === 'create') {
                    console.log('ff create begin');
                    let resPayload;
                    const payload = (_j = message.body) === null || _j === void 0 ? void 0 : _j.payload;
                    console.log('ff create begin');
                }
                else if (type === 'delete') {
                    console.log('ff delete begin');
                    let resPayload;
                    const payload = (_k = message.body) === null || _k === void 0 ? void 0 : _k.payload;
                    console.log('ff delete begin');
                }
                else if (type === 'update') {
                    console.log('ff update begin');
                    let resPayload;
                    const payload = (_l = message.body) === null || _l === void 0 ? void 0 : _l.payload;
                    // write file content
                    const res = yield (0, ffApi_1.writeFileContent)(payload);
                    if (!res.success) {
                        ws.send((0, services_1.createResMessage)({
                            header: 'e-message',
                            body: {
                                errorMessage: res.error,
                            },
                        }));
                        return;
                    }
                    resPayload = {
                        uid: payload.file.uid,
                        type: (0, services_1.getFileExtension)(payload.file.name),
                        content: payload.content,
                    };
                    console.log('ff update end');
                    ws.send((0, services_1.createResMessage)({
                        header: 'ff-message',
                        body: {
                            type: 'update',
                            payload: resPayload,
                        },
                    }));
                }
            }
        }));
        // close event
        ws.on("close", () => {
            // remove all subscriptions
            for (let [pathName, unsub] of subscriptions) {
                unsub();
                subscriptions.delete(pathName);
            }
        });
        // error handling
        ws.on('error', (err) => {
            console.warn(`Error occurred: ${err}`);
        });
    });
    /*
    check the live status of each client web socket
    1. Ping to the client web socket
    2. If there's no response in the next 10 seconds, terminate the client web socket
    */
    setInterval(() => {
        wss.clients.forEach((client) => {
            const extWs = client;
            if (!extWs.isAlive)
                return client.terminate();
            extWs.isAlive = false;
            client.ping(null, undefined);
        });
    }, 10000);
};
exports.addWebSocketServerEventHandlers = addWebSocketServerEventHandlers;
//# sourceMappingURL=socket.js.map