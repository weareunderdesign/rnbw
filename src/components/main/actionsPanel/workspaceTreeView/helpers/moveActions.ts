import {useContext} from 'react';

import { 
	TFileNodeData, 
	createDirectory, 
	getStat, 
	readDir, 
	readFile, 
	removeFileSystem, 
	writeFile 
} from '@_node/file';
import { MainContext } from '@_redux/main';


export const moveActions = () =>{

  const { addMessage } = useContext(MainContext);

	const moveLocalFF = async (
		handler: FileSystemHandle,
		parentHandler: FileSystemDirectoryHandle,
		targetHandler: FileSystemDirectoryHandle,
		newName: string,
		copy: boolean = false,
		showWarning: boolean = false,
	  ) => {
		if (handler.kind === "directory") {
		  // validate if the new name exists
		  let exists = true;
		  try {
			await targetHandler.getDirectoryHandle(newName, { create: false });
			exists = true;
		  } catch (err) {
			exists = false;
		  }
		  if (exists) {
			showWarning &&
			  addMessage({
				type: "error",
				content: "Folder with the same name already exists.",
			  });
			return;
		  }
	
		  // move nested handler-dir to targetHandler with the newName - copy (optional)
		  try {
			const newHandler = await targetHandler.getDirectoryHandle(newName, {
			  create: true,
			});
			const newDirHandlers = [newHandler];
			const dirHandlers = [handler as FileSystemDirectoryHandle];
			while (dirHandlers.length) {
			  const dirHandler = dirHandlers.shift() as FileSystemDirectoryHandle;
			  const newDirHandler =
				newDirHandlers.shift() as FileSystemDirectoryHandle;
			  for await (const entry of dirHandler.values()) {
				if (entry.kind === "directory") {
				  const newDir = await newDirHandler.getDirectoryHandle(
					entry.name,
					{ create: true },
				  );
				  dirHandlers.push(entry);
				  newDirHandlers.push(newDir);
				} else {
				  const newFile = await newDirHandler.getFileHandle(entry.name, {
					create: true,
				  });
				  const content = await (entry as FileSystemFileHandle).getFile();
				  const writableStream = await newFile.createWritable();
				  await writableStream.write(content);
				  await writableStream.close();
				}
			  }
			}
	
			// handle copy(optional)
			!copy &&
			  (await parentHandler.removeEntry(handler.name, { recursive: true }));
		  } catch (err) {
			throw "error";
		  }
		} else {
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
			!copy &&
			  (await parentHandler.removeEntry(handler.name, { recursive: true }));
		  } catch (err) {
			throw "error";
		  }
		}
	};
	
	const moveIDBFF = async (
		nodeData: TFileNodeData,
		targetNodeData: TFileNodeData,
		newName: string,
		copy: boolean = false,
		showWarning: boolean = false,
	  ) => {
		if (nodeData.kind === "directory") {
		  // validate if the new name exists
		  let exists = true;
		  try {
			await getStat(`${targetNodeData.path}/${newName}`);
			exists = true;
		  } catch (err) {
			exists = false;
		  }
		  if (exists) {
			showWarning &&
			  addMessage({
				type: "error",
				content: "Folder with the same name already exists.",
			  });
			return;
		  }
	
		  // move nested handler-dir to targetHandler with the newName - copy (optional)
		  try {
			const dirs = [
			  {
				orgPath: nodeData.path,
				newPath: `${targetNodeData.path}/${newName}`,
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
		  } catch (err) {
			throw "error";
		  }
		} else {
		  // validate if the new name exists
		  let exists = true;
		  try {
			await getStat(`${targetNodeData.path}/${newName}`);
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
			await writeFile(
			  `${targetNodeData.path}/${newName}`,
			  await readFile(nodeData.path),
			);
	
			// handle copy(optional)
			!copy && (await removeFileSystem(nodeData.path));
		  } catch (err) {
			throw "error";
		  }
		}
	};

	return {
		moveLocalFF,
		moveIDBFF,
	}
}