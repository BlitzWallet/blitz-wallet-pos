import "./index.css";
import { useNavigate } from "react-router-dom";
export default function ErrorPopup({
  errorMessage,
  navigatePath,
  customFunction,
}) {
  const navigate = useNavigate();
  return (
    <div className="ErrorMessage-Container">
      <div className="ErrorMessage">
        <p className="ErrorMessage-Desc">{errorMessage}</p>

        <button
          onClick={() => {
            if (customFunction) {
              customFunction();
              return;
            }
            navigate(navigatePath);
          }}
        >
          Go back
        </button>
      </div>
    </div>
  );
}
