import React, { useMemo } from "react";

import { ProcessProps } from "./types";

import {
  useAppTitle,
  useProcessorUpdateOpt,
  useProcessorNodeTree,
  useProcessorValidNodeTree,
  useSaveCommand,
} from "./hooks";

export default function Process(props: ProcessProps) {
  // set app title
  useAppTitle();

  // processor-updateOpt
  useProcessorUpdateOpt();

  // useEffect(() => {
  //   if (updateOpt.parse === true) {
  //     let onlyRenderViewState = false;

  //     // parse file content
  //     let _nodeTree: TNodeTreeData = JSON.parse(JSON.stringify(nodeTree));
  //     let _nodeMaxUid = nodeMaxUid;
  //     let _fileInfo: TFileInfo;
  //     let _needToReloadIFrame = false;
  //     let _newFocusedNodeUid = "";
  //     let refuse = false;
  //     let tempFocusedItem = focusedItem;
  //     // origin state
  //     if (!ffTree[file.uid]) {
  //       return;
  //     }

  //     const _file = JSON.parse(JSON.stringify(ffTree[file.uid])) as TNode;
  //     const fileData = _file.data as TFileNodeData;

  //     if (updateOpt.from === "file") {
  //       const parserRes = parseFile(
  //         fileData.type,
  //         file.content,
  //         getReferenceData(fileData.type),
  //         osType,
  //       );
  //       const {
  //         formattedContent,
  //         contentInApp,
  //         tree,
  //         nodeMaxUid: newNodeMaxUid,
  //       } = parserRes;

  //       _nodeTree = tree;
  //       _nodeMaxUid = Number(newNodeMaxUid);

  //       fileData.content = formattedContent;
  //       fileData.contentInApp = contentInApp;
  //       fileData.changed = fileData.content !== fileData.orgContent;

  //       // reload iframe
  //       _needToReloadIFrame = true;
  //     } else if (updateOpt.from === "code" || updateOpt.from === "stage") {
  //       if (fileData.type === "html") {
  //         // detect seed node changed
  //         let seedNodeChanged = false;
  //         for (const change of codeChanges) {
  //           const { uid } = change;
  //           const node = _nodeTree[uid];
  //           if (node === undefined) continue;
  //           if (
  //             uid === RootNodeUid ||
  //             node.name === "html" ||
  //             node.name === "head" ||
  //             node.name === "body"
  //           ) {
  //             seedNodeChanged = true;
  //           }
  //         }
  //         if (seedNodeChanged) {
  //           let fileContent = file.content;
  //           if (updateOpt.from === "stage") {
  //             for (const change of codeChanges) {
  //               const { uid, content } = change;
  //               const node = _nodeTree[uid];
  //               const nodeData = node.data as THtmlNodeData;
  //               nodeData.html = content;
  //             }
  //             // rebuild from new tree
  //             const { html: formattedContent } = serializeHtml(
  //               _nodeTree,
  //               htmlReferenceData,
  //               osType,
  //             );
  //             fileContent = formattedContent;
  //           }
  //           const parserRes = parseFile(
  //             fileData.type,
  //             fileContent,
  //             htmlReferenceData,
  //             osType,
  //             null,
  //             String(_nodeMaxUid) as TNodeUid,
  //           );
  //           const { contentInApp, tree, nodeMaxUid: newNodeMaxUid } = parserRes;

  //           _nodeTree = tree;
  //           _nodeMaxUid = Number(newNodeMaxUid);

  //           fileData.content = fileContent;
  //           fileData.contentInApp = contentInApp;
  //           fileData.changed = fileData.content !== fileData.orgContent;

  //           // reload iframe
  //           _needToReloadIFrame = true;
  //         } else {
  //           // side effects
  //           codeChanges.map((codeChange) => {
  //             // ---------------------- node tree side effect ----------------------
  //             // parse code part
  //             // remove org nodes
  //             const o_node = _nodeTree[codeChange.uid]; //original node (the node which was previously focused)
  //             let parserRes: THtmlParserResponse;
  //             parserRes = parseHtmlCodePart(
  //               codeChange.content,
  //               htmlReferenceData,
  //               osType,
  //               String(_nodeMaxUid) as TNodeUid,
  //             );
  //             const {
  //               formattedContent,
  //               tree,
  //               nodeMaxUid: newNodeMaxUid,
  //             } = parserRes;

  //             if (formattedContent == "") {
  //               return;
  //             }
  //             _nodeMaxUid = Number(newNodeMaxUid);

  //             // if (codeChange.content !== formattedContent) refuse = true
  //             if (o_node === undefined) return;
  //             const o_parentNode = _nodeTree[o_node.parentUid as TNodeUid];
  //             o_parentNode.children = o_parentNode.children.reduce(
  //               (prev, cur) => {
  //                 if (cur === codeChange.uid) {
  //                   prev.push(tree[RootNodeUid].children[0]);
  //                 } else {
  //                   prev.push(cur);
  //                 }
  //                 return prev;
  //               },
  //               [] as TNodeUid[],
  //             );
  //             const o_uids = getSubNodeUidsByBfs(codeChange.uid, _nodeTree);
  //             o_uids.map((uid) => {
  //               delete _nodeTree[uid];
  //             });
  //             // add new nodes / get valid node's uid list for iframe
  //             const uids = getSubNodeUidsByBfs(RootNodeUid, tree, false);
  //             const nodeUids: TNodeUid[] = [];
  //             let _flag = false;
  //             uids.map((uid) => {
  //               const node = tree[uid];
  //               if (node.parentUid === RootNodeUid) {
  //                 !_flag && (_newFocusedNodeUid = uid);
  //                 _flag = true;
  //                 node.parentUid = o_parentNode.uid;
  //               }
  //               _nodeTree[uid] = JSON.parse(JSON.stringify(node));
  //               const nodeData = node.data as THtmlNodeData;
  //               nodeData.valid && nodeUids.push(uid);
  //             });
  //             // ---------------------- iframe side effect ----------------------
  //             // build element to replace
  //             let nodeUidIndex = -1;
  //             const divElement = document.createElement("div");
  //             if (o_node.name !== "code" && o_node.name !== "pre") {
  //               divElement.innerHTML = formattedContent;
  //               const nodes: Node[] = [divElement.childNodes[0]];
  //               while (nodes.length) {
  //                 const node = nodes.shift() as Node;
  //                 if (node === undefined) continue;
  //                 if (node.nodeName === "#text") {
  //                   continue;
  //                 }
  //                 if ((node as HTMLElement).tagName) {
  //                   (node as HTMLElement).setAttribute(
  //                     NodeInAppAttribName,
  //                     nodeUids[++nodeUidIndex],
  //                   );
  //                   node.childNodes.forEach((childNode) => {
  //                     nodes.push(childNode);
  //                   });
  //                 }
  //               }
  //               // replace element to iframe
  //               const element = document
  //                 .querySelector("iframe")
  //                 ?.contentWindow?.window.document.querySelector(
  //                   `[${NodeInAppAttribName}="${codeChange.uid}"]`,
  //                 );
  //               element?.parentElement?.insertBefore(
  //                 divElement.childNodes[0],
  //                 element.nextSibling,
  //               );
  //               element?.remove();
  //             } else {
  //               let element = document
  //                 .querySelector("iframe")
  //                 ?.contentWindow?.window.document.querySelector(
  //                   `[${NodeInAppAttribName}="${codeChange.uid}"]`,
  //                 );
  //               if (element && tree["ROOT"].data) {
  //                 element?.setAttribute(
  //                   NodeInAppAttribName,
  //                   tree["ROOT"].children[0],
  //                 );
  //                 element.outerHTML = (
  //                   tree["ROOT"].data as THtmlNodeData
  //                 ).htmlInApp;
  //               }
  //             }
  //           });
  //           // rebuild from new tree
  //           const { htmlInApp: contentInApp } = serializeHtml(
  //             _nodeTree,
  //             htmlReferenceData,
  //             osType,
  //           );
  //           fileData.content = file.content;
  //           fileData.contentInApp = contentInApp;
  //           fileData.changed = fileData.content !== fileData.orgContent;
  //         }
  //       } else {
  //         // do nothing
  //       }

  //       updateOpt.from === "code" && setCodeEditing(false);
  //     } else if (updateOpt.from === "hms") {
  //       const _currentFile = ffTree[currentFileUid];
  //       const _currentFileData = _currentFile.data as TFileNodeData;
  //       if (
  //         file.uid === currentFileUid &&
  //         file.content === _currentFileData.contentInApp
  //       ) {
  //         LogAllow && console.log("view state changed by hms");
  //         // no need to build new node tree
  //         onlyRenderViewState = true;
  //       } else {
  //         LogAllow && console.log("file content changed by hms");
  //         // parse hms content keeping node uids
  //         const parserRes = parseFile(
  //           fileData.type,
  //           file.content,
  //           getReferenceData(fileData.type),
  //           osType,
  //           true,
  //           String(_nodeMaxUid) as TNodeUid,
  //         );
  //         const {
  //           formattedContent,
  //           contentInApp,
  //           tree,
  //           nodeMaxUid: newNodeMaxUid,
  //         } = parserRes;

  //         _nodeTree = tree;
  //         _nodeMaxUid = Number(newNodeMaxUid);

  //         fileData.content = formattedContent;
  //         fileData.contentInApp = contentInApp;
  //         fileData.changed = fileData.content !== fileData.orgContent;
  //         while (!_nodeTree[tempFocusedItem]) {
  //           if (_nodeTree[tempFocusedItem] == undefined) break;
  //           tempFocusedItem = _nodeTree[tempFocusedItem].parentUid as TNodeUid;
  //         }
  //         if (file.uid !== currentFileUid) {
  //           _needToReloadIFrame = true;
  //         } else {
  //           // refresh iframe if it has seed node changes
  //           const o_uids = getSubNodeUidsByBfs(RootNodeUid, nodeTree);
  //           for (const o_uid of o_uids) {
  //             const o_node = nodeTree[o_uid];
  //             const n_node = _nodeTree[o_uid];
  //             if (!n_node) {
  //               if (
  //                 o_node.name === "html" ||
  //                 o_node.name === "head" ||
  //                 o_node.name === "body"
  //               ) {
  //                 _needToReloadIFrame = true;
  //                 break;
  //               }
  //             }
  //           }

  //           // --------------------------- iframe side effects ---------------------------
  //           if (!_needToReloadIFrame) {
  //             // get deleted/changed uids
  //             const deletedUids: TNodeUid[] = [];
  //             const _uidsToChange: TNodeUid[] = [];
  //             const n_uids = getSubNodeUidsByBfs(RootNodeUid, _nodeTree);
  //             o_uids.map((o_uid, index) => {
  //               const o_node = nodeTree[o_uid];
  //               const o_nodeData = o_node.data as THtmlNodeData;
  //               const n_uid = n_uids[index];
  //               const n_node = _nodeTree[n_uid];
  //               const n_nodeData = n_node?.data as THtmlNodeData;
  //               if (
  //                 o_uid !== n_uid &&
  //                 (o_nodeData.valid || n_nodeData?.valid)
  //               ) {
  //                 deletedUids.push(o_uid);
  //                 o_node.name !== "!doctype" &&
  //                   _uidsToChange.push(
  //                     (o_nodeData.valid
  //                       ? o_node.parentUid
  //                       : n_node.parentUid) as TNodeUid,
  //                   );
  //               }
  //             });
  //             _uidsToChange.reverse();
  //             const uidsToChange = getValidNodeUids(
  //               nodeTree,
  //               _uidsToChange
  //                 .filter((uid) => nodeTree[uid])
  //                 .reduce((prev, cur) => {
  //                   if (!prev.length || prev[prev.length - 1] !== cur) {
  //                     prev.push(cur);
  //                   }
  //                   return prev;
  //                 }, [] as TNodeUid[]),
  //             );

  //             // node tree view - this will affect to hms record
  //             // dispatch(updateFNTreeViewState({ deletedUids }))

  //             // iframe
  //             uidsToChange.map((uid) => {
  //               const n_node = _nodeTree[uid];
  //               const n_nodeData = n_node.data as THtmlNodeData;
  //               // replace html in iframe
  //               const element = document
  //                 .querySelector("iframe")
  //                 ?.contentWindow?.window.document.querySelector(
  //                   `[${NodeInAppAttribName}="${uid}"]`,
  //                 );
  //               if (element?.tagName === "HTML") {
  //                 element.innerHTML = n_nodeData.htmlInApp;
  //               } else {
  //                 element ? (element.outerHTML = n_nodeData.htmlInApp) : null;
  //               }
  //             });
  //           }
  //         }
  //         // onlyRenderViewState = true
  //       }
  //       if (tempFocusedItem !== focusedItem) {
  //         _newFocusedNodeUid = tempFocusedItem;
  //       } else {
  //         _newFocusedNodeUid = focusedItem;
  //       }
  //     } else {
  //       // do nothing
  //     }

  //     // if (refuse) {
  //     //   removeRunningActions(['processor-updateOpt'])
  //     //   return;
  //     // }

  //     // get file info from node tree
  //     if (fileData.type === "html") {
  //       _fileInfo = {
  //         title: "",
  //         scripts: [],
  //         favicon: [],
  //       } as THtmlPageSettings;
  //       // get html page settings
  //       Object.keys(_nodeTree).map((uid) => {
  //         const node = _nodeTree[uid];
  //         const nodeData = node.data as THtmlNodeData;
  //         if (nodeData.type === "tag") {
  //           if (nodeData.name === "title") {
  //             _fileInfo ? (_fileInfo.title = node.uid) : null;
  //           } else if (
  //             nodeData.name === "link" &&
  //             nodeData.attribs.rel === "icon" &&
  //             nodeData.attribs.href
  //           ) {
  //             _fileInfo && _fileInfo.favicon.push(nodeData.attribs.href);
  //           }
  //         } else if (nodeData.type === "script") {
  //           _fileInfo && _fileInfo.scripts.push(node);
  //         }
  //       });
  //       // compare new file info with org file info
  //       if (!_needToReloadIFrame && fileInfo) {
  //         const _curScripts = _fileInfo.scripts;
  //         const _orgScripts = fileInfo.scripts;

  //         const curScripts: string[] = [];
  //         const curScriptObj: { [uid: TNodeUid]: boolean } = {};
  //         _curScripts.map((script) => {
  //           const attribs = (script.data as THtmlNodeData).attribs;
  //           const uniqueStr = Object.keys(attribs)
  //             .filter((attrName) => attrName !== NodeInAppAttribName)
  //             .sort((a, b) => (a > b ? 1 : -1))
  //             .map((attrName) => {
  //               return `${attrName}${NodeUidSplitter}${attribs[attrName]}`;
  //             })
  //             .join(NodeUidSplitter);
  //           curScripts.push(uniqueStr);
  //           curScriptObj[uniqueStr] = true;
  //         });

  //         const orgScripts: string[] = [];
  //         const orgScriptObj: { [uid: string]: boolean } = {};
  //         _orgScripts.map((script) => {
  //           const attribs = (script.data as THtmlNodeData).attribs;
  //           const uniqueStr = Object.keys(attribs)
  //             .filter((attrName) => attrName !== NodeInAppAttribName)
  //             .sort((a, b) => (a > b ? 1 : -1))
  //             .map((attrName) => {
  //               return `${attrName}${NodeUidSplitter}${attribs[attrName]}`;
  //             })
  //             .join(NodeUidSplitter);
  //           orgScripts.push(uniqueStr);
  //           orgScriptObj[uniqueStr] = true;
  //         });

  //         if (curScripts.length !== orgScripts.length) {
  //           _needToReloadIFrame = true;
  //         } else {
  //           for (const script of curScripts) {
  //             if (!orgScriptObj[script]) {
  //               _needToReloadIFrame = true;
  //               break;
  //             }
  //           }
  //         }
  //       }
  //     } else {
  //       // do nothing
  //     }

  //     LogAllow && _needToReloadIFrame && console.log("need to refresh iframe");
  //     if (!onlyRenderViewState) {
  //       // update idb
  //       (async () => {
  //         setFSPending(true);
  //         try {
  //           const p_fileData = ffTree[_file.parentUid as TNodeUid]
  //             .data as TFileNodeData;
  //           const previewPath = `${p_fileData.path}/${StagePreviewPathPrefix}${fileData.name}${fileData.ext}`;
  //           await writeFile(previewPath, fileData.contentInApp as string);
  //           if (fileData.type === "html") {
  //             setIFrameSrc(`rnbw${previewPath}`);
  //           } else {
  //             // do nothing
  //           }
  //         } catch (err) {}
  //         setFSPending(false);
  //       })();
  //       // update context
  //       setFFNode(_file);
  //       addRunningActions(["processor-nodeTree"]);
  //       setNodeTree(_nodeTree);
  //       setNodeMaxUid(_nodeMaxUid);
  //       setFileInfo(_fileInfo);
  //       setNeedToReloadIFrame(_needToReloadIFrame);
  //       // update redux
  //       updateOpt.from !== "hms" &&
  //         dispatch(setCurrentFileContent(fileData.contentInApp as string));
  //     }
  //     // select new focused node in code view
  //     setNewFocusedNodeUid(_newFocusedNodeUid);

  //     setUpdateOpt({
  //       parse: null,
  //       from: updateOpt.from !== "hms" ? null : updateOpt.from,
  //     });
  //     // setUpdateOpt({ parse: null, from: null })
  //   } else if (updateOpt.parse === false) {
  //     // serialize node tree data
  //     const _nodeTree: TNodeTreeData = JSON.parse(JSON.stringify(nodeTree));
  //     const _file = JSON.parse(JSON.stringify(ffTree[file.uid])) as TNode;
  //     const fileData = _file.data as TFileNodeData;

  //     if (updateOpt.from === "node") {
  //       const serializedRes = serializeFile(
  //         fileData.type,
  //         nodeTree,
  //         getReferenceData(fileData.type),
  //         osType,
  //       );
  //       if (fileData.type === "html") {
  //         const { html, htmlInApp } = serializedRes as THtmlNodeData;
  //         // update ffTree
  //         fileData.content = html;
  //         fileData.contentInApp = htmlInApp;
  //         fileData.changed = fileData.content !== fileData.orgContent;
  //       } else {
  //         // do nothing
  //       }
  //     }

  //     // update idb
  //     (async () => {
  //       setFSPending(true);
  //       try {
  //         await writeFile(fileData.path, fileData.contentInApp as string);
  //       } catch (err) {}
  //       setFSPending(false);
  //     })();
  //     // update context
  //     setFFNode(_file);
  //     addRunningActions(["processor-nodeTree"]);
  //     setNodeTree(_nodeTree);
  //     // update redux
  //     dispatch(setCurrentFileContent(fileData.contentInApp as string));

  //     setUpdateOpt({ parse: null, from: updateOpt.from });
  //   } else {
  //     // do nothing
  //   }

  //   removeRunningActions(["processor-updateOpt"]);
  // }, [updateOpt, parseFileFlag]);

  // processor-nodeTree
  useProcessorNodeTree();

  // processor-validNodeTree
  useProcessorValidNodeTree();

  // cmdk
  useSaveCommand();

  return useMemo(() => {
    return <></>;
  }, []);
}
