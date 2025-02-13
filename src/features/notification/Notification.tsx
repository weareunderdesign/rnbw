import * as monaco from "monaco-editor";
import { SVGIcon } from "@src/components";
import React, { useCallback } from "react";
import {
  ErrorNotificationData,
  InfoNotificationData,
  NotificationEvent,
} from "@src/types/notification.types";
import { useSelector } from "react-redux";
import { AppState } from "@src/_redux/_root";

interface NotificationProps extends NotificationEvent {
  id: string;
  removeNotification: (id: string) => void;
}

export const Notification: React.FC<NotificationProps> = ({
  id,
  type,
  data,
  removeNotification,
}) => {
  const { editorInstance } = useSelector(
    (state: AppState) => state.main.editor,
  );

  const getToastIcon = () => {
    if (type === "info") {
      const infoData = data as InfoNotificationData; // Type assertion since we know it's InfoNotificationData when type is "info"
      switch (infoData.category) {
        case "success":
          return "checkbox";
        case "error":
          return "cross";
        case "warning":
          return "triangle";
        default:
          return "help";
      }
    }
    return "help";
  };

  const handleParseErrorFix = useCallback(() => {
    if (type === "error") {
      const errorData = data as ErrorNotificationData;
      if (errorData.type !== "parse") return;

      const error = errorData.error;
      if (!error) return;

      if (!editorInstance) return;
      const model = editorInstance.getModel();
      if (!model) return;

      // Ensure line and column are valid
      const validLine = Math.max(1, error.startLine) - 1;
      if (editorInstance) {
        const model = editorInstance.getModel();
        if (model) {
          const lineContent = model.getLineContent(validLine);
          // Create a range that highlights the specific location
          const range = new monaco.Range(
            validLine, // start the valid line that causes the error
            1, // start from the begeinning of the column
            validLine, // end the valid line that causes the error
            lineContent.length + 1, // highlighting the whole correct line columns
          );

          // Set selection and reveal the line
          editorInstance.setSelection(range);
          editorInstance.revealLineInCenter(validLine);
        }
      }
    }
    removeNotification(id);
  }, [editorInstance, type, data, id, removeNotification]);

  return (
    <div className="radius-s background-primary padding-m gap-s align-center box box-l shadow animate duration-normal ease-in">
      <SVGIcon name={getToastIcon()} prefix="raincons" className="icon-xs" />

      <span className="text-s">{data.message}</span>
      {type !== "error" && (
        <SVGIcon
          name="cross"
          prefix="raincons"
          className="icon-xs"
          onClick={() => removeNotification(id)}
        />
      )}
      {type === "error" && (
        <SVGIcon
          name="right"
          prefix="raincons"
          className="icon-xs"
          onClick={handleParseErrorFix}
        />
      )}
    </div>
  );
};

export default Notification;
