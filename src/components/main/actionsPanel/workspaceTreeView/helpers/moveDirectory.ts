import {
  createDirectory,
  getStat,
  readDir,
  readFile,
  removeFileSystem,
  TFileNodeData,
  writeFile,
} from '@_node/file';

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
    await createDirectory(newPath);

    const entries = await readDir(orgPath);
    await Promise.all(
      entries.map(async (entry) => {
        const c_orgPath = `${orgPath}/${entry}`;
        const c_newPath = `${newPath}/${entry}`;
        const stats = await getStat(c_orgPath);
        const c_kind = stats.type === "DIRECTORY" ? "directory" : "file";
        if (c_kind === "directory") {
          dirs.push({ orgPath: c_orgPath, newPath: c_newPath });
        } else {
          await writeFile(c_newPath, await readFile(c_orgPath));
        }
      }),
    );
  }

  // handle copy(optional)
  !copy && (await removeFileSystem(nodeData.path));
};
