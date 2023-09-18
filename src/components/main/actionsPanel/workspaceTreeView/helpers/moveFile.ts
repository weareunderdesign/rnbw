import { useContext } from "react";

import { MainContext } from "@_redux/main";

export const moveFile = async (
    handler: FileSystemHandle,
    parentHandler: FileSystemDirectoryHandle,
    targetHandler: FileSystemDirectoryHandle,
    newName: string,
    copy: boolean,
    showWarning: boolean,
  ) => {

	const { addMessage } = useContext(MainContext);


    // validate if the new name exists
    let exists = true;
    try {
      await targetHandler.getFileHandle(newName, { create: false });
      exists = true;
    } catch (err) {
      exists = false;
    }
    if (exists) {
      showWarning &&
        addMessage({
          type: "error",
          content: "File with the same name already exists.",
        });
      return;
    }

    // create a new file with the new name and write the content
    try {
      const newFile = await targetHandler.getFileHandle(newName, {
        create: true,
      });
      const content = await (handler as FileSystemFileHandle).getFile();
      const writableStream = await newFile.createWritable();
      await writableStream.write(content);
      await writableStream.close();

      // handle copy(optional)
      !copy && (await parentHandler.removeEntry(handler.name, { recursive: true }));
    } catch (err) {
      throw new Error("error");
    }
  };