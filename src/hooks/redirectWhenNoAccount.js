import { useEffect } from "react";
import { useGlobalContext } from "../contexts/posContext";
import { useNavigate, useParams } from "react-router-dom";

const NoAccountRedirect = (posPageRoute) => {
  const navigate = useNavigate();
  const { currentUserSession } = useGlobalContext();

  useEffect(() => {
    console.log(`Has current session account ${!!currentUserSession?.account}`);
    console.log(
      `Has current session bitcoin price ${!!currentUserSession?.bitcoinPrice}`
    );
    if (!currentUserSession.account && !currentUserSession.bitcoinPrice) {
      setTimeout(() => {
        navigate(posPageRoute, { replace: true });
      }, 150);
    }
  }, []);
};

export default NoAccountRedirect;
