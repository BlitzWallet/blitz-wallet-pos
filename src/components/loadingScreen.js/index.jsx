import LoadingAnimation from "../loadingAnimation";
import "./style.css";
export default function FullLoadingScreen({ text = "", containerStyles = {} }) {
  return (
    <div style={containerStyles} className="FullLoadingScreen">
      <div className="POS-LoadingScreen">
        <LoadingAnimation />
        <p className="POS-LoadingScreenDescription">{text}</p>
      </div>
    </div>
  );
}
