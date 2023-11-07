import React from 'react';

import { useSelector } from 'react-redux';

import { SVGIconI } from '@_components/common';
import { projectSelector } from '@_redux/main/fileTree';

import { useNavigatorPanelHandlers } from '../hooks';

export const ProjectPanel = () => {
  const project = useSelector(projectSelector);
  const { onProjectClick } = useNavigatorPanelHandlers();

  return (
    <>
      <div className="gap-s align-center" onClick={onProjectClick}>
        <SVGIconI {...{ class: "icon-xs" }}>folder</SVGIconI>
        <span className="text-s">{project.name}</span>
      </div>
      <span className="text-s opacity-m">/</span>
    </>
  );
};
