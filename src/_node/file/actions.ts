import { TNodeActionType } from "..";

const create = () => {};
const remove = () => {};
const duplicate = () => {};
const move = () => {};
const copy = () => {};

export const fileActions: {
  [action in TNodeActionType]: () => void;
} = {
  create,
  remove,
  duplicate,
  move,
  copy,
};
