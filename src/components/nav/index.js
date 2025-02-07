import icons from "../../constants/icons";
import getCurrentUser from "../../hooks/getCurrnetUser";
import "./style.css";

export default function PosNavbar({ backFunction }) {
  const User = getCurrentUser();

  return (
    <div className="POS-navbar">
      <img
        onClick={() => {
          backFunction();
        }}
        alt="Back arrow"
        className="POS-back"
        src={icons.leftArrow}
      />
      <h2 className="POS-name">{User}</h2>
    </div>
  );
}
