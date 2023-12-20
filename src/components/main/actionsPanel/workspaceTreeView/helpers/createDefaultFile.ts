import { RootNodeUid } from "@_constants/index";
import { TFileHandlerCollection, getIndexHtmlContent } from "@_node/index";

export const createDefaultFile = async (
  fileHandlers: TFileHandlerCollection,
) => {
  const indexHtmlContent = getIndexHtmlContent();
  const newFile = await (
    fileHandlers[RootNodeUid] as FileSystemDirectoryHandle
  ).getFileHandle("index.html", {
    create: true,
  });
  const writableStream = await newFile.createWritable();
  await writableStream.write(indexHtmlContent);
  await writableStream.close();
};
