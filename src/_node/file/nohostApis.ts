import { Buffer } from "buffer";

export const _fs = window.Filer.fs;
export const _path = window.Filer.path;
export const _sh = new _fs.Shell();

export const _createIDBDirectory = async (path: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    _fs.mkdir(path, (err: any) => {
      err ? reject(err) : resolve();
    });
  });
};
export const _readIDBFile = async (path: string): Promise<Uint8Array> => {
  return new Promise<Uint8Array>((resolve, reject) => {
    _fs.readFile(path, (err: any, data: Buffer) => {
      err ? reject(err) : resolve(data);
    });
  });
};
export const _writeIDBFile = async (
  path: string,
  content: Uint8Array | string,
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    _fs.writeFile(path, content, (err: any) => {
      err ? reject(err) : resolve();
    });
  });
};
export const _removeIDBDirectoryOrFile = async (
  path: string,
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    _sh.rm(path, { recursive: true }, (err: any) => {
      err ? reject(err) : resolve();
    });
  });
};
export const _readIDBDirectory = async (path: string): Promise<string[]> => {
  return new Promise<string[]>((resolve, reject) => {
    _fs.readdir(path, (err: any, files: string[]) => {
      err ? reject(err) : resolve(files);
    });
  });
};
export const _getIDBDirectoryOrFileStat = async (
  path: string,
): Promise<any> => {
  return new Promise<any>((resolve, reject) => {
    _fs.stat(path, (err: any, stats: any) => {
      err ? reject(err) : resolve(stats);
    });
  });
};
