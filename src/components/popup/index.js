import React, { useEffect, useState } from "react";
import "./style.css";
import { copyTextToClipboard } from "../../functions/copyToClipboard";
import { CircleCheck } from "lucide-react";
import { useCopyToast } from "../../contexts/copyToast";

export default function CopyToastPopup() {
  const { toastContent, clearCopyToast } = useCopyToast();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!toastContent) return;
    copyTextToClipboard(toastContent);
    setIsExiting(false);
    const timer = setTimeout(() => setIsExiting(true), 2000);
    return () => clearTimeout(timer);
  }, [toastContent]);

  if (!toastContent) return null;

  return (
    <div
      className={`toast-container ${isExiting ? "toast-exit" : "toast-enter"}`}
      onAnimationEnd={() => {
        if (isExiting) clearCopyToast();
      }}
    >
      <CircleCheck size={20} color="var(--primary)" />
      <p className="toast-text">Copied to clipboard</p>
    </div>
  );
}
