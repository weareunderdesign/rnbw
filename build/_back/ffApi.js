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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFF = exports.renameFF = exports.writeFileContent = exports.readFileContent = void 0;
const services_1 = require("./services");
const fs = require('fs-extra');
/**
 * read file content based on the path
 * @param pathName
 * @returns
 */
function readFileContent(pathName) {
    return __awaiter(this, void 0, void 0, function* () {
        // validate
        const nodeType = yield (0, services_1.getFFNodeType)(pathName);
        if (nodeType !== 'file') {
            return {
                success: false,
                error: 'It\'s not a file',
            };
        }
        // read file content
        return fs.readFile(pathName)
            .then((data) => {
            return {
                success: true,
                data: data.toString('utf-8'),
            };
        })
            .catch((err) => {
            return {
                sucess: false,
                error: err,
            };
        });
    });
}
exports.readFileContent = readFileContent;
/**
 * write File Content
 * @param param0
 * @returns
 */
function writeFileContent({ file, content }) {
    return __awaiter(this, void 0, void 0, function* () {
        const fullPath = file.uid;
        // validate
        const ffNodeType = yield (0, services_1.getFFNodeType)(fullPath);
        if (ffNodeType !== "file") {
            return {
                success: false,
                error: "It's not a valid file",
            };
        }
        // write content
        return fs.writeFile(fullPath, content)
            .then(() => {
            return {
                success: true,
            };
        })
            .catch((err) => {
            return {
                sucess: false,
                error: err,
            };
        });
    });
}
exports.writeFileContent = writeFileContent;
/**
 * rename folder/file with the newName
 * @param pathName
 * @param newPathName
 * @returns
 */
function renameFF(pathName, newPathName) {
    return __awaiter(this, void 0, void 0, function* () {
        // validate
        const nodeType = yield (0, services_1.getFFNodeType)(pathName);
        if (nodeType === 'unlink') {
            return {
                success: false,
                error: 'It\'s not a valid folder or file',
            };
        }
        // rename the FF
        return fs.rename(pathName, newPathName)
            .then(() => {
            return {
                success: true,
            };
        })
            .catch((err) => {
            return {
                success: false,
                error: err
            };
        });
    });
}
exports.renameFF = renameFF;
/**
 * delete folder/file with the name
 * @param uid
 * @returns
 */
function deleteFF(uid) {
    return __awaiter(this, void 0, void 0, function* () {
        const fullPath = uid;
        // validate
        const nodeType = yield (0, services_1.getFFNodeType)(fullPath);
        if (nodeType === "unlink") {
            return {
                success: false,
                error: 'It\'s not a valid folder or file',
            };
        }
        // delete file
        if (nodeType === 'file') {
            return fs.unlink(fullPath)
                .then(() => {
                return {
                    success: true,
                };
            })
                .catch((err) => {
                return {
                    success: false,
                    error: err
                };
            });
        }
        // delete folder
        return fs.rm(fullPath, { recursive: true, force: true })
            .then(() => {
            return {
                success: true,
            };
        })
            .catch((err) => {
            return {
                success: false,
                error: err
            };
        });
    });
}
exports.deleteFF = deleteFF;
/*
export async function createFF({ from, payload }: FFNodeActionAddPayload): Promise<FFApiRes> {
  const fullPath = getFullPath(from)
  const { name, type } = payload

  const ffNodeType: FFNodeType = await getFFNodeType(fullPath)
  if (ffNodeType !== "folder") {
    return {
      success: false,
      error: "You are trying to creat file not inside the folder",
    }
  }

  if (type === "file") {
    return fs.writeFile(path.join(fullPath, name), "")
      .then(() => {
        return {
          success: true,
        }
      })
      .catch((err: any) => {
        return {
          sucess: false,
          error: err
        }
      })
  } else if (type === "folder") {
    return fs.mkdir(path.join(fullPath, name), { recursive: true })
      .then(() => {
        return {
          success: true,
        }
      })
      .catch((err: any) => {
        if (err) throw err;
      });
  }

  return {
    success: false,
    error: 'Unknown Error',
  }
}


export async function moveFF({ from, to, payload }: FFNodeActionMovePayload): Promise<FFApiRes> {
  const to_fullpath = getFullPath(to)
  const from_fullpath = getFullPath(from)
  const toNodeType: FFNodeType = await getFFNodeType(to_fullpath)
  const fromNodeType: FFNodeType = await getFFNodeType(from_fullpath);

  if (toNodeType !== "folder") {
    return {
      success: false,
      error: "You can only move it to folder",
    }
  }
  if (fromNodeType === "file") {
    return fs.move(from_fullpath, path.join(to_fullpath, from.name), { overwrite: payload.overwrite })
      .then(() => {
        return {
          success: true,
        }
      })
      .catch((err: any) => {
        return {
          success: false,
          error: err,
        }
      })
  }
  else if (fromNodeType === "folder") {
    return fs.move(from_fullpath, path.join(to_fullpath, from.name), { overwrite: payload.overwrite })
      .then(() => {
        return {
          success: true,
        }
      })
      .catch((err: any) => {
        return {
          success: false,
          error: err
        }
      })
  }
  return {
    success: false,
    error: 'Unknown error'
  }
}

export async function duplicateFF({ from, to, payload }: FFNodeActionDuplicatePayload): Promise<FFApiRes> {
  const fromFullPath = getFullPath(from)
  const toFullPath = getFullPath(to)
  const fromNodeType: FFNodeType = await getFFNodeType(fromFullPath)
  const toNodeType: FFNodeType = await getFFNodeType(toFullPath)
  if (toNodeType !== "folder") {
    return {
      success: false,
      error: 'Destination is not folder.',
    }
  }
  if (fromNodeType == "file") {
    return fs.copy(fromFullPath, path.join(toFullPath, from.name), { overwrite: payload.overwrite })
      .then(() => {
        return {
          success: true,
        }
      })
      .catch((err: any) => {
        return {
          success: false,
          error: err
        }
      })
  }
  else {
    return fs.copy(fromFullPath, toFullPath, { overwrite: payload.overwrite })
      .then(() => {
        return {
          success: true,
        }
      })
      .catch((err: any) => {
        return {
          success: false,
          error: err
        }
      })
  }
}
*/ 
//# sourceMappingURL=ffApi.js.map