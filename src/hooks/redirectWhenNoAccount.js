import { useEffect } from "react";
import { useGlobalContext } from "../contexts/posContext";
import { useNavigate, useParams } from "react-router-dom";

const NoAccountRedirect = (posPageRoute) => {
  const navigate = useNavigate();
  const { currentUserSession } = useGlobalContext();

  useEffect(() => {
    console.log(currentUserSession, "CURRENT USER SESSION IN REDIRECT");
    if (!currentUserSession.account && !currentUserSession.bitcoinPrice) {
      navigate(posPageRoute, { replace: true });
    }
  }, []);
};

export default NoAccountRedirect;
