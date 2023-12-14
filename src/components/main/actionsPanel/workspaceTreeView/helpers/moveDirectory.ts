import { TFileNodeData } from "@_node/file";
import {
  _createIDBDirectory,
  _getIDBDirectoryOrFileStat,
  _readIDBDirectory,
  _readIDBFile,
  _removeIDBDirectoryOrFile,
  _writeIDBFile,
} from "@_node/file/nohostApis";

export const moveDirectory = async (
  orgPath: string,
  newPath: string,
  copy: boolean,
  nodeData: TFileNodeData,
) => {
  const dirs = [
    {
      orgPath,
      newPath,
    },
  ];

  while (dirs.length) {
    const { orgPath, newPath } = dirs.shift() as {
      orgPath: string;
      newPath: string;
    };
    await _createIDBDirectory(newPath);

    const entries = await _readIDBDirectory(orgPath);
    await Promise.all(
      entries.map(async (entry) => {
        const c_orgPath = `${orgPath}/${entry}`;
        const c_newPath = `${newPath}/${entry}`;
        const stats = await _getIDBDirectoryOrFileStat(c_orgPath);
        const c_kind = stats.type === "DIRECTORY" ? "directory" : "file";
        if (c_kind === "directory") {
          dirs.push({ orgPath: c_orgPath, newPath: c_newPath });
        } else {
          await _writeIDBFile(c_newPath, await _readIDBFile(c_orgPath));
        }
      }),
    );
  }

  // handle copy(optional)
  !copy && (await _removeIDBDirectoryOrFile(nodeData.path));
};
