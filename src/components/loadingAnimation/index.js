import Lottie from "lottie-react";
import spinner from "../../../public/assets/spinnerloading.json";

export default function LoadingAnimation() {
  return (
    <div>
      <Lottie autoPlay animationData={spinner} loop />
    </div>
  );
}
