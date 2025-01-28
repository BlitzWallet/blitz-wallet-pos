import Lottie from "lottie-react";
import spinnerAnimation from "../../assets/spinnerloading.json";

export default function LoadingAnimation() {
  return (
    <div>
      <Lottie autoPlay animationData={spinnerAnimation} loop />
    </div>
  );
}
