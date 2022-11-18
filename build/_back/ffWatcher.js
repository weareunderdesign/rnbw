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
const fs_1 = __importDefault(require("fs"));
const services_1 = require("./services");
class FFWatcher {
    constructor() {
        this.subscriptions = new Map();
        this.watchers = new Map();
    }
    publish(pathName, action) {
        // skip if there's no subscriber
        const subscribers = this.subscriptions.get(pathName);
        if (!subscribers)
            return;
        // call all of the subscribers
        for (let callback of subscribers) {
            callback(action);
        }
    }
    subscribe(pathName, callback) {
        // if there's no watcher, add watcher
        if (!this.watchers.get(pathName))
            this.watch(pathName);
        // add the new callback to the subscribers
        let subscribers = this.subscriptions.get(pathName);
        if (!subscribers) {
            subscribers = new Set();
            this.subscriptions.set(pathName, subscribers);
        }
        subscribers.add(callback);
        console.log(`Subscribed to ${pathName} (${subscribers.size})`);
        return () => {
            // remove callback from the subscribers
            subscribers === null || subscribers === void 0 ? void 0 : subscribers.delete(callback);
            console.log(`Unsubscribing from ${pathName} (${subscribers === null || subscribers === void 0 ? void 0 : subscribers.size})`);
            if ((subscribers === null || subscribers === void 0 ? void 0 : subscribers.size) === 0) {
                // if there's no subscriber, remove the path subscription
                this.subscriptions.delete(pathName);
                this.unwatch(pathName);
            }
        };
    }
    watch(pathName) {
        return __awaiter(this, void 0, void 0, function* () {
            // Skip if the watch already exists
            if (this.watchers.get(pathName))
                return;
            //Setup watcher
            const watcher = fs_1.default.watch(pathName, (actionType, ffName) => __awaiter(this, void 0, void 0, function* () {
                const fullPath = (0, services_1.getNormalizedPath)((0, services_1.joinPath)(pathName, ffName.replace(/\\/g, '')));
                // Check if the pathName+ffName is a valid node
                const nodeType = yield (0, services_1.getFFNodeType)(fullPath);
                if (nodeType !== 'unlink') {
                    if (actionType == 'rename') { // Rename event
                        this.publish(pathName, {
                            type: 'rename',
                            payload: {
                                uid: fullPath,
                                p_uid: (0, services_1.getPath)(fullPath),
                                name: (0, services_1.getName)(fullPath),
                                isEntity: nodeType === 'folder' ? false : true,
                                children: [],
                                data: {},
                            },
                        });
                    }
                    else {
                        // File Content Change Event
                    }
                }
                else {
                    this.publish(pathName, {
                        type: 'remove',
                        payload: fullPath,
                    });
                }
            }));
            // Log and save the watcher
            console.log(`Watching ${pathName}`);
            this.watchers.set(pathName, watcher);
        });
    }
    unwatch(pathName) {
        // Skip if the watch already non exists
        const watcher = this.watchers.get(pathName);
        if (!watcher)
            return;
        // Log and remove the watcher
        watcher.close();
        this.watchers.delete(pathName);
    }
}
exports.default = FFWatcher;
//# sourceMappingURL=ffWatcher.js.map