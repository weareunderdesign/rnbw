import { useContext, useEffect } from "react";
import { useSelector } from "react-redux";

import { RainbowAppName } from "@_constants/main";
import { TFileNodeData } from "@_node/file";
import { THtmlNodeData } from "@_node/html";
import { MainContext, navigatorSelector } from "@_redux/main";

export const useAppTitle = () => {
  const { file } = useSelector(navigatorSelector);
  const { ffTree, nodeTree } = useContext(MainContext);

  useEffect(() => {
    if (file.uid === "") {
      window.document.title = RainbowAppName;
    } else {
      const _file = ffTree[file.uid];
      if (!_file) return;
      const fileData = _file.data as TFileNodeData;
      if (ffTree[file.uid].data.type === "html") {
        let _title = `${fileData.name}${fileData.ext}`;
        Object.keys(nodeTree).map((uid) => {
          const node = nodeTree[uid];
          const nodeData = node.data as THtmlNodeData;

          if (nodeData.type === "tag") {
            if (nodeData.name === "title") {
              _title = nodeData.data.replace(/<[^>]*>/g, "");
              return;
            }
          }
        });
        window.document.title = _title;
      } else {
        window.document.title = `${fileData.name}${fileData.ext}`;
      }
    }
  }, [file.uid, nodeTree, ffTree]);
};
