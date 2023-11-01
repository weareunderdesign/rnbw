import { TCmdkReferenceData } from "@_types/main";

export const addDefaultCmdkActions = (
  cmdkReferenceData: TCmdkReferenceData,
) => {
  // Clear
  cmdkReferenceData["Clear"] = {
    Name: "Clear",
    Icon: "",
    Description: "",
    "Keyboard Shortcut": {
      cmd: true,
      shift: true,
      alt: false,
      key: "KeyR",
      click: false,
    },
    Group: "default",
    Context: "all",
  };
  // Jumpstart
  cmdkReferenceData["Jumpstart"] = {
    Name: "Jumpstart",
    Icon: "",
    Description: "",
    "Keyboard Shortcut": {
      cmd: false,
      shift: false,
      alt: false,
      key: "KeyJ",
      click: false,
    },
    Group: "default",
    Context: "all",
  };
  // Actions
  cmdkReferenceData["Actions"] = {
    Name: "Actions",
    Icon: "",
    Description: "",
    "Keyboard Shortcut": {
      cmd: false,
      shift: false,
      alt: false,
      key: "KeyW",
      click: false,
    },
    Group: "default",
    Context: "all",
  };
  // File Save
  cmdkReferenceData["Save"] = {
    Name: "Save",
    Icon: "",
    Description: "",
    "Keyboard Shortcut": {
      cmd: true,
      shift: false,
      alt: false,
      key: "KeyS",
      click: false,
    },
    Group: "default",
    Context: "all",
  };
};
