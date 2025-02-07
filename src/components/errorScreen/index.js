import { clearAccount } from "../../functions/localStorage";
import "./index.css";
import { useNavigate } from "react-router-dom";
export default function ErrorPopup({ errorMessage, navigatePath }) {
  const navigate = useNavigate();
  return (
    <div className="ErrorMessage-Container">
      <div className="ErrorMessage">
        <p className="ErrorMessage-Desc">{errorMessage}</p>

        <button
          onClick={() => {
            console.log("TEST");
            clearAccount();
            navigate(navigatePath, { replace: true });
          }}
        >
          Go back
        </button>
      </div>
    </div>
  );
}
