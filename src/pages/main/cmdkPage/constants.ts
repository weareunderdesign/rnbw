// cmdk pages placeholders
export const PLACEHOLDERS = {
  Jumpstart: "Jumpstart...",
  Actions: "Do something...",
  Add: "Add something...",
  "Turn into": "Turn into...",
};

// commands after which to keep cmdk open
export const COMMANDS_TO_KEEP_MODAL_OPEN = [
  "Theme",
  "Autosave",
  "Format Code",
  "Add",
  "Turn into",
  "Word Wrap",
];

// pages that can't be opened by other cmdk from within itself
export const SINGLE_CMDK_PAGE = ["Jumpstart", "Add", "Turn into"];

// pages can be opened from other cmdk
export const DEEP_CMDK_PAGE = ["Add", "Turn into"];
