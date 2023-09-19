import { useContext } from "react";
import { useDispatch, useSelector } from "react-redux";

import { NodeInAppAttribName, RootNodeUid } from "@_constants/main";
import { TFileNodeData } from "@_node/file";
import { THtmlNodeData } from "@_node/html";
import { MainContext, expandFFNode, ffSelector } from "@_redux/main";

export const handleWebComponentDblClick = (
	ele:HTMLElement,
	externalDblclick: React.MutableRefObject<boolean>
) => {

	const dispatch = useDispatch();
	const { expandedItemsObj } = useSelector(ffSelector);
	const {
	  setNavigatorDropDownType,
	  ffTree,
	  setInitialFileToOpen,
	  validNodeTree,
	} = useContext(MainContext);

	let _ele = ele;
	let flag = true;
	let exist = false;
	if (!externalDblclick.current) {
	  while (flag) {
		if (_ele.getAttribute(NodeInAppAttribName) !== null) {
		  let uid = _ele.getAttribute(NodeInAppAttribName);
		  if (uid) {
			for (let x in ffTree) {
			  const node = validNodeTree[uid];
			  const defineRegex =
				/customElements\.define\(\s*['"]([\w-]+)['"]/;
			  if (
				(ffTree[x].data as TFileNodeData).content &&
				(ffTree[x].data as TFileNodeData).ext === ".js"
			  ) {
				const match = (
				  ffTree[x].data as TFileNodeData
				).content.match(defineRegex);
				if (match) {
				  // check web component
				  if (
					_ele.tagName.toLowerCase() === match[1].toLowerCase()
				  ) {
					const fileName = (ffTree[x].data as TFileNodeData).name;
					let src = "";
					for (let i in validNodeTree) {
					  if (
						(validNodeTree[i].data as THtmlNodeData).type ===
						  "script" &&
						(
						  validNodeTree[i].data as THtmlNodeData
						).html.search(fileName + ".js") !== -1
					  ) {
						src = (validNodeTree[i].data as THtmlNodeData)
						  .attribs.src;
						break;
					  }
					}
					if (src !== "") {
					  if (src.startsWith("http") || src.startsWith("//")) {
						alert("rnbw couldn't find its source file");
						flag = false;
						break;
					  } else {
						setInitialFileToOpen(ffTree[x].uid);
						setNavigatorDropDownType("project");
						// Expand path to the uid
						const _expandedItems = [];
						let _file = ffTree[x];
						while (_file && _file.uid !== RootNodeUid) {
						  _file = ffTree[_file.parentUid as string];
						  if (
							_file &&
							!_file.isEntity &&
							(!expandedItemsObj[_file.uid] ||
							  expandedItemsObj[_file.uid] === undefined)
						  )
							_expandedItems.push(_file.uid);
						}
						dispatch(expandFFNode(_expandedItems));
						flag = false;
						exist = true;
						break;
					  }
					}
				  }
				}
			  }
			}
			flag = false;
		  } else {
			flag = false;
		  }
		} else if (_ele.parentElement) {
		  _ele = _ele.parentElement;
		} else {
		  flag = false;
		}
	  }
	} else {
	  exist = true;
	}
  
	if (!exist) {
	  alert("rnbw couldn't find its source file");
	}
  };