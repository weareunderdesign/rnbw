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
exports.selectFolderFromModal = exports.loadFolderStructure = exports.getFFNodeType = exports.getFileExtension = exports.joinPath = exports.getName = exports.getPath = exports.getNormalizedPath = exports.createResMessage = void 0;
const fs_1 = __importDefault(require("fs"));
const types_1 = require("./types");
/**
 * return JSON string from the message
 * @param message
 * @returns
 */
const createResMessage = (message) => {
    return JSON.stringify(message);
};
exports.createResMessage = createResMessage;
/**
 * remove line terminator at the end of the path - remove double //
 * @param pathName
 * @returns
 */
const getNormalizedPath = (pathName) => {
    return pathName.replace(/\n$/g, '').split('/').filter(p => !!p).join('/');
};
exports.getNormalizedPath = getNormalizedPath;
/**
 * get parent path
 * @param fullPath
 * @returns
 */
const getPath = (fullPath) => {
    const pathArr = fullPath.split('/').filter(p => !!p);
    pathArr.pop();
    return pathArr.join('/');
};
exports.getPath = getPath;
/**
 * get the name from the full path
 * @param fullPath
 * @returns
 */
const getName = (fullPath) => {
    const pathArr = fullPath.split('/').filter(p => !!p);
    return pathArr.pop();
};
exports.getName = getName;
/**
 * return pathName/ffName
 * @param pathName
 * @param ffName
 * @returns
 */
const joinPath = (pathName, ffName) => {
    return `${pathName}/${ffName}`;
};
exports.joinPath = joinPath;
/**
 * get the file extension from the filename
 * @param fileName
 * @returns
 */
const getFileExtension = (fileName) => {
    const fileNameArr = fileName.split('.');
    if (fileNameArr.length) {
        const fileExtension = fileNameArr[fileNameArr.length - 1];
        return !types_1.parsable[fileExtension] ? 'unknown' : fileExtension;
    }
    return 'unknown';
};
exports.getFileExtension = getFileExtension;
/**
 * detect if the path is a folder or a file or unlink
 * @param pathName
 * @returns
 */
function getFFNodeType(pathName) {
    return __awaiter(this, void 0, void 0, function* () {
        return fs_1.default.promises
            .stat(pathName)
            .then((node) => {
            if (node.isDirectory())
                return "folder";
            return "file";
        })
            .catch((err) => {
            return "unlink";
        });
    });
}
exports.getFFNodeType = getFFNodeType;
/**
 * load folder structure and return with it's children
 * @param folder
 * @returns
 */
function loadFolderStructure(folder) {
    return __awaiter(this, void 0, void 0, function* () {
        const fullPath = folder.uid;
        const nodeList = yield fs_1.default.promises.readdir(fullPath);
        let nodes = yield Promise.all(nodeList.map((name) => __awaiter(this, void 0, void 0, function* () {
            const ffNodeType = yield getFFNodeType((0, exports.joinPath)(fullPath, name));
            return {
                uid: (0, exports.joinPath)(folder.uid, name),
                p_uid: folder.uid,
                name: name,
                isEntity: ffNodeType === 'file' ? true : false,
                children: [],
                data: {},
            };
        })));
        nodes = nodes.sort((a, b) => {
            return (!a.isEntity && b.isEntity) ? -1 : 0;
        });
        folder.children = nodes.map((node) => {
            return node.uid;
        });
        return [folder, ...nodes];
    });
}
exports.loadFolderStructure = loadFolderStructure;
/**
 * open folder-select-modal and return the selected ff path
 * @returns
 */
function selectFolderFromModal() {
    return __awaiter(this, void 0, void 0, function* () {
        /* return {
          success: true,
          path: "D:/",
        } */
        const dialog = require('node-file-dialog');
        const config = { type: 'directory' };
        return dialog(config)
            .then((dir) => {
            return {
                success: true,
                path: dir[0],
            };
        })
            .catch((err) => {
            console.log(err);
            return {
                success: false,
                error: err,
            };
        });
    });
}
exports.selectFolderFromModal = selectFolderFromModal;
//# sourceMappingURL=services.js.map