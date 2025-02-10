import { useEffect } from "react";
import { useGlobalContext } from "../contexts/posContext";
import { useNavigate, useParams } from "react-router-dom";

const NoAccountRedirect = () => {
  const navigate = useNavigate();
  const { currentUserSession } = useGlobalContext();

  useEffect(() => {
    console.log(`Has current session account ${!!currentUserSession?.account}`);
    console.log(
      `Has current session bitcoin price ${!!currentUserSession?.bitcoinPrice}`
    );
    if (!currentUserSession.account && !currentUserSession.bitcoinPrice) {
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 150);
    }
  }, []);
};

export default NoAccountRedirect;
