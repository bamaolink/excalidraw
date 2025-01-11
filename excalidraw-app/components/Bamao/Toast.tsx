import React, { useEffect } from "react";
import { CloseIcon } from "../../../packages/excalidraw/components/icons";

export interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export type ItemToast = {
  id: number;
} & Pick<ToastProps, "message" | "type">;

export type AddToast = (
  message: ToastProps["message"],
  type: ToastProps["type"],
) => void;

export type RemoveToast = (id: number) => void;

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const backgroundColor = type === "success" ? "#4caf50" : "#f44336";

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // 3 秒后自动关闭

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="bm-toast"
      style={{
        backgroundColor,
      }}
    >
      <span>{message}</span>
      <button onClick={onClose}>{CloseIcon}</button>
    </div>
  );
};

export default Toast;
