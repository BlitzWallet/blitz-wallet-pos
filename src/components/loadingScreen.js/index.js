import LoadingAnimation from "../loadingAnimation";
import "./style.css";
export default function FullLoadingScreen({ text = "" }) {
  return (
    <div className="FullLoadingScreen">
      <div className="POS-LoadingScreen">
        <LoadingAnimation />
        <p className="POS-LoadingScreenDescription">{text}</p>
      </div>
    </div>
  );
}
