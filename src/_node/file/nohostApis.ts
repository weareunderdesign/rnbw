interface FilerStats {
  dev: string;
  node: string;
  type: string;
  size: number;
  nlinks: number;
  atime: string;
  mtime: string;
  ctime: string;
  atimeMs: number;
  mtimeMs: number;
  ctimeMs: number;
  mode: number;
  uid: number;
  gid: number;
  name: string;
}

/* eslint-disable @typescript-eslint/no-var-requires */
const Filer = require("filer");
export const _fs = Filer.fs;
export const _path = Filer.path;
export const _sh = new _fs.Shell();

export const _createIDBDirectory = async (path: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    _fs.exists(path, function (exists: boolean) {
      if (!exists) {
        _fs.mkdir(path, (err: Error) => {
          err ? reject(err) : resolve();
        });
      }
    });
  });
};
export const _readIDBFile = async (path: string): Promise<Uint8Array> => {
  return new Promise<Uint8Array>((resolve, reject) => {
    _fs.readFile(path, (err: Error, data: Buffer) => {
      err ? reject(err) : resolve(data);
    });
  });
};
export const _writeIDBFile = async (
  path: string,
  content: Uint8Array | string,
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    //check if the path exists in the idb
    _fs.exists(path, function (exists: boolean) {
      if (!exists) {
        //create the file
        _fs.writeFile(path, content, (err: Error) => {
          err ? reject(err) : resolve();
        });
      }
    });
  });
};
export const _removeIDBDirectoryOrFile = async (
  path: string,
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    _fs.access(path, _fs.constants.F_OK, (err: Error) => {
      if (err) {
        if (err.name === "ENOENT") {
          // Path does not exist, resolve immediately
          resolve();
        } else {
          // Other error occurred
          reject(err);
        }
      } else {
        // Path exists, attempt to remove it
        _sh.rm(path, { recursive: true }, (rmErr: Error) => {
          rmErr ? reject(rmErr) : resolve();
        });
      }
    });
  });
};
export const _readIDBDirectory = async (path: string): Promise<string[]> => {
  return new Promise<string[]>((resolve, reject) => {
    _fs.readdir(path, (err: Error, files: string[]) => {
      err ? reject(err) : resolve(files);
    });
  });
};
export const _getIDBDirectoryOrFileStat = async (
  path: string,
): Promise<FilerStats> => {
  return new Promise<FilerStats>((resolve, reject) => {
    _fs.stat(path, (err: Error, stats: FilerStats) => {
      err ? reject(err) : resolve(stats);
    });
  });
};
