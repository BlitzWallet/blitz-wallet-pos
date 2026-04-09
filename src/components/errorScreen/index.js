import "./index.css";
import { useNavigate } from "react-router-dom";
import { useErrorDisplay } from "../../contexts/errorDisplay";

export default function ErrorPopup() {
  const { errorState, clearError } = useErrorDisplay();
  const navigate = useNavigate();

  if (!errorState) return null;

  const { message, navigatePath, customFunction } = errorState;

  const handleDismiss = () => {
    clearError();
    if (customFunction) {
      customFunction();
    } else if (navigatePath) {
      navigate(navigatePath);
    }
  };

  return (
    <div className="ErrorMessage-Container">
      <div className="ErrorMessage">
        <p className="ErrorMessage-Desc">{message}</p>
        <button onClick={handleDismiss}>Go back</button>
      </div>
    </div>
  );
}
