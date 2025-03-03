import { Navigate, useLocation } from "react-router-dom";
import { useGlobalContext } from "./posContext";
import getCurrentUser from "../hooks/getCurrnetUser";

export const ProtectedRoute = ({ children }) => {
  const { currentUserSession } = useGlobalContext();
  const location = useLocation();
  const currentUser = getCurrentUser();

  if (
    !currentUserSession.account ||
    !location.pathname.startsWith(`/${currentUser}`)
  ) {
    return <Navigate to={`/${currentUser}`} replace />;
  }

  return children;
};
