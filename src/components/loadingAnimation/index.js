import Lottie from "lottie-react";
import spinner from "../../assets/spinnerloading.json";

export default function LoadingAnimation() {
  return (
    <div>
      <Lottie
        style={{ width: "15vw", height: "15vw", maxWidth: 150, maxHeight: 150 }}
        autoPlay
        animationData={spinner}
        loop
      />
    </div>
  );
}
