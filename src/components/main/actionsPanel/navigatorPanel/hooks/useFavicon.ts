import { useContext, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootNodeUid } from "@_constants/main";
import { THtmlNodeData } from "@_node/html";
import {
  ffSelector,
  MainContext,
  navigatorSelector,
  selectFNNode,
} from "@_redux/main";
import { TProject } from "@_types/main";

export const useFavicon = (
  setFaviconFallback: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  const dispatch = useDispatch();

  const { file } = useSelector(navigatorSelector);
  const { selectedItems } = useSelector(ffSelector);
  const {
    // navigator
    workspace,
    setWorkspace,
    project,
    // file tree view
    ffTree,
    // node tree view
    validNodeTree,
  } = useContext(MainContext);

  const isFirst = useRef(true);

  useEffect(() => {
    isFirst.current = true;
  }, [file.uid]);

  useEffect(() => {
    setFaviconFallback(false);
    // set favicons of the workspace
    if (file.uid === `${RootNodeUid}/index.html`) {
      // if (validNodeTree) {
      //   let hasFavicon = false
      //   for (const x in validNodeTree) {
      //     const nodeData = validNodeTree[x].data as THtmlNodeData
      //     if (nodeData && nodeData.type === 'tag' && nodeData.name === 'link' && nodeData.attribs.rel === 'icon') {
      //       if (nodeData.attribs.href.startsWith('http') || nodeData.attribs.href.startsWith('//')) {
      //         setFavicon(nodeData.attribs.href)
      //       }
      //       else{
      //         setFavicon(window.location.origin + '/rnbw/' + project.name + '/' + nodeData.attribs.href)
      //       }
      //       hasFavicon = true
      //     }
      //   }

      //   if (!hasFavicon) {
      //     setFavicon('')
      //   }
      // }
      // else{
      //   setFavicon('')
      // }

      for (const x in validNodeTree) {
        const nodeData = validNodeTree[x].data as THtmlNodeData;
        if (
          nodeData &&
          nodeData.type === "tag" &&
          nodeData.name === "link" &&
          nodeData.attribs.rel === "icon"
        ) {
          const _projects: TProject[] = [];
          const pts = workspace.projects as TProject[];
          pts.map((_v) => {
            if (_v.name != "idb") {
              _projects.push({
                context: _v.context,
                name: _v.name,
                handler: _v.handler,
                favicon:
                  _v.name === project.name
                    ? window.location.origin +
                      "/rnbw/" +
                      project.name +
                      "/" +
                      nodeData.attribs.href
                    : _v.favicon,
              });
            }
          });
          // projectFavicons[project.name] = window.location.origin + '/rnbw/' + project.name + '/' + nodeData.attribs.href
          setWorkspace({ name: workspace.name, projects: _projects });
        }
      }
    }
    if (file.uid !== "" && isFirst.current === true) {
      let bodyId = "0";
      for (let x in validNodeTree) {
        if (
          validNodeTree[x].data.type === "tag" &&
          validNodeTree[x].data.name === "body"
        ) {
          bodyId = validNodeTree[x].uid;
          break;
        }
      }
      if (bodyId !== "0") {
        let firstNodeId = "0";
        for (let x in validNodeTree) {
          if (
            validNodeTree[x].data.type === "tag" &&
            validNodeTree[x].parentUid === bodyId
          ) {
            firstNodeId = validNodeTree[x].uid;
            break;
          }
        }
        if (firstNodeId !== "0") {
          dispatch(selectFNNode([firstNodeId]));
          isFirst.current = false;
        }
      }
    }
    console.log({
      workspace,
      project,
      ffTree,
      file,
      validNodeTree,
      selectedItems,
    });
  }, [validNodeTree]);
};
