import useRnbw from "@_services/useRnbw";

export default function useRemoveEmptyFolders() {
  const rnbw = useRnbw();
  async function removeEmptyFolders() {
    const fileTree = rnbw.files.getRootTree();
    const emptyFolders: string[] = [];
    Object.keys(fileTree).forEach(async (key) => {
      const node = fileTree[key];
      if (!node.isEntity && node.children.length === 0) {
        if (node.children.length === 0) {
          emptyFolders.push(node.uid);
        }
      }
    });

    if (emptyFolders.length === 0) {
      return;
    }
    try {
      await rnbw.files.remove({ uids: emptyFolders });
    } catch (err) {
      console.error(err);
    }
  }

  const config = {
    name: "Remove Empty Folders",
    action: removeEmptyFolders,
    description: "Remove all empty folders from the project",
    shortcuts: ["cmd+shift+e"],
  };
  return config;
}
