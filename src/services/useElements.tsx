//Create
const add = () => {};
const duplicate = () => {};

//Read
const getSelectedElements = () => {};
const copy = () => {};
//Update
const cut = () => {};
const paste = () => {};
const plainPaste = () => {};
const group = () => {};
const ungroup = () => {};
const move = () => {};
const updateEditableElement = () => {};
const updateSettings = () => {};
const undo = () => {};
const redo = () => {};

//Delete
const remove = () => {};
export default function useElements() {
  return {
    add,
    duplicate,
    getSelectedElements,
    copy,
    cut,
    paste,
    plainPaste,
    group,
    ungroup,
    move,
    updateEditableElement,
    updateSettings,
    undo,
    redo,
    remove,
  };
}
