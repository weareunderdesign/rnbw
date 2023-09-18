export const copyDirectory = async (
    source: FileSystemDirectoryHandle,
    destination: FileSystemDirectoryHandle,
    copy: boolean,
  ) => {
    const dirQueue = [
      {
        source,
        destination,
      },
    ];

    while (dirQueue.length) {
      const { source, destination } = dirQueue.shift() as {
        source: FileSystemDirectoryHandle;
        destination: FileSystemDirectoryHandle;
      };

      for await (const entry of source.values()) {
        if (entry.kind === "directory") {
          const newDir = await destination.getDirectoryHandle(entry.name, {
            create: true,
          });
          dirQueue.push({
            source: entry as FileSystemDirectoryHandle,
            destination: newDir,
          });
        } else {
          const newFile = await destination.getFileHandle(entry.name, {
            create: true,
          });
          const content = await (entry as FileSystemFileHandle).getFile();
          const writableStream = await newFile.createWritable();
          await writableStream.write(content);
          await writableStream.close();
        }
      }
    }

    // Handle copy (optional)
    !copy && (await source.removeEntry(destination.name, { recursive: true }));
  };