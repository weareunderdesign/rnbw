import { TProject } from "@_types/main";

export const isSelected = (_project: TProject, project: TProject) => {
  return _project.context === project.context &&
    _project.name === project.name &&
    _project.handler === project.handler
    ? "selected"
    : "";
};
