function actionFunction(callbackFn) {
  console.log("The action has been executed!");
  callbackFn();
}

const rnbwAction = {
  name: "turnInto",
  description:
    "Converts one type of html element into another type of html element.",
  execute: actionFunction,
  shortcuts: ["cmd+f2"],
};

export default rnbwAction;
