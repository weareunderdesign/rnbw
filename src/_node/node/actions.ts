import { TNodeActionType } from "..";

const create = () => {};
const remove = () => {};
const duplicate = () => {};
const move = () => {};
const copy = () => {};

export const nodeActions: {
  [action in TNodeActionType]: () => void;
} = {
  create,
  remove,
  duplicate,
  move,
  copy,
};
