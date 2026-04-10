import "./index.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useErrorDisplay } from "../../contexts/errorDisplay";
import { AlertCircle } from "lucide-react";

export default function ErrorPopup() {
  const { errorState, clearError } = useErrorDisplay();
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!errorState) return;
    setIsExiting(false);
    const timer = setTimeout(() => setIsExiting(true), 4000);
    return () => clearTimeout(timer);
  }, [errorState]);

  if (!errorState) return null;

  const { message, navigatePath, customFunction } = errorState;

  const handleAnimationEnd = () => {
    if (!isExiting) return;
    clearError();
    if (customFunction) customFunction();
    else if (navigatePath) navigate(navigatePath);
  };

  return (
    <div
      className={`error-toast-container ${
        isExiting ? "toast-exit" : "toast-enter"
      }`}
      onAnimationEnd={handleAnimationEnd}
    >
      <AlertCircle size={20} color="var(--primary)" />
      <p className="toast-text">{message}</p>
      <button className="error-toast-close" onClick={() => setIsExiting(true)}>
        ✕
      </button>
    </div>
  );
}
