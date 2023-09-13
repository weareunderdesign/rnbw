import React, { useContext } from "react";

import { SVGIconI } from "@_components/common";
import { MainContext } from "@_redux/main";
import { useNavigationPanelHandlers } from "../hooks";

export const ProjectPanel = React.memo(() => {
  const { project } = useContext(MainContext);

  const { onProjectClick } = useNavigationPanelHandlers();

  // const handleImageError = useCallback(() => {
  //   console.log("error");
  //   setFaviconFallback(true);
  // }, [faviconFallback]);
  return (
    <>
      {/* workspace */}
      {/* <>
                <div onClick={onWorkspaceClick}>
                  <img className='icon-s' src={unsavedProject ? (theme === 'Light' ? unsavedLightProjectImg : unsavedDarkProjectImg) : (theme === 'Light' ? projectLightImg : projectDarkImg)}></img>
                </div>
              </>
              <span className="text-s opacity-m">/</span> */}
      {/* project */}
      <div className="gap-s align-center" onClick={onProjectClick}>
        {/* {favicon === null || favicon === "" || faviconFallback ?  */}
        <SVGIconI {...{ class: "icon-xs" }}>folder</SVGIconI>
        {/* <img className='icon-s' onError={handleImageError} style={{'width': '18px', 'height' : '18px'}} src={project.context === 'idb' ? 'https://rnbw.company/images/favicon.png' : favicon}></img> */}
        {/* } */}

        <span className="text-s">{project.name}</span>
      </div>
      <span className="text-s opacity-m">/</span>
    </>
  );
});
